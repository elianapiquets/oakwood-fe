import {useLoaderData} from 'react-router';
import type {Route} from './+types/collections.all';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import {fetchProducts} from '~/lib/backend';
import {getRootSeo} from '~/lib/seo';
import {CatalogSidebar} from '~/components/catalog/CatalogSidebar';
import {CatalogResults} from '~/components/catalog/CatalogResults';
import {mockCategory} from '~/components/catalog/mockCatalogData';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo);
};

export async function loader({context}: Route.LoaderArgs) {
  const {storefront} = context;

  // TODO: not yet rendered by the UI below — the table is still on mock data
  // for now (defaults to the first collection). See
  // app/components/catalog/mockCatalogData.ts.
  const [{collections}, products] = await Promise.all([
    storefront.query(CATALOG_COLLECTIONS_QUERY),
    fetchProducts(),
  ]);

  const {pathPrefix} = context.storefront.i18n;

  const seo: SeoConfig = {
    title: mockCategory.title,
    url: `${pathPrefix}/collections/all`,
  };

  return {products, collections: collections.nodes, seo};
}

export default function CatalogPage() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <div className="flex w-full gap-6 px-6 py-8">
      {/* Not a semantic <aside> on purpose: app.css has a global `aside {
      position: fixed; ...}` rule for the cart/search/menu drawers that would
      yank this off-screen. */}
      <div className="w-64 flex-shrink-0">
        <CatalogSidebar collections={collections} />
      </div>
      <CatalogResults />
    </div>
  );
}

const CATALOG_COLLECTIONS_QUERY = `#graphql
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
