import type {Route} from './+types/collections.all';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import {fetchProducts} from '~/lib/backend';
import {getRootSeo} from '~/lib/seo';
import {CatalogSidebar} from '~/components/catalog/CatalogSidebar';
import {CatalogResults} from '~/components/catalog/CatalogResults';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo);
};

export async function loader({context}: Route.LoaderArgs) {
  // TODO: not yet rendered by the UI below — this page is on mock data for
  // now. See app/components/catalog/mockCatalogData.ts.
  const products = await fetchProducts();
  const {pathPrefix} = context.storefront.i18n;

  const seo: SeoConfig = {
    title: 'All Products',
    url: `${pathPrefix}/collections/all`,
  };

  return {products, seo};
}

export default function AllProducts() {
  return (
    <div className="flex w-full gap-6 px-6 py-8">
      {/* Not a semantic <aside> on purpose: app.css has a global `aside {
      position: fixed; ...}` rule for the cart/search/menu drawers that would
      yank this off-screen. */}
      <div className="w-64 flex-shrink-0">
        <CatalogSidebar />
      </div>
      <CatalogResults />
    </div>
  );
}
