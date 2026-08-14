export const CATALOG_COLLECTIONS_QUERY = `#graphql
  query CatalogCollections(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
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
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      title
      description
      products(first: 20) {
        nodes {
          id
          title
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
