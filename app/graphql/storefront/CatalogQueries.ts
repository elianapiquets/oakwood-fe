export const CATALOG_COLLECTIONS_QUERY = `#graphql
  query CatalogCollections(
    $buyer: BuyerInput
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
    collections(first: 20) {
      nodes {
        id
        title
        handle
      }
    }
  }
` as const;

export const CATALOG_COLLECTION_QUERY = `#graphql
  query CatalogCollection(
    $buyer: BuyerInput
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
    collection(handle: $handle) {
      title
      description
      products(first: 20) {
        nodes {
          id
          title
          handle
          variants(first: 10) {
            nodes {
              id
              sku
              title
            }
          }
        }
      }
    }
  }
` as const;
