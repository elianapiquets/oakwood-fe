// Company overview for /account/company.
//
// `contacts` is fetched only to count the people at each location: no
// connection in this API exposes a `totalCount`.

export const COMPANY_QUERY = `#graphql-customer-account
  query CompanyOverview {
    customer {
      # Shown on the create-location page: the signed-in customer is the one
      # assigned to the new location, so naming them removes the guesswork.
      emailAddress {
        emailAddress
      }
      companyContacts(first: 1) {
        nodes {
          id
          company {
            id
            name
            externalId
          }
          locations(first: 20) {
            nodes {
              id
              name
              shippingAddress {
                city
                zoneCode
              }
              buyerExperienceConfiguration {
                payNowOnly
              }
              contacts(first: 50) {
                nodes {
                  id
                }
              }
            }
          }
        }
      }
    }
  }
` as const;
