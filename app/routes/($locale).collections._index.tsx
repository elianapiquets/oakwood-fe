import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/($locale).collections._index';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import {fetchCollections} from '~/lib/backend';
import {getRootSeo} from '~/lib/seo';
import {getPathPrefix} from '~/lib/i18n';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo) ?? [];
};

export async function loader({context}: Route.LoaderArgs) {
  const collections = await fetchCollections();
  const pathPrefix = getPathPrefix(context.storefront);

  const seo: SeoConfig = {
    title: 'Collections',
    url: `${pathPrefix}/collections`,
  };

  return {collections, seo};
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <div className="collections">
      <h1>Collections</h1>
      <div className="collections-grid">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            className="collection-item"
            to={`/collections/${collection.handle}`}
            prefetch="intent"
          >
            {collection.image && (
              <img
                src={collection.image.url}
                alt={collection.image.altText || collection.title}
                width={collection.image.width ?? undefined}
                height={collection.image.height ?? undefined}
              />
            )}
            <h5>{collection.title}</h5>
          </Link>
        ))}
      </div>
    </div>
  );
}
