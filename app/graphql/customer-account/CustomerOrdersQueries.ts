// Order-list queries for /account/orders.
//
// Three connections back the list, chosen by role: `company.orders` for a
// location admin, `companyContact.orders` for an ordering-only role, and
// `customer.orders` for a customer with no company. All three are
// OrderConnection, so one table and one pager serve them.

export const ORDER_ITEM_FRAGMENT = `#graphql-customer-account
  fragment OrderItem on Order {
    id
    name
    processedAt
    financialStatus
    fulfillmentStatus
    statusPageUrl
    totalPrice {
      amount
      currencyCode
    }
    customer {
      firstName
      lastName
    }
    purchasingEntity {
      __typename
      ... on PurchasingCompany {
        company {
          name
        }
        location {
          name
        }
      }
    }
    lineItems(first: 50) {
      nodes {
        quantity
      }
      pageInfo {
        hasNextPage
      }
    }
    shippingLine {
      title
    }
    fulfillments(first: 1) {
      nodes {
        latestShipmentStatus
      }
    }
  }
` as const;

export const COMPANY_LOCATIONS_QUERY = `#graphql-customer-account
  query CompanyOrderLocations {
    customer {
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

export const COMPANY_ORDERS_QUERY = `#graphql-customer-account
  query CompanyOrders(
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $query: String
  ) {
    customer {
      companyContacts(first: 1) {
        nodes {
          company {
            id
            name
            orders(
              first: $first
              last: $last
              before: $startCursor
              after: $endCursor
              query: $query
              sortKey: PROCESSED_AT
              reverse: true
            ) {
              nodes {
                ...OrderItem
              }
              pageInfo {
                hasPreviousPage
                hasNextPage
                startCursor
                endCursor
              }
            }
          }
        }
      }
    }
  }
  ${ORDER_ITEM_FRAGMENT}
` as const;

export const CONTACT_ORDERS_QUERY = `#graphql-customer-account
  query ContactOrders(
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $query: String
  ) {
    customer {
      companyContacts(first: 1) {
        nodes {
          orders(
            first: $first
            last: $last
            before: $startCursor
            after: $endCursor
            query: $query
            sortKey: PROCESSED_AT
            reverse: true
          ) {
            nodes {
              ...OrderItem
            }
            pageInfo {
              hasPreviousPage
              hasNextPage
              startCursor
              endCursor
            }
          }
        }
      }
    }
  }
  ${ORDER_ITEM_FRAGMENT}
` as const;

export const CUSTOMER_ORDERS_QUERY = `#graphql-customer-account
  query CustomerOrders(
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $query: String
  ) {
    customer {
      orders(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        query: $query
        sortKey: PROCESSED_AT
        reverse: true
      ) {
        nodes {
          ...OrderItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
      }
    }
  }
  ${ORDER_ITEM_FRAGMENT}
` as const;
