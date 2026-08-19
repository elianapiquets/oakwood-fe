// TEMPORARY diagnostic route — delete once the B2B checkout location issue is
// resolved. Dumps the three places a company location can live so they can be
// compared at each step of the checkout round trip.
import type {CartApiQueryFragment} from 'storefrontapi.generated';

const LOCATIONS_QUERY = `#graphql-customer-account
  query DebugCustomerLocations {
    customer {
      companyContacts(first: 1) {
        nodes {
          company { id name }
          locations(first: 10) {
            nodes { id name }
          }
        }
      }
    }
  }
` as const;

export async function loader({context}: any) {
  const {customerAccount, cart} = context;

  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return Response.json(
      {loggedIn: false},
      {headers: {'Cache-Control': 'no-store'}},
    );
  }

  const buyer = await customerAccount.getBuyer();
  const {data: customerData} = await customerAccount.query(LOCATIONS_QUERY);
  const contact = customerData?.customer?.companyContacts?.nodes?.[0] ?? null;

  const cartId = cart.getCartId() ?? null;
  const cartData = cartId
    ? ((await cart.get()) as CartApiQueryFragment | null)
    : null;
  const purchasingCompany = cartData?.buyerIdentity?.purchasingCompany ?? null;

  const name = (id: string | null | undefined) =>
    id
      ? ((contact?.locations?.nodes ?? []).find((l: any) => l.id === id)
          ?.name ?? '(not one of this customer’s locations)')
      : null;

  return Response.json(
    {
      // 1. Our own Hydrogen session slot — what the account dropdown shows.
      session: {
        companyLocationId: buyer?.companyLocationId ?? null,
        companyLocationName: name(buyer?.companyLocationId),
        tokenPrefix: buyer?.customerAccessToken?.slice(0, 8) ?? null,
      },
      // 2. The Shopify cart object — what cart pricing and checkout read.
      cart: {
        id: cartId,
        checkoutUrl: cartData?.checkoutUrl ?? null,
        totalQuantity: cartData?.totalQuantity ?? 0,
        purchasingCompanyLocationId: purchasingCompany?.location?.id ?? null,
        purchasingCompanyLocationName:
          purchasingCompany?.location?.name ?? null,
        purchasingCompanyName: purchasingCompany?.company?.name ?? null,
        firstLinePrice:
          cartData?.lines?.nodes?.[0]?.cost?.amountPerQuantity?.amount ?? null,
      },
      // 3. Reference: every location this customer may order for.
      company: contact?.company ?? null,
      locations: contact?.locations?.nodes ?? [],
      // Shopify's own shop-side session (what its checkout uses for the active
      // company location) is not readable from here — infer it from whether
      // checkout prompts, and from which location checkout ends up using.
      readAt: new Date().toISOString(),
    },
    {headers: {'Cache-Control': 'no-store'}},
  );
}
