import {PlusCircleIcon} from 'lucide-react';

/**
 * Stand-in for the address form that shipping and billing will both use.
 *
 * Deliberately not wired to anything: `CompanyLocationInput.shippingAddress`
 * and `.billingAddress` take a full `CompanyAddressInput`, and that belongs in
 * a reusable component rather than being inlined here and then rewritten. The
 * created location simply has no address until then, and
 * `billingSameAsShipping` is sent as `true` so billing follows whatever
 * shipping eventually becomes.
 *
 * Rendered as a disabled row rather than omitted, so the gap is visible on the
 * page instead of silently missing — the same choice `AdminOnlyAction` makes.
 */
export function AddressPlaceholder({label}: {label: string}) {
  return (
    <button
      type="button"
      disabled
      title="Needs the shared address component"
      className="flex w-full cursor-not-allowed items-center gap-2 rounded border border-dashed border-slate-300 px-3 py-3 text-left text-sm text-slate-400"
    >
      <PlusCircleIcon aria-hidden="true" className="size-4" />
      {label}
    </button>
  );
}
