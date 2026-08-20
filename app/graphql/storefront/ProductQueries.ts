// Product detail queries.
//
// PRODUCT_QUERY takes `$buyer: BuyerInput` and applies it via
// `@inContext(buyer: $buyer)` so B2B price-list pricing reflects the
// customer's active company location. Anything contextualized this way must
// not be cached across customers — see `getBuyerContext` in app/lib/buyer.ts.

export const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariantShopify on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

export const PRODUCT_FRAGMENT = `#graphql
  fragment ProductShopify on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    images(first: 12) {
      nodes {
        __typename
        id
        url
        altText
        width
        height
      }
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariantShopify
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariantShopify
    }
    adjacentVariants(selectedOptions: $selectedOptions) {
      ...ProductVariantShopify
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

export const PRODUCT_QUERY = `#graphql
  query ProductShopify(
    $buyer: BuyerInput
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
    product(handle: $handle) {
      ...ProductShopify
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

export const SAFETY_DATA_SHEET_QUERY = `#graphql
  query SafetyDataSheets($first: Int!) {
    metaobjects(type: "safety_data_sheet", first: $first) {
      nodes {
        id
        handle
        type
        fields {
          key
          value
          reference {
            ... on Product {
              id
              handle
            }
            ... on GenericFile {
              id
              url
              mimeType
            }
            ... on MediaImage {
              id
              image {
                url
              }
            }
          }
        }
      }
    }
  }
` as const;

export const CERTIFICATES_OF_ANALYSIS_QUERY = `#graphql
  query CertificatesOfAnalysis($first: Int!) {
    metaobjects(type: "certificates_of_analysis", first: $first) {
      nodes {
        id
        handle
        type
        fields {
          key
          value
          reference {
            ... on Product {
              id
              handle
            }
            ... on GenericFile {
              id
              url
              mimeType
            }
          }
        }
      }
    }
  }
` as const;
