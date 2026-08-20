// Company location detail for /account/company/:id.
//
// Only fields the live 2026-04 API actually has — the schema bundled with
// Hydrogen advertises several (`company`, `paymentInstruments`,
// `taxExemptionsDetails`, `paymentTermsTemplate`) that no published version
// serves. The company name and the authorization check come from `customer`
// in the same document, so the page costs one request.

export const LOCATION_QUERY = `#graphql-customer-account
  query CompanyLocationDetail($locationId: ID!) {
    customer {
      companyContacts(first: 1) {
        nodes {
          company {
            id
            name
          }
          locations(first: 50) {
            nodes {
              id
            }
          }
        }
      }
    }
    companyLocation(id: $locationId) {
      id
      name
      taxIdentifier
      shippingAddress {
        formattedAddress
      }
      billingAddress {
        formattedAddress
      }
      buyerExperienceConfiguration {
        payNowOnly
      }
      orders(first: 1, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          paymentInformation {
            paymentTerms {
              paymentTermsName
            }
          }
        }
      }
      contacts(first: 50) {
        nodes {
          id
          title
          customer {
            firstName
            lastName
            emailAddress {
              emailAddress
            }
          }
        }
      }
      roleAssignments(first: 50) {
        nodes {
          contact {
            id
          }
          role {
            name
          }
        }
      }
    }
  }
` as const;
