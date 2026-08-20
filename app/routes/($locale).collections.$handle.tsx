import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/($locale).collections.$handle';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import {getRootSeo, truncate} from '~/lib/seo';
import {loadCatalogData} from '~/lib/catalog';
import {CatalogPageLayout} from '~/components/catalog/CatalogPageLayout';
import {getPathPrefix} from '~/lib/i18n';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo) ?? [];
};

export async function loader({params, context}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw redirect('/collections');

  const catalog = await loadCatalogData(context, handle);
  if (!catalog.collection) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  const pathPrefix = getPathPrefix(context.storefront);
  const description = truncate(catalog.collection.description);

  const seo: SeoConfig = {
    title: catalog.collection.title,
    ...(description ? {description} : {}),
    url: `${pathPrefix}/collections/${handle}`,
  };

  return {...catalog, seo};
}

export default function CollectionPage() {
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
