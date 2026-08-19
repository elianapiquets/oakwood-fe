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

// TEMP DIAGNOSTIC: the raw Customer Account API token (shcat_...) that
// customerAccount.getBuyer() sends identifies the customer but isn't making
// purchasingCompany stick. Shopify's changelog says the Storefront API
// "now directly supports" CA API tokens, but that may not be true for
// whatever Storefront API version this shop is pinned to — this (deprecated
// but still callable) exchange mutation is the documented way older
// integrations get a genuine Storefront customerAccessToken (shpsb_...).
// Testing empirically whether swapping it in fixes purchasingCompany.
const STOREFRONT_TOKEN_EXCHANGE_MUTATION = `#graphql-customer-account
  mutation StorefrontCustomerAccessTokenCreate {
    storefrontCustomerAccessTokenCreate {
      customerAccessToken
      userErrors {
        field
        message
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

  console.warn('[select-location] requested locationId:', locationId);

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

  // TEMP DIAGNOSTIC: confirm the token Hydrogen sends as buyerIdentity's
  // customerAccessToken is actually the `shpsb_...`-prefixed token Shopify's
  // B2B docs show for cart buyer identity, not a generic Customer Account
  // API OAuth access token that only proves *who* the customer is, not
  // enough to authorize a company/location purchase context.
  const buyer = await customerAccount.getBuyer();
  console.warn(
    '[select-location] buyer session:',
    JSON.stringify({
      companyLocationId: buyer?.companyLocationId,
      customerAccessTokenPrefix: buyer?.customerAccessToken?.slice(0, 8),
      customerAccessTokenLength: buyer?.customerAccessToken?.length,
    }),
  );

  // TEMP DIAGNOSTIC: exchange for a real Storefront API token and see if
  // its prefix differs from the raw CA API token above.
  const {data: exchangeData, errors: exchangeErrors} =
    await customerAccount.mutate(STOREFRONT_TOKEN_EXCHANGE_MUTATION);
  const exchangedToken =
    exchangeData?.storefrontCustomerAccessTokenCreate?.customerAccessToken;
  console.warn(
    '[select-location] storefront token exchange:',
    JSON.stringify({
      exchangedTokenPrefix: exchangedToken?.slice(0, 8),
      exchangedTokenLength: exchangedToken?.length,
      userErrors:
        exchangeData?.storefrontCustomerAccessTokenCreate?.userErrors,
      errors: exchangeErrors,
    }),
  );

  // Shopify only reliably applies a company location when it's set at cart
  // *creation* — updating buyerIdentity.companyLocationId on a cart that
  // already has lines is documented by Shopify as unreliable (silently
  // dropped, or valid lines becoming invalid) and that's exactly what we
  // saw in testing: cart.updateBuyerIdentity reported success but the
  // returned cart's buyerIdentity.purchasingCompany stayed null. So instead
  // of updating the existing cart, carry its lines into a brand-new cart —
  // cart.create() automatically merges customerAccount.getBuyer() (the
  // companyLocationId we just set above) into the new cart's buyerIdentity.
  if (cart.getCartId()) {
    const existingCart = await cart.get();
    const lines = (existingCart?.lines?.nodes ?? [])
      .filter((line: any) => line.merchandise?.id)
      .map((line: any) => ({
        merchandiseId: line.merchandise.id,
        quantity: line.quantity,
        attributes: line.attributes,
      }));

    if (lines.length > 0) {
      const createResult = await cart.create({
        lines,
        // TEMP DIAGNOSTIC: explicitly override the auto-merged buyerIdentity
        // with the exchanged Storefront token, if we got one.
        ...(exchangedToken
          ? {buyerIdentity: {customerAccessToken: exchangedToken}}
          : {}),
      });

      if (createResult.errors?.length || createResult.userErrors?.length) {
        console.error(
          '[select-location] cart.create (location switch) failed:',
          JSON.stringify({
            errors: createResult.errors,
            userErrors: createResult.userErrors,
          }),
        );
        return data(
          {
            error: 'Failed to move cart to new location',
            errors: createResult.errors,
            userErrors: createResult.userErrors,
          },
          {status: 500},
        );
      }

      console.warn(
        '[select-location] recreated cart under new location, buyerIdentity:',
        JSON.stringify(createResult.cart?.buyerIdentity),
        'warnings:',
        JSON.stringify((createResult as any).warnings),
      );

      const headers = createResult.cart?.id
        ? cart.setCartId(createResult.cart.id)
        : cart.setCartId('');
      return data({success: true}, {headers});
    }

    // No lines to carry over — just drop the old cart id so the next
    // cart.create()/addLines() starts fresh under the new location.
    const headers = cart.setCartId('');
    return data({success: true}, {headers});
  }

  return data({success: true});
}
