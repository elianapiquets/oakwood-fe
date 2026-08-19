import {Suspense} from 'react';
import {Await, useRouteLoaderData} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {RootLoader} from '~/root';

/**
 * "Ordering for {location}" above the cart lines, so a B2B buyer can see which
 * company location this cart belongs to before checking out.
 *
 * Prefers the location Shopify actually attached to the cart
 * (`buyerIdentity.purchasingCompany`) and falls back to the location held in
 * the session. The `data-location-source` attribute says which one won — if it
 * reads `session`, Shopify accepted the mutation without applying the company
 * location, which is a Shopify-side configuration problem rather than a
 * front-end one.
 */
export function CartLocationNotice({
  cart,
}: {
  cart: CartApiQueryFragment | null;
}) {
  const cartLocationName =
    cart?.buyerIdentity?.purchasingCompany?.location?.name ?? null;
  const companyName =
    cart?.buyerIdentity?.purchasingCompany?.company?.name ?? null;

  if (cartLocationName) {
    return (
      <CartLocationBanner
        companyName={companyName}
        locationName={cartLocationName}
        source="cart"
      />
    );
  }

  return <CartLocationNoticeFromSession />;
}

function CartLocationNoticeFromSession() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  if (!rootData) return null;

  return (
    <Suspense fallback={null}>
      <Await resolve={rootData.customer} errorElement={null}>
        {(customer) =>
          customer?.selectedLocation ? (
            <CartLocationBanner
              companyName={customer.company?.name ?? null}
              locationName={customer.selectedLocation.name}
              source="session"
            />
          ) : null
        }
      </Await>
    </Suspense>
  );
}

function CartLocationBanner({
  companyName,
  locationName,
  source,
}: {
  companyName: string | null;
  locationName: string;
  source: 'cart' | 'session';
}) {
  return (
    <p
      data-location-source={source}
      className="mb-3 flex items-center gap-2 rounded bg-slate-100 px-3 py-2 text-sm text-slate-700"
    >
      <span aria-hidden="true">📍</span>
      <span>
        Ordering for{' '}
        <span className="font-semibold text-slate-900">{locationName}</span>
        {companyName ? ` · ${companyName}` : ''}
      </span>
    </p>
  );
}
