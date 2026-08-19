import type {CustomerAccount, Storefront} from '@shopify/hydrogen';
import {
  CATALOG_COLLECTIONS_QUERY,
  CATALOG_COLLECTION_QUERY,
} from '~/graphql/catalog';
import {getBuyerContext} from '~/lib/buyer';
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
 *
 * Both queries are contextualized with the B2B buyer so that anything
 * price-list dependent (pricing, quantity rules, catalog visibility) reflects
 * the company location the customer is currently ordering for.
 */
export async function loadCatalogData(
  context: {storefront: Storefront; customerAccount: CustomerAccount},
  handle?: string,
): Promise<CatalogData> {
  const {storefront} = context;
  const {buyer, cache} = await getBuyerContext(context);

  const {collections} = await storefront.query(CATALOG_COLLECTIONS_QUERY, {
    variables: {buyer},
    cache,
  });
  const targetHandle = handle ?? collections.nodes[0]?.handle;

  const collectionDetail = targetHandle
    ? (
        await storefront.query(CATALOG_COLLECTION_QUERY, {
          variables: {handle: targetHandle, buyer},
          cache,
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
      handle: product.handle,
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
