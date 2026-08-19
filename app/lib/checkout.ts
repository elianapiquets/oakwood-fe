/**
 * Shopify's web checkout does NOT read the company location from the cart's
 * `buyerIdentity.purchasingCompany` — verified empirically: a cart correctly
 * priced for Location 2 still made checkout prompt for a location, and once
 * answered, checkout kept its own answer. Checkout resolves the active company
 * location from the *shop-side session* instead, and the only thing that writes
 * that session is the classic `/company_location/update` endpoint, which is
 * what Shopify's own in-checkout location switcher calls.
 *
 * So a B2B buyer is sent to checkout via that endpoint, with `return_to`
 * pointing at the checkout path. This stays same-origin — `checkoutUrl` is on
 * the shop's own host — which is why `return_to` is accepted here even though
 * pointing it at our headless domain isn't.
 *
 * Returns `checkoutUrl` unchanged for guests and non-B2B customers.
 */
export function buildCheckoutUrl(
  checkoutUrl: string,
  companyLocationId?: string | null,
): string {
  if (!companyLocationId) return checkoutUrl;

  let checkout: URL;
  try {
    checkout = new URL(checkoutUrl);
  } catch {
    // Never block checkout over a malformed URL — fall back to going direct.
    return checkoutUrl;
  }

  // Keep the query: `key` signs the cart permalink, so dropping it would
  // invalidate the checkout we're returning to.
  const returnTo = `${checkout.pathname}${checkout.search}`;

  const url = new URL('/company_location/update', checkout.origin);
  url.searchParams.set('location_id', companyLocationId);
  url.searchParams.set('return_to', returnTo);

  return url.toString();
}
