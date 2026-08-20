import type {Route} from './+types/($locale).account_.logout';

// Hydrogen's `logout()` unsets the `customerAccount` and `buyer` session keys
// and destroys the session cookie, but it never touches the `cart` cookie,
// which the cart handler writes separately as `cart=<id>; Path=/`. Left behind,
// the next customer to sign in on this browser inherits the previous
// customer's cart, still carrying their company and company location in
// `buyerIdentity.purchasingCompany` — wrong prices, and another company's name
// on screen.
const CLEARED_CART_COOKIE =
  'cart=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

export async function action({context}: Route.ActionArgs) {
  const {cart, customerAccount} = context;

  // Shopify's B2B cookbook strips the B2B context from the cart on logout but
  // keeps the cart. We do that *and* drop the cookie: the two fix different
  // problems — this leaves the abandoned cart with no company context attached,
  // while expiring the cookie stops the next customer inheriting it at all.
  // Guarded because the mutation needs an existing cart to act on.
  if (cart.getCartId()) {
    await cart.updateBuyerIdentity({
      companyLocationId: null,
      customerAccessToken: null,
    });
  }

  // Appended to the response rather than passed as `logout({headers})`:
  // `logout()` internally does `headers.set('Set-Cookie', …)` with the
  // session-destroy cookie, which would replace anything handed to it.
  const response = await customerAccount.logout();
  response.headers.append('Set-Cookie', CLEARED_CART_COOKIE);
  return response;
}
