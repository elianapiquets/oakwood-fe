import {data, redirect, type HeadersFunction} from 'react-router';
import type {
  AttributeInput,
  CartLineInput,
} from '@shopify/hydrogen/storefront-api-types';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {Route} from './+types/account.select-location';

// This route is action-only (submitted via fetcher.Form POST from
// LocationSelectionDialog). It has no UI of its own, so a stray GET here
// (e.g. a revalidation/prefetch race before client-side routing has fully
// taken over) has nothing to render — send it somewhere real instead of
// letting React Router throw "no loader for this route".
export async function loader() {
  return redirect('/account');
}

// Forwards this action's own Set-Cookie (the new cart id) on document-request
// submissions, mirroring ($locale).cart.tsx. Fetcher submissions already get
// the headers from `data()` below.
export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;

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

// `AttributeInput.value` is a required String, while a cart attribute reads
// back as nullable — drop the valueless ones rather than sending null.
function toAttributeInputs(
  attributes: readonly {key: string; value?: string | null}[] | undefined,
): AttributeInput[] {
  return (attributes ?? []).flatMap(({key, value}) =>
    value == null ? [] : [{key, value}],
  );
}

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
  // the cart's buyerIdentity, and `getBuyerContext()` reads it to
  // contextualize Storefront queries for B2B pricing.
  customerAccount.setBuyer({companyLocationId: locationId});

  // Read the current cart *before* replacing it. The cast is only needed
  // because `context` resolves to `any` (the app-wide `+types` route import
  // mismatch); `cart.get()` really does return this fragment — it's the
  // `queryFragment` the cart handler is built with in app/lib/context.ts.
  const existingCart = (
    cart.getCartId() ? await cart.get() : null
  ) as CartApiQueryFragment | null;
  const existingLines = existingCart?.lines?.nodes ?? [];

  if (!existingLines.length) {
    // Nothing to carry over. The session buyer alone is enough: the next
    // `addLines()` creates the cart with this location already attached.
    return data({success: true, purchasingCompany: null});
  }

  // `cartBuyerIdentityUpdate` is documented as silently dropping company
  // changes on a cart that already has lines, so replace the cart instead —
  // Shopify's guidance is to set the company location at creation time.
  const lines: CartLineInput[] = existingLines
    // Bundle components come back as top-level lines alongside their parent
    // (the same filter CartMain applies when rendering). Shopify re-derives
    // them from the parent, so re-adding them would double up.
    .filter(
      (line) =>
        !('parentRelationship' in line && line.parentRelationship?.parent),
    )
    .map((line) => ({
      merchandiseId: line.merchandise.id,
      quantity: line.quantity,
      attributes: toAttributeInputs(line.attributes),
    }));

  const discountCodes = (existingCart?.discountCodes ?? [])
    .filter((discount) => discount.applicable)
    .map(({code}) => code);

  // Applied gift cards can't be carried over — the Storefront API only
  // exposes their last four characters, never the code itself.
  const {
    cart: newCart,
    errors,
    userErrors,
  } = await cart.create({
    lines,
    discountCodes,
    buyerIdentity: {companyLocationId: locationId},
    ...(existingCart?.note ? {note: existingCart.note} : {}),
    ...(existingCart?.attributes?.length
      ? {attributes: toAttributeInputs(existingCart.attributes)}
      : {}),
  });

  // Keep the customer on their existing cart rather than stranding them on a
  // half-built one: don't swap the cart cookie unless the new cart is real.
  if (errors?.length || userErrors?.length || !newCart?.id) {
    return data(
      {error: 'Failed to switch location', errors, userErrors},
      {status: 500},
    );
  }

  return data(
    {
      success: true,
      // Non-null means Shopify actually applied the company location. Null
      // here is the symptom to chase in Shopify Admin (catalog/price list
      // publishing, contact role at the location), not in this file.
      purchasingCompany: newCart.buyerIdentity?.purchasingCompany ?? null,
    },
    {headers: cart.setCartId(newCart.id)},
  );
}
