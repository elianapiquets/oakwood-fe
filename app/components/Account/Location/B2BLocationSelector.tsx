import {useEffect, useState} from 'react';
import {useFetcher} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import {LoaderCircle} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui';
import {useB2BLocation} from './B2BLocationProvider';
import {BriefcaseIcon, PinIcon, CheckIcon} from '~/components/Account/icons';

/** The `/cart` action's failure shape; success returns the cart payload. */
type SwitchResult = {error?: string};

/**
 * The location id currently being submitted, read back out of the in-flight
 * FormData rather than mirrored into state. That keeps one source of truth: it
 * appears the moment the fetcher starts and clears itself when it settles, so
 * a failed switch reverts to the stored location with no cleanup.
 */
function readPendingLocationId(formData: FormData | undefined): string | null {
  const raw = formData?.get(CartForm.INPUT_NAME);
  if (typeof raw !== 'string') return null;

  try {
    const parsed = JSON.parse(raw) as {
      inputs?: {buyerIdentity?: {companyLocationId?: string}};
    };
    return parsed.inputs?.buyerIdentity?.companyLocationId ?? null;
  } catch {
    return null;
  }
}

/**
 * Company-location picker, matching Shopify's B2B cookbook
 * (`B2BLocationSelector`): each choice submits
 * `CartForm.ACTIONS.BuyerIdentityUpdate` to `/cart`, which is the only way to
 * set buyer identity on a cart — `@inContext(buyer:)` is ignored for cart
 * queries. The `/cart` action validates that the location belongs to this
 * customer before mutating; the cookbook trusts the submitted id.
 *
 * Submits through an explicit `useFetcher` rather than Hydrogen's `<CartForm>`
 * so the pending and error states are readable: `<CartForm>` owns its fetcher
 * internally and hands nothing back.
 *
 * Opens either because the customer has several locations and hasn't chosen
 * (`needsLocationSelection`), or from the account menu's Switch control.
 */
export function B2BLocationSelector() {
  const {
    company,
    companyLocationId,
    locations,
    modalOpen,
    setModalOpen,
    needsLocationSelection,
  } = useB2BLocation();

  const fetcher = useFetcher<SwitchResult>();
  const isSwitching = fetcher.state !== 'idle';
  const pendingLocationId = readPendingLocationId(fetcher.formData);

  // A fetcher keeps its result after the modal closes, so a switch made earlier
  // would otherwise surface a stale error on reopen — and, worse, re-trigger the
  // close-on-success effect below and shut the modal the instant Switch opened
  // it (`setModalOpen`'s identity changes whenever `requested` does). Scoping
  // both to a submission made while this modal was open avoids that.
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!modalOpen) setSubmitted(false);
  }, [modalOpen]);

  // Optimistic: the in-flight choice wins over the stored one, so the row ticks
  // immediately. Because it comes from the submission, a failure drops it and
  // the previous location reappears on its own.
  const activeLocationId = pendingLocationId ?? companyLocationId;
  const error =
    submitted && !isSwitching ? (fetcher.data?.error ?? null) : null;

  // Close on confirmed success. For a forced first selection the modal would
  // also close on its own once `needsLocationSelection` flips, but a switch
  // (opened from the account menu) sets `requested`, which only this clears.
  useEffect(() => {
    if (
      submitted &&
      fetcher.state === 'idle' &&
      fetcher.data &&
      !fetcher.data.error
    ) {
      setModalOpen(false);
    }
  }, [submitted, fetcher.state, fetcher.data, setModalOpen]);

  if (!company || locations.length < 2) return null;

  return (
    <Dialog
      open={modalOpen}
      // Swallow close requests (Escape, outside press) while a choice is
      // mandatory. The dialog is controlled, so ignoring the request is what
      // keeps it open.
      onOpenChange={(open) => {
        if (!open && needsLocationSelection) return;
        setModalOpen(open);
      }}
      disablePointerDismissal={needsLocationSelection}
      modal
    >
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={!needsLocationSelection}
      >
        <DialogHeader>
          <DialogTitle>Select a Location</DialogTitle>
          <DialogDescription>
            Choose which location you&apos;re ordering for. You can switch at
            any time from your account menu.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
          <BriefcaseIcon />
          {company.name}
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {"We couldn't switch to that location. Please try again."}
          </p>
        ) : null}

        <fetcher.Form method="post" action="/cart">
          <div className="-mx-2 divide-y divide-slate-100">
            {locations.map((location) => {
              const isSelected = activeLocationId === location.id;
              const isPending = pendingLocationId === location.id;

              return (
                <button
                  key={location.id}
                  type="submit"
                  name={CartForm.INPUT_NAME}
                  value={JSON.stringify({
                    action: CartForm.ACTIONS.BuyerIdentityUpdate,
                    inputs: {buyerIdentity: {companyLocationId: location.id}},
                  })}
                  onClick={() => setSubmitted(true)}
                  // One switch at a time: a second submit would race the first
                  // and could leave the cart on the losing location.
                  disabled={isSwitching}
                  aria-busy={isPending}
                  className="flex w-full items-center justify-between gap-3 rounded px-2 py-3 text-left hover:bg-slate-50 disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        isSelected
                          ? 'bg-navy text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <PinIcon />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        {location.name}
                      </span>
                      {location.role ? (
                        <span className="block text-xs text-blue-700">
                          {location.role}
                        </span>
                      ) : null}
                      {location.address.map((line) => (
                        <span
                          key={line}
                          className="block text-xs text-slate-500"
                        >
                          {line}
                        </span>
                      ))}
                    </span>
                  </span>
                  {isPending ? (
                    <LoaderCircle
                      className="size-4 animate-spin text-navy"
                      aria-label="Switching location"
                    />
                  ) : isSelected ? (
                    <span className="text-navy">
                      <CheckIcon />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </fetcher.Form>

        <p className="text-xs text-slate-500">
          Your role at the selected location determines what you can order and
          approve. Switching may remove items your new location can&apos;t buy —
          the cart will tell you if that happens.
        </p>
      </DialogContent>
    </Dialog>
  );
}
