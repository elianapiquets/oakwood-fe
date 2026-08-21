import type {Route} from './+types/api.address-suggest';

/**
 * Proxy for Shopify's address service, `atlas.shopifysvc.com/graphql` — the same
 * one the theme's address form uses for its suggestions.
 *
 * **Why a proxy at all:** the service gates requests on the `Origin` header and
 * accepts only a `*.myshopify.com` host. Verified: our shop's origin works, so
 * does an invented `*.myshopify.com` subdomain, while real Shopify stores on
 * custom domains (allbirds.com, gymshark.com) are refused. Browsers set `Origin`
 * themselves, so a storefront on any real domain can never call it directly —
 * this isn't a dev-only workaround, it stays necessary in production. CORS is
 * wide open (`access-control-allow-origin: *`); the block is an application-level
 * check on the origin value.
 *
 * **Caveat:** the endpoint is undocumented — absent from the Admin, Storefront
 * and Customer API references. It can change without notice. Google Places is
 * the supported alternative if this ever needs a contract behind it.
 *
 * Two modes, both GET:
 *   ?q=<text>&country=US&session=<uuid>   → suggestion list
 *   ?id=<addressId>&session=<uuid>        → that suggestion's full address
 *
 * `session` is a client-generated UUID held for the life of one dialog, which is
 * how Shopify's own client groups a lookup session.
 */

const ATLAS_URL = 'https://atlas.shopifysvc.com/graphql';

// Note the queries below deliberately omit the `#graphql` tag: it opts a literal
// into Hydrogen's codegen, which would validate these against the Storefront
// schema and fail — they belong to a different service entirely.

const PREDICTIONS_QUERY = `
  query predictions(
    $query: String!
    $countryCode: AutocompleteSupportedCountry!
    $locale: String!
    $sessionToken: String!
  ) {
    predictions(
      query: $query
      countryCode: $countryCode
      locale: $locale
      sessionToken: $sessionToken
    ) {
      addressId
      description
      matchedSubstrings {
        offset
        length
      }
    }
  }
`;

const ADDRESS_QUERY = `
  query address($id: String!, $locale: String!, $sessionToken: String!) {
    address(id: $id, locale: $locale, sessionToken: $sessionToken) {
      address1
      address2
      city
      provinceCode
      countryCode
      zip
    }
  }
`;

export type AddressPrediction = {
  addressId: string;
  description: string;
  matchedSubstrings: Array<{offset: number; length: number}>;
};

export type ResolvedAddress = {
  address1: string | null;
  address2: string | null;
  city: string | null;
  provinceCode: string | null;
  countryCode: string | null;
  zip: string | null;
};

async function atlas<T>(
  storeDomain: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T | null> {
  const response = await fetch(ATLAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // The whole reason this route exists. Must be the myshopify host — a
      // custom domain is rejected.
      Origin: `https://${storeDomain}`,
    },
    body: JSON.stringify({query, variables}),
  });

  if (!response.ok) return null;

  const payload = (await response.json().catch(() => null)) as {
    data?: T;
    errors?: Array<{message: string}>;
  } | null;

  // `Not allowed` arrives as a 200 with a GraphQL error, so status isn't enough.
  if (!payload || payload.errors?.length) return null;

  return payload.data ?? null;
}

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const storeDomain = context.env.PUBLIC_STORE_DOMAIN;
  const session = url.searchParams.get('session') ?? '';
  const locale = url.searchParams.get('locale') ?? 'en-US';

  // Suggestions are throwaway and per-keystroke: never cache them, and never
  // let a failure surface as a page error — an unavailable autocomplete should
  // just mean no suggestions.
  const headers = {'Cache-Control': 'no-store'};

  if (!storeDomain || !session) {
    return Response.json({predictions: []}, {headers});
  }

  const addressId = url.searchParams.get('id');

  if (addressId) {
    const data = await atlas<{address: ResolvedAddress | null}>(
      storeDomain,
      ADDRESS_QUERY,
      {id: addressId, locale, sessionToken: session},
    );

    return Response.json({address: data?.address ?? null}, {headers});
  }

  const query = url.searchParams.get('q')?.trim() ?? '';
  const country = url.searchParams.get('country') ?? 'US';

  // Below three characters the suggestions are noise; skip the round trip.
  if (query.length < 3) {
    return Response.json({predictions: []}, {headers});
  }

  const data = await atlas<{predictions: AddressPrediction[] | null}>(
    storeDomain,
    PREDICTIONS_QUERY,
    {
      query,
      countryCode: country,
      locale,
      sessionToken: session,
    },
  );

  return Response.json({predictions: data?.predictions ?? []}, {headers});
}
