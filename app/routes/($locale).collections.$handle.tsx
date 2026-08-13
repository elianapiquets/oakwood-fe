import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {ProductsTable} from '~/components/ProductsTable';
import type {ProductListItem} from '~/components/ProductListRow';
import {fetchCollection} from '~/lib/backend';
import type {BackendProduct} from '~/lib/backend';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `Oakwood Chemical | ${data?.collection.title ?? ''}`},
    {rel: 'canonical', href: `/collections/${data?.collection.handle}`},
  ];
};

export async function loader({params}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw redirect('/collections');

  const collection = await fetchCollection(handle);
  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  return {collection};
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
