// TEMPORARY probe — delete once the payment-instrument question is settled.
// Asks the Customer Account API at `unstable` (the version Shopify's own account
// UI calls, per the CompanyLocationPaymentInstrumentDetails request seen in
// DevTools) whether CompanyLocation exposes payment instruments to *us*, or
// whether that field is private to Shopify's first-party app.
const INTROSPECT_LOCATION = `
  query DebugCompanyLocationFields {
    __type(name: "CompanyLocation") {
      name
      fields {
        name
      }
    }
  }
`;

const PAYMENT_INSTRUMENTS = `
  query DebugCompanyLocationPaymentInstruments($id: ID!) {
    companyLocation(id: $id) {
      id
      name
      paymentInstruments(first: 10) {
        nodes {
          __typename
          id
        }
      }
    }
  }
`;

export async function loader({context, request}: any) {
  const {customerAccount} = context;

  if (!(await customerAccount.isLoggedIn())) {
    return Response.json(
      {error: 'Sign in first, then reload this URL.'},
      {status: 401, headers: {'Cache-Control': 'no-store'}},
    );
  }

  const token = await customerAccount.getAccessToken();
  const defaultUrl = customerAccount.getApiUrl();
  // Same endpoint, different version segment — e.g. .../api/2026-04/graphql
  const unstableUrl = defaultUrl.replace(
    /\/api\/[^/]+\/graphql/,
    '/api/unstable/graphql',
  );

  async function ask(url: string, query: string, variables?: object) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ?? '',
        },
        body: JSON.stringify({query, variables}),
      });
      const json: any = await res.json();
      return {
        status: res.status,
        errors: json.errors?.map((e: any) => e.message) ?? null,
        data: json.data ?? null,
      };
    } catch (error) {
      return {status: 0, errors: [String(error)], data: null};
    }
  }

  const url = new URL(request.url);
  const numericLocation = url.searchParams.get('location');
  const locationId = numericLocation
    ? `gid://shopify/CompanyLocation/${numericLocation}`
    : null;

  const introspection = await ask(unstableUrl, INTROSPECT_LOCATION);
  const fields: string[] =
    introspection.data?.__type?.fields?.map((f: any) => f.name) ?? [];

  return Response.json(
    {
      defaultApiUrl: defaultUrl,
      probedApiUrl: unstableUrl,
      companyLocationFieldsAtUnstable: fields,
      paymentishFields: fields.filter((f) =>
        /pay|instrument|card|tax|term/i.test(f),
      ),
      introspectionErrors: introspection.errors,
      paymentInstrumentsAttempt: locationId
        ? await ask(unstableUrl, PAYMENT_INSTRUMENTS, {id: locationId})
        : 'pass ?location=<numeric id> to attempt the real query',
    },
    {headers: {'Cache-Control': 'no-store'}},
  );
}
