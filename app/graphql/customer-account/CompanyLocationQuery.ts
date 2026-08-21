// Company location detail for /account/company/:id.
//
// The address blocks use `countryCode` — `CompanyAddress` has no
// `territoryCode`, unlike the customer address types (validated against live
// 2026-04).
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
          id
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
        firstName
        lastName
        recipient
        address1
        address2
        city
        zoneCode
        zip
        countryCode
        phone
      }
      billingAddress {
        formattedAddress
        firstName
        lastName
        recipient
        address1
        address2
        city
        zoneCode
        zip
        countryCode
        phone
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
            # What the viewer may change here. Read instead of the role's name:
            # names are editable in Admin, so matching on them would break
            # permissively. Validated against live 2026-04.
            shippingAddressPermission: resourcePermission(
              resource: COMPANY_LOCATION_SHIPPING_ADDRESS
            )
            billingAddressPermission: resourcePermission(
              resource: COMPANY_LOCATION_BILLING_ADDRESS
            )
            locationPermission: resourcePermission(resource: COMPANY_LOCATION)
            contactPermission: resourcePermission(resource: COMPANY_CONTACT)
            contactRolePermission: resourcePermission(
              resource: COMPANY_CONTACT_ROLE
            )
          }
        }
      }
    }
  }
` as const;
