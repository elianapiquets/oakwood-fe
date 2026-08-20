import type {Route} from './+types/($locale).account_.logout';

// Hydrogen's `logout()` unsets the `customerAccount` and `buyer` session keys
// and destroys the session cookie — but it never touches the `cart` cookie,
// which the cart handler writes separately as `cart=<id>; Path=/`. Left behind,
// the next customer to sign in on this browser inherits the previous
// customer's cart, still carrying their company and company location in
// `buyerIdentity.purchasingCompany` — wrong prices, and another company's name
// on screen.
const CLEARED_CART_COOKIE =
  'cart=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

export async function action({context}: Route.ActionArgs) {
  // Appended to the response rather than passed as `logout({headers})`:
  // `logout()` internally does `headers.set('Set-Cookie', …)` with the
  // session-destroy cookie, which would replace anything handed to it.
  const response = await context.customerAccount.logout();
  response.headers.append('Set-Cookie', CLEARED_CART_COOKIE);
  return response;
}
