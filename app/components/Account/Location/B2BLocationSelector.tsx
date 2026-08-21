import {CartForm} from '@shopify/hydrogen';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui';
import {useB2BLocation} from './B2BLocationProvider';
import {BriefcaseIcon, PinIcon, CheckIcon} from '~/components/Account/icons';

/**
 * Company-location picker, matching Shopify's B2B cookbook
 * (`B2BLocationSelector`): each choice submits
 * `CartForm.ACTIONS.BuyerIdentityUpdate` to `/cart`, which is the only way to
 * set buyer identity on a cart — `@inContext(buyer:)` is ignored for cart
 * queries. The `/cart` action validates that the location belongs to this
 * customer before mutating; the cookbook trusts the submitted id.
 *
 * Opens either because the customer has several locations and hasn't chosen
 * (`needsLocationSelection`), or from the account menu's Switch control.
 */
export function B2BLocationSelector() {
  const {company, companyLocationId, locations, modalOpen, setModalOpen} =
    useB2BLocation();

  if (!company || locations.length < 2) return null;

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen} modal>
      <DialogContent className="sm:max-w-md">
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

        <div className="-mx-2 divide-y divide-slate-100">
          {locations.map((location) => {
            const isSelected = companyLocationId === location.id;

            return (
              <CartForm
                key={location.id}
                route="/cart"
                action={CartForm.ACTIONS.BuyerIdentityUpdate}
                inputs={{buyerIdentity: {companyLocationId: location.id}}}
              >
                <button
                  type="submit"
                  onClick={() => setModalOpen(false)}
                  className="flex w-full items-center justify-between gap-3 rounded px-2 py-3 text-left hover:bg-slate-50"
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
                  {isSelected ? (
                    <span className="text-navy">
                      <CheckIcon />
                    </span>
                  ) : null}
                </button>
              </CartForm>
            );
          })}
        </div>

        <p className="text-xs text-slate-500">
          Your role at the selected location determines what you can order and
          approve. Switching may remove items your new location can&apos;t buy —
          the cart will tell you if that happens.
        </p>
      </DialogContent>
    </Dialog>
  );
}
