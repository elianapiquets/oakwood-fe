// Single order for /account/orders/:id.

export const ORDER_QUERY = `#graphql-customer-account
  query OrderDetail($orderId: ID!) {
    order(id: $orderId) {
      id
      name
      processedAt
      financialStatus
      fulfillmentStatus
      statusPageUrl
      customer {
        firstName
        lastName
        emailAddress {
          emailAddress
        }
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
      shippingLine {
        title
      }
      fulfillments(first: 1) {
        nodes {
          latestShipmentStatus
        }
      }
      lineItems(first: 100) {
        nodes {
          id
          name
          sku
          quantity
          price {
            amount
            currencyCode
          }
          totalPrice {
            amount
            currencyCode
          }
          image {
            url
            altText
            width
            height
          }
        }
      }
      shippingAddress {
        formatted
      }
      subtotal {
        amount
        currencyCode
      }
      totalShipping {
        amount
        currencyCode
      }
      totalTax {
        amount
        currencyCode
      }
      totalPrice {
        amount
        currencyCode
      }
    }
  }
` as const;
