// Used by the /cart action to check a submitted companyLocationId really
// belongs to the signed-in customer before mutating buyer identity.

export const CUSTOMER_LOCATION_IDS_QUERY = `#graphql-customer-account
  query CartCustomerLocationIds {
    customer {
      companyContacts(first: 1) {
        nodes {
          locations(first: 20) {
            nodes {
              id
            }
          }
        }
      }
    }
  }
` as const;
