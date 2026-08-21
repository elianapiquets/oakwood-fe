import {useEffect, useState} from 'react';
import {useFetcher} from 'react-router';
import {useForm} from 'react-hook-form';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Form,
} from '~/components/ui';
import {CompanyCard} from '~/components/Account/company/CompanyCard';
import {NO_PAYMENT_TERMS, type PaymentTermsOption} from './constants';

type PaymentTermsValues = {paymentTermsTemplateId: string};

/**
 * A location's payment terms, editable in place.
 *
 * The options are the store's real `PaymentTermsTemplate` records, fetched by
 * the loader — the mutation needs their gids, so they can't be a local list the
 * way the tax choices are. "No payment terms" is the one local option, and it
 * sends `null`.
 */
export function LocationPaymentTermsCard({
  terms,
  options,
  payNowOnly,
  canEdit,
}: {
  /** Current terms, from the location or its most recent order. */
  terms: {
    id?: string | null;
    name: string;
    description?: string | null;
    dueInDays?: number | null;
    source?: string | null;
  } | null;
  options: PaymentTermsOption[];
  payNowOnly: boolean | null;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher<{error?: string}>();

  const isSaving = fetcher.state !== 'idle';
  const error = !isSaving ? (fetcher.data?.error ?? null) : null;

  const items = [
    {value: NO_PAYMENT_TERMS, label: 'No payment terms'},
    ...options.map((option) => ({value: option.id, label: option.name})),
  ];

  const methods = useForm<PaymentTermsValues>({
    defaultValues: {paymentTermsTemplateId: terms?.id ?? NO_PAYMENT_TERMS},
  });

  // Re-seed on open, so a cancelled edit doesn't stick and the form shows what
  // was actually saved.
  useEffect(() => {
    if (open) {
      methods.reset({
        paymentTermsTemplateId: terms?.id ?? NO_PAYMENT_TERMS,
      });
    }
  }, [open, terms?.id, methods]);

  const onSubmit = methods.handleSubmit((values) => {
    void fetcher.submit(
      {
        intent: 'payment-terms',
        paymentTermsTemplateId: values.paymentTermsTemplateId,
      },
      {method: 'post'},
    );
    setOpen(false);
  });

  return (
    <>
      <CompanyCard
        title="Payment Terms"
        action={
          canEdit ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              disabled={isSaving}
              className="text-sm text-navy underline disabled:text-slate-400"
            >
              {isSaving ? 'Saving…' : 'Edit'}
            </button>
          ) : null
        }
      >
        <div className="flex flex-col gap-2 px-4 py-4 text-sm text-slate-700">
          <div className="flex items-start gap-3">
            {terms ? (
              <>
                <span className="inline-block rounded border border-blue-200 bg-blue-50 px-3 py-2 font-bold text-blue-700">
                  {terms.name}
                </span>
                <span className="pt-2 text-xs text-slate-500">
                  {terms.description ??
                    (terms.dueInDays
                      ? `Payment due within ${terms.dueInDays} days of invoice.`
                      : null) ??
                    (terms.source === 'order'
                      ? "From this location's most recent order."
                      : null)}
                </span>
              </>
            ) : typeof payNowOnly === 'boolean' ? (
              <span className="inline-block rounded border border-blue-200 bg-blue-50 px-3 py-2 font-bold text-blue-700">
                {payNowOnly ? 'Pay now' : 'Net terms'}
              </span>
            ) : (
              <span className="text-slate-400">No payment terms set</span>
            )}
          </div>

          {error ? (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          ) : null}
        </div>
      </CompanyCard>

      {canEdit ? (
        <Dialog open={open} onOpenChange={setOpen} modal>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit payment terms</DialogTitle>
            </DialogHeader>

            <Form as="div" methods={methods}>
              <Form.Item name="paymentTermsTemplateId">
                <Form.Label label="Payment terms" colon={false} />
                <Form.Select id="paymentTermsTemplateId" options={items} />
                <Form.Error />
              </Form.Item>
            </Form>

            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-slate-600 underline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onSubmit()}
                className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white"
              >
                Save
              </button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
