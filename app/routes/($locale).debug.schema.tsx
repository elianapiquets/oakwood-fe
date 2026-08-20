// TEMPORARY diagnostic route — delete once the orders queries are settled.
// Introspects the LIVE Customer Account API so field availability is checked
// against the version this shop actually serves, not against the types bundled
// with Hydrogen (which are generated from a different version and disagree).
const TYPE_FIELDS_QUERY = `#graphql-customer-account
  query DebugTypeFields($name: String!) {
    __type(name: $name) {
      name
      fields {
        name
        type {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
  }
` as const;

const TYPES_TO_INSPECT = [
  'Order',
  'LineItem',
  'Fulfillment',
  'PurchasingCompany',
  'CustomerAddress',
  'OrderLineItemsSummary',
];

function typeLabel(type: any): string {
  if (!type) return '?';
  if (type.kind === 'NON_NULL') return `${typeLabel(type.ofType)}!`;
  if (type.kind === 'LIST') return `[${typeLabel(type.ofType)}]`;
  return type.name ?? type.kind;
}

export async function loader({context}: any) {
  const {customerAccount} = context;

  if (!(await customerAccount.isLoggedIn())) {
    return Response.json(
      {error: 'Sign in first, then reload this URL.'},
      {status: 401, headers: {'Cache-Control': 'no-store'}},
    );
  }

  const result: Record<string, unknown> = {
    // Reveals the API version actually in use — the crux of the mismatch.
    apiUrl: customerAccount.getApiUrl?.() ?? null,
  };

  for (const name of TYPES_TO_INSPECT) {
    try {
      const {data, errors} = await customerAccount.query(TYPE_FIELDS_QUERY, {
        variables: {name},
      });
      const fields = data?.__type?.fields;
      result[name] = fields
        ? fields.map((f: any) => `${f.name}: ${typeLabel(f.type)}`)
        : {missing: true, errors: errors ?? null};
    } catch (error) {
      result[name] = {threw: String(error)};
    }
  }

  return Response.json(result, {headers: {'Cache-Control': 'no-store'}});
}
