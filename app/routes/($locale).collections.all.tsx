import {useLoaderData} from 'react-router';
import type {Route} from './+types/collections.all';
import {ProductsTable} from '~/components/ProductsTable';
import type {ProductListItem} from '~/components/ProductListRow';
import {fetchProducts} from '~/lib/backend';
import type {BackendProduct} from '~/lib/backend';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Oakwood Chemical | All Products'},
    {rel: 'canonical', href: '/collections/all'},
  ];
};

export async function loader(_args: Route.LoaderArgs) {
  const products = await fetchProducts();
  return {products};
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

export default function AllProducts() {
  const {products} = useLoaderData<typeof loader>();

  return (
    <div className="collection-page">
      <div className="collection-page-header">
        <h1 className="collection-page-title">All Products</h1>
      </div>
      <ProductsTable nodes={products.map(backendToListItem)} />
    </div>
  );
}
