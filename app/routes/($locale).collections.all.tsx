import {useLoaderData} from 'react-router';
import type {Route} from './+types/collections.all';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import {ProductsTable} from '~/components/ProductsTable';
import type {ProductListItem} from '~/components/ProductListRow';
import {fetchProducts} from '~/lib/backend';
import type {BackendProduct} from '~/lib/backend';
import {getRootSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo);
};

export async function loader({context}: Route.LoaderArgs) {
  const products = await fetchProducts();
  const {pathPrefix} = context.storefront.i18n;

  const seo: SeoConfig = {
    title: 'All Products',
    url: `${pathPrefix}/collections/all`,
  };

  return {products, seo};
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
