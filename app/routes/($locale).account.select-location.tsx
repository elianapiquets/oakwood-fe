import {data, redirect} from 'react-router';
import type {Route} from './+types/account.select-location';

// This route is action-only (submitted via fetcher.Form POST from
// LocationSelectionDialog). It has no UI of its own, so a stray GET here
// (e.g. a revalidation/prefetch race before client-side routing has fully
// taken over) has nothing to render — send it somewhere real instead of
// letting React Router throw "no loader for this route".
export async function loader() {
  return redirect('/account');
}

// Not persisted to Shopify (no customer metafield/mutation) — this is purely
// a local navigation/purchasing context for this browser session, per design.
const CUSTOMER_LOCATIONS_QUERY = `#graphql-customer-account
  query CustomerLocationsForSelection {
    customer {
      companyContacts(first: 1) {
        nodes {
          locations(first: 10) {
            nodes {
              id
            }
          }
        }
      }
    }
  }
` as const;

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount, cart} = context;

  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return data({error: 'Not logged in'}, {status: 401});
  }

  const formData = await request.formData();
  const locationId = String(formData.get('locationId') ?? '');

  if (!locationId) {
    return data({error: 'Missing locationId'}, {status: 400});
  }

  // Re-verify server-side that this location actually belongs to the
  // customer's own company — never trust a client-submitted id directly.
  const {data: customerData} = await customerAccount.query(
    CUSTOMER_LOCATIONS_QUERY,
  );
  const contact = customerData?.customer?.companyContacts?.nodes?.[0];
  const validLocationIds = new Set(
    (contact?.locations?.nodes ?? []).map((location: any) => location.id),
  );

  if (!validLocationIds.has(locationId)) {
    return data({error: 'Invalid location'}, {status: 403});
  }

  // Hydrogen's own B2B "buyer" session slot — future cart creations (e.g.
  // the next `cart.addLines()`) automatically pick this up when building
  // the cart's buyerIdentity, so this alone covers the "no cart yet" case.
  customerAccount.setBuyer({companyLocationId: locationId});

  if (!cart.getCartId()) {
    return data({success: true});
  }

  const {errors, userErrors} = await cart.updateBuyerIdentity({
    companyLocationId: locationId,
  });

  if (errors?.length || userErrors?.length) {
    return data(
      {error: 'Failed to update cart location', errors, userErrors},
      {status: 500},
    );
  }

  return data({success: true});
}
