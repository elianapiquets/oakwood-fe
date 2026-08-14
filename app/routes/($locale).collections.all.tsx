import {useLoaderData} from 'react-router';
import type {Route} from './+types/collections.all';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import {getRootSeo} from '~/lib/seo';
import {loadCatalogData} from '~/lib/catalog';
import {CatalogPageLayout} from '~/components/catalog/CatalogPageLayout';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo);
};

export async function loader({context}: Route.LoaderArgs) {
  const catalog = await loadCatalogData(context.storefront);
  const {pathPrefix} = context.storefront.i18n;

  const seo: SeoConfig = {
    title: catalog.collection?.title ?? 'Catalog',
    url: `${pathPrefix}/collections/all`,
  };

  return {...catalog, seo};
}

export default function CatalogPage() {
  const {collections, collection, products} = useLoaderData<typeof loader>();

  return (
    <CatalogPageLayout
      collections={collections}
      title={collection?.title ?? ''}
      description={collection?.description}
      products={products}
    />
  );
}
