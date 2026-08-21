import {useEffect, useState} from 'react';
import {useFetcher} from 'react-router';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Form,
} from '~/components/ui';
import {CompanyCard, FieldLabel} from '~/components/Account/company/CompanyCard';
import {TAX_SETTING_OPTIONS} from './constants';

const taxSchema = z.object({
  taxRegistrationId: z.string().trim(),
  taxSetting: z.enum(['COLLECT', 'NO_COLLECT']),
});

type TaxValues = z.infer<typeof taxSchema>;

/**
 * A location's tax details, editable in place.
 *
 * Shares `TAX_SETTING_OPTIONS` with the create form, so both screens offer the
 * same choices — and only choices that survive a round trip: the whole setting
 * is one boolean on Shopify's side.
 */
export function LocationTaxCard({
  taxId,
  taxExempt,
  canEdit,
  unavailable,
}: {
  taxId: string | null;
  taxExempt: boolean | null;
  canEdit: boolean;
  /** The backend is unreachable, so `taxExempt` isn't known. */
  unavailable: boolean;
}) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher<{error?: string}>();

  const isSaving = fetcher.state !== 'idle';

  const error = !isSaving ? (fetcher.data?.error ?? null) : null;

  const methods = useForm<TaxValues>({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      taxRegistrationId: taxId ?? '',
      taxSetting: taxExempt ? 'NO_COLLECT' : 'COLLECT',
    },
  });

  // Re-seed on open so a cancelled edit doesn't persist, and so the form
  // reflects whatever the last save actually stored.
  useEffect(() => {
    if (open) {
      methods.reset({
        taxRegistrationId: taxId ?? '',
        taxSetting: taxExempt ? 'NO_COLLECT' : 'COLLECT',
      });
    }
  }, [open, taxId, taxExempt, methods]);

  const onSubmit = methods.handleSubmit((values) => {
    void fetcher.submit(
      {
        intent: 'tax',
        taxRegistrationId: values.taxRegistrationId,
        taxSetting: values.taxSetting,
      },
      {method: 'post'},
    );
    setOpen(false);
  });

  return (
    <>
      <CompanyCard
        title="Tax Details"
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
        <dl className="px-4 py-4 text-sm text-slate-700">
          <FieldLabel>Tax ID / EIN</FieldLabel>
          <dd className="mt-1 font-mono">{taxId ?? '—'}</dd>

          {unavailable ? (
            <dd className="mt-2 text-xs text-slate-400">
              Tax-exempt status needs the backend, which is unreachable.
            </dd>
          ) : null}

          {taxExempt === null ? null : (
            <dd className="mt-3 flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`flex h-4 w-4 items-center justify-center rounded text-[0.6rem] font-bold text-white ${
                  taxExempt ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                {taxExempt ? '✓' : ''}
              </span>
              <span className="text-sm">
                {taxExempt ? 'Tax exempt' : 'Not tax exempt'}
              </span>
            </dd>
          )}

          {error ? (
            <dd role="alert" className="mt-2 text-xs text-red-600">
              {error}
            </dd>
          ) : null}
        </dl>
      </CompanyCard>

      {canEdit ? (
        <Dialog open={open} onOpenChange={setOpen} modal>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit tax details</DialogTitle>
            </DialogHeader>

            <Form as="div" methods={methods} className="flex flex-col gap-3">
              <Form.Item name="taxRegistrationId">
                <Form.Label label="Tax ID" colon={false} />
                <Form.Input id="taxRegistrationId" />
                <Form.Error />
              </Form.Item>

              <Form.Item name="taxSetting">
                <Form.Label label="Tax settings" colon={false} />
                <Form.Select id="taxSetting" options={TAX_SETTING_OPTIONS} />
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
