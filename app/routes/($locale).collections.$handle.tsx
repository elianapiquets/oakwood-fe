import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import {ProductsTable} from '~/components/ProductsTable';
import type {ProductListItem} from '~/components/ProductListRow';
import {fetchCollection} from '~/lib/backend';
import type {BackendProduct} from '~/lib/backend';
import {getRootSeo, truncate} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo);
};

export async function loader({params, context}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw redirect('/collections');

  const collection = await fetchCollection(handle);
  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  const {pathPrefix} = context.storefront.i18n;
  const description = truncate(collection.description);

  const seo: SeoConfig = {
    title: collection.title,
    ...(description ? {description} : {}),
    url: `${pathPrefix}/collections/${collection.handle}`,
  };

  return {collection, seo};
}

function backendToListItem(p: BackendProduct): ProductListItem {
  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    variants: {nodes: p.variants},
    chemistry: p.chemistry,
  };
}

export default function Collection() {
  const {collection} = useLoaderData<typeof loader>();

  return (
    <div className="collection-page">
      <div className="collection-page-header">
        <h1 className="collection-page-title">{collection.title}</h1>
        {collection.description && (
          <p className="collection-description">{collection.description}</p>
        )}
      </div>
      <ProductsTable nodes={collection.products.map(backendToListItem)} />
    </div>
  );
}
