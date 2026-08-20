// NOTE: https://shopify.dev/docs/api/customer/latest/objects/Customer
//
// Extracted from root.tsx to match Shopify's B2B cookbook layout
// (app/graphql/customer-account/CustomerLocationsQuery.ts), so this file can be
// diffed against the reference recipe.
//
// It deliberately asks for more than the cookbook's version, and each addition
// is load-bearing:
//  - `firstName`/`lastName`/`emailAddress` — rendered by AccountMenu.
//  - `roleAssignments.role.resourcePermission(resource: ORDER)` — decides
//    whether a contact sees every order at a location or only its own. Dropping
//    it silently restricts every admin to their own orders.
//  - `shippingAddress.formattedAddress` — shown under each location name in the
//    selector, as the cookbook's B2BLocationSelector does.
export const CUSTOMER_LOCATIONS_QUERY = `#graphql-customer-account
  query CustomerLocations {
    customer {
      firstName
      lastName
      emailAddress {
        emailAddress
      }
      companyContacts(first: 1) {
        nodes {
          id
          company {
            id
            name
          }
          locations(first: 20) {
            nodes {
              id
              name
              shippingAddress {
                formattedAddress
              }
              roleAssignments(first: 20) {
                nodes {
                  contact {
                    id
                  }
                  role {
                    name
                    resourcePermission(resource: ORDER)
                  }
                }
              }
            }
          }
        }
      }
    }
  }
` as const;
