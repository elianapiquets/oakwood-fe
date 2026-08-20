// Shared by the product and page routes: both fall back to a Shopify URL
// redirect when a handle 404s. Previously duplicated verbatim in each.
export const URL_REDIRECTS_QUERY = `#graphql
  query UrlRedirects($query: String!) {
    urlRedirects(first: 1, query: $query) {
      nodes {
        path
        target
      }
    }
  }
` as const;
