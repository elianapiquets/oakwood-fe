import {useEffect, useMemo, useRef, useState} from 'react';
import type {UseFormReturn} from 'react-hook-form';

import {Form} from '~/components/ui';
import type {
  AddressPrediction,
  ResolvedAddress,
} from '~/routes/api.address-suggest';
import type {AddressValues} from './constants';

/** Debounce for the suggestion request, in ms. */
const DEBOUNCE_MS = 250;

/**
 * The Address line, with suggestions from Shopify's address service via
 * `/api/address-suggest`.
 *
 * Owns the `address1` field itself rather than being dropped inside a
 * `Form.Item`, because picking a suggestion writes to its *sibling* fields
 * (city, state, ZIP) — which needs the form methods, not just this field's.
 *
 * Picking a suggestion is also what makes the ZIP validate: Shopify checks a ZIP
 * against its province, and a resolved address is internally consistent by
 * construction.
 */
export function AddressAutocomplete({
  methods,
}: {
  methods: UseFormReturn<AddressValues>;
}) {
  const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
  const [dismissed, setDismissed] = useState(false);

  // One token for the life of this component, which is how Shopify's own client
  // groups the keystrokes of a single lookup into one session.
  const sessionToken = useMemo(() => crypto.randomUUID(), []);

  const address1 = methods.watch('address1');
  const countryCode = methods.watch('countryCode');

  // Ignore a response that lands after a newer keystroke has already been sent.
  const latestRequest = useRef(0);

  useEffect(() => {
    if (dismissed || !address1 || address1.trim().length < 3) {
      setPredictions([]);
      return;
    }

    const requestId = ++latestRequest.current;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        q: address1,
        country: countryCode || 'US',
        session: sessionToken,
      });

      void fetch(`/api/address-suggest?${params.toString()}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((payload) => {
          if (requestId !== latestRequest.current) return;

          const next = (payload as {predictions?: AddressPrediction[]} | null)
            ?.predictions;
          setPredictions(next ?? []);
        })
        // A broken autocomplete should mean no suggestions, never a broken form.
        .catch(() => {
          if (requestId === latestRequest.current) setPredictions([]);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [address1, countryCode, dismissed, sessionToken]);

  async function choose(prediction: AddressPrediction) {
    setPredictions([]);
    // Suppress the refetch that setting `address1` below would otherwise
    // trigger; typing again clears this.
    setDismissed(true);

    const params = new URLSearchParams({
      id: prediction.addressId,
      session: sessionToken,
    });

    const payload = (await fetch(`/api/address-suggest?${params.toString()}`)
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)) as {address?: ResolvedAddress | null} | null;

    const address = payload?.address;
    if (!address) return;

    const setIfPresent = (
      field: keyof AddressValues,
      value: string | null | undefined,
    ) => {
      if (value) {
        methods.setValue(field, value, {shouldValidate: true});
      }
    };

    setIfPresent('address1', address.address1);
    setIfPresent('address2', address.address2);
    setIfPresent('city', address.city);
    setIfPresent('zoneCode', address.provinceCode);
    setIfPresent('zip', address.zip);
    setIfPresent('countryCode', address.countryCode);
  }

  return (
    <div className="relative">
      <Form.Item name="address1">
        <Form.Label label="Address" colon={false} required />
        <Form.Input
          id="address1"
          autoComplete="off"
          onChange={(event) => {
            setDismissed(false);
            methods.setValue('address1', event.target.value, {
              shouldValidate: true,
            });
          }}
        />
        <Form.Error />
      </Form.Item>

      {predictions.length ? (
        <div className="absolute inset-x-0 top-full z-20 mt-1 rounded border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Suggestions
            <button
              type="button"
              onClick={() => {
                setPredictions([]);
                setDismissed(true);
              }}
              aria-label="Dismiss suggestions"
              className="text-slate-400"
            >
              ✕
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto pb-1">
            {predictions.map((prediction) => (
              <li key={prediction.addressId}>
                <button
                  type="button"
                  onClick={() => void choose(prediction)}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  {prediction.description}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
