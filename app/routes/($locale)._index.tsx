import {Await, useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import {MockShopNotice} from '~/components/MockShopNotice';
import {HomeSidebar} from '~/components/HomeSidebar';
import {FeaturedCollection} from '~/components/FeaturedCollection';
import {ProductsTable} from '~/components/ProductsTable';
import type {ProductListItem} from '~/components/ProductListRow';
import {fetchCollections, fetchProducts} from '~/lib/backend';
import type {BackendProduct} from '~/lib/backend';
import {getRootSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo);
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  const collections = await fetchCollections();
  const {pathPrefix} = context.storefront.i18n;

  const seo: SeoConfig = {
    title: 'Chemicals for Research & Development',
    // getSeoMeta strips a trailing slash from `url`, which collapses a bare
    // "/" to an empty canonical/og:url. For the default locale, omit `url`
    // entirely and let root's absolute shop domain serve as the canonical.
    ...(pathPrefix ? {url: pathPrefix} : {}),
  };

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredCollection: collections[0] ?? null,
    allCollections: collections,
    seo,
  };
}

function loadDeferredData(_args: Route.LoaderArgs) {
  const recommendedProducts = fetchProducts(8)
    .then((products) => products.map(backendToListItem))
    .catch(() => [] as ProductListItem[]);

  return {recommendedProducts};
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

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home">
      {data.isShopLinked ? null : <MockShopNotice />}
      <div className="home-layout">
        <aside className="home-sidebar">
          <HomeSidebar collections={data.allCollections} />
        </aside>
        <div className="home-main">
          <FeaturedCollection collection={data.featuredCollection} />
          <RecommendedProducts products={data.recommendedProducts} />
        </div>
      </div>
    </div>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<ProductListItem[]>;
}) {
  return (
    <section
      className="recommended-products"
      aria-labelledby="recommended-products-heading"
    >
      <h2 id="recommended-products-heading" className="section-heading">
        Recommended Products
      </h2>
      <Suspense fallback={<div className="loading-placeholder">Loading products...</div>}>
        <Await resolve={products}>
          {(nodes) => <ProductsTable nodes={nodes} />}
        </Await>
      </Suspense>
    </section>
  );
}
