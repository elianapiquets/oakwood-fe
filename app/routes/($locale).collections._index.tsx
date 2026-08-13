import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/collections._index';
import {fetchCollections} from '~/lib/backend';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Oakwood Chemical | Collections'},
    {rel: 'canonical', href: '/collections'},
  ];
};

export async function loader(_args: Route.LoaderArgs) {
  const collections = await fetchCollections();
  return {collections};
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
