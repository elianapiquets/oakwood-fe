// Content page by handle.

export const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode
    $country: CountryCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    page(handle: $handle) {
      id
      title
      handle
      body
      seo {
        description
        title
      }
    }
  }
` as const;
