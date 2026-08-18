// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/cart
//
// Hydrogen's cart handler uses two *separate* fragment slots:
// - `queryFragment`, spread as `...CartApiQuery` — only used by `cart.get()`.
// - `mutateFragment`, spread as `...CartApiMutation` — used by every cart
//   mutation (create, addLines, updateBuyerIdentity, etc). If this isn't
//   configured, Hydrogen silently falls back to its own minimal built-in
//   `CartApiMutation` fragment (id/totalQuantity/checkoutUrl only), so
//   mutation responses are missing anything we added here, like
//   buyerIdentity — with no error, since the query is still valid GraphQL.
// Both fragment bodies below spread the same `CartFields` selection so the
// two response shapes never drift apart.
//
// `lines(first: ...)` is parameterized rather than shared verbatim: the
// `cart.get()` query declares `$numCartLines: Int = 100` itself, so its
// fragment must reference that variable (an operation variable is a GraphQL
// error if it's declared but never used) — but mutation operations
// (cartLinesAdd, cartCreate, cartBuyerIdentityUpdate, etc.) never declare
// `$numCartLines`, so referencing it there is an "undefined variable" error
// instead. A literal `100` sidesteps both.
const cartFieldsFragment = (linesFirst: string) => `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
  fragment CartLine on CartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height

        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
      }
    }
    parentRelationship {
      parent {
        id
      }
    }
  }
  fragment CartLineComponent on ComponentizableCartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height
        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
      }
    }
    lineComponents {
      ...CartLine
    }
  }
  fragment CartFields on Cart {
    updatedAt
    id
    appliedGiftCards {
      id
      lastCharacters
      amountUsed {
        ...Money
      }
    }
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
      purchasingCompany {
        company {
          id
          name
        }
        location {
          id
          name
        }
      }
    }
    lines(first: ${linesFirst}) {
      nodes {
        ...CartLine
      }
      nodes {
        ...CartLineComponent
      }
    }
    cost {
      subtotalAmount {
        ...Money
      }
      totalAmount {
        ...Money
      }
      totalDutyAmount {
        ...Money
      }
      totalTaxAmount {
        ...Money
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      code
      applicable
    }
  }
`;

export const CART_QUERY_FRAGMENT = `#graphql
  fragment CartApiQuery on Cart {
    ...CartFields
  }
  ${cartFieldsFragment('$numCartLines')}
` as const;

export const CART_MUTATE_FRAGMENT = `#graphql
  fragment CartApiMutation on Cart {
    ...CartFields
  }
  ${cartFieldsFragment('100')}
` as const;

const MENU_FRAGMENT = `#graphql
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
  fragment ChildMenuItem on MenuItem {
    ...MenuItem
  }
  fragment ParentMenuItem on MenuItem {
    ...MenuItem
    items {
      ...ChildMenuItem
    }
  }
  fragment Menu on Menu {
    id
    items {
      ...ParentMenuItem
    }
  }
` as const;

export const HEADER_QUERY = `#graphql
  fragment Shop on Shop {
    id
    name
    description
    primaryDomain {
      url
    }
    brand {
      logo {
        image {
          url
        }
      }
    }
  }
  query Header(
    $country: CountryCode
    $headerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    shop {
      ...Shop
    }
    menu(handle: $headerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
` as const;

export const FOOTER_QUERY = `#graphql
  query Footer(
    $country: CountryCode
    $footerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    menu(handle: $footerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
` as const;
