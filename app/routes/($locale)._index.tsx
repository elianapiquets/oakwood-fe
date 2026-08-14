import type {Route} from './+types/_index';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import {fetchCollections, fetchProducts} from '~/lib/backend';
import {getRootSeo} from '~/lib/seo';
import {HomeHero} from '~/components/home/HomeHero';
import {HomeInfoBar} from '~/components/home/HomeInfoBar';
import {HomeFeaturedProduct} from '~/components/home/HomeFeaturedProduct';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo);
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  // TODO: not yet rendered by the UI below — the homepage is on static UI for
  // now. See app/components/home/.
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
  const recommendedProducts = fetchProducts(8).catch(() => []);
  return {recommendedProducts};
}

export default function Homepage() {
  return (
    <div className="w-full pt-8">
      <HomeHero />
      <HomeInfoBar />
      <HomeFeaturedProduct />
    </div>
  );
}
