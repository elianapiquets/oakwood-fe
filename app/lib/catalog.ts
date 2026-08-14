import {
  CATALOG_COLLECTIONS_QUERY,
  CATALOG_COLLECTION_QUERY,
} from '~/graphql/catalog';
import type {CatalogSidebarCollection} from '~/components/catalog/CatalogSidebar';
import type {CatalogTableProduct} from '~/components/catalog/CatalogTable';

export interface CatalogData {
  collections: CatalogSidebarCollection[];
  collection: {title: string; description: string | null} | null;
  products: CatalogTableProduct[];
}

/**
 * Loads the sidebar's full collection list plus one collection's detail
 * (title/description/products) from the Storefront API. When `handle` is
 * omitted, defaults to the first collection in the list.
 */
export async function loadCatalogData(
  storefront: {query: (query: string, options?: {variables?: object}) => Promise<any>},
  handle?: string,
): Promise<CatalogData> {
  const {collections} = await storefront.query(CATALOG_COLLECTIONS_QUERY);
  const targetHandle = handle ?? collections.nodes[0]?.handle;

  const collectionDetail = targetHandle
    ? (
        await storefront.query(CATALOG_COLLECTION_QUERY, {
          variables: {handle: targetHandle},
        })
      ).collection
    : null;

  const products: CatalogTableProduct[] = (
    collectionDetail?.products.nodes ?? []
  ).map((product: any) => {
    const variants = product.variants.nodes;
    const sku = variants.find((variant: any) => variant.sku)?.sku ?? null;
    const sizes = variants
      .map((variant: any) => variant.title)
      .filter((title: string) => title && title !== 'Default Title');

    return {
      id: product.id,
      title: product.title,
      sku,
      // Not available from the Storefront API — comes from the custom
      // chemistry backend, to be wired in separately.
      purity: null,
      sizes,
    };
  });

  return {
    collections: collections.nodes,
    collection: collectionDetail
      ? {title: collectionDetail.title, description: collectionDetail.description}
      : null,
    products,
  };
}
