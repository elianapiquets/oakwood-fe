import {useState} from 'react';
import {useFetcher} from 'react-router';

import {CompanyCard} from '~/components/Account/company/CompanyCard';
import {AddressDialog, type AddressValues} from '~/components/Address';

/** Matches the `addressTypes` argument of `companyLocationAssignAddress`. */
export type LocationAddressType = 'SHIPPING' | 'BILLING';

/**
 * One of a location's two addresses — shipping or billing — displayed, with an
 * Edit link that opens the shared `AddressDialog` prefilled.
 *
 * Submits to the location route's own action rather than the backend directly,
 * so the ownership check stays server-side: the backend's shared `x-api-key`
 * can't tell whose location this is.
 *
 * A location has exactly one of each, so saving replaces rather than appends.
 */
export function LocationAddressCard({
  title,
  addressType,
  address,
  formattedAddress,
  emptyLabel,
  canEdit,
}: {
  title: string;
  addressType: LocationAddressType;
  /** Structured, for prefilling the dialog. */
  address: AddressValues | null;
  /** Shopify's own display lines, which read better than reassembling them. */
  formattedAddress: string[] | null;
  emptyLabel: string;
  /**
   * Whether this viewer may change the address, from their role's
   * `resourcePermission` at this location. False hides the control entirely —
   * the route's action enforces the same rule, so this is presentation only.
   */
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher<{error?: string}>();

  const isSaving = fetcher.state !== 'idle';

  const error = !isSaving ? (fetcher.data?.error ?? null) : null;

  function save(next: AddressValues) {
    void fetcher.submit(
      {
        intent: 'address',
        addressType,
        address: JSON.stringify(next),
      },
      {method: 'post'},
    );
  }

  return (
    <>
      <CompanyCard
        title={title}
        action={
          canEdit ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              // disabled={isSaving}
              className="text-sm text-navy underline disabled:text-slate-400"
            >
              {isSaving ? 'Saving…' : address ? 'Edit' : 'Add'}
            </button>
          ) : <></>
        }
      >
        <div className="px-4 py-4 text-sm text-slate-700">
          {formattedAddress?.length ? (
            <address className="not-italic">
              {formattedAddress.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          ) : (
            <span className="text-slate-400">{emptyLabel}</span>
          )}

          {error ? (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {error}
            </p>
          ) : null}
        </div>
      </CompanyCard>

      {canEdit ? (
        <AddressDialog
          open={open}
          onOpenChange={setOpen}
          title={`${address ? 'Edit' : 'Add'} ${title.toLowerCase()}`}
          value={address}
          onSave={save}
        />
      ) : null}
    </>
  );
}
