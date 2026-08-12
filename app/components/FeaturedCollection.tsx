import {Link} from 'react-router';
import type {BackendCollection} from '~/lib/backend';

export function FeaturedCollection({
  collection,
}: {
  collection: BackendCollection | null | undefined;
}) {
  if (!collection) return null;
  const image = collection.image;
  return (
    <div className="featured-collection-hero">
      <div className="featured-collection-content">
        <p className="featured-collection-label">
          OAKWOOD CHEMICAL &middot; RESEARCH GRADE
        </p>
        <h1 className="featured-collection-title">{collection.title}</h1>
        <p className="featured-collection-description">
          High-purity chemicals for research, pharmaceutical, and industrial
          applications. Trusted by laboratories worldwide.
        </p>
        <Link
          to={`/collections/${collection.handle}`}
          className="featured-collection-cta"
        >
          Shop Collection
        </Link>
      </div>
      {image && (
        <div className="featured-collection-image-wrap">
          <img
            src={image.url}
            alt={image.altText || collection.title}
            width={image.width ?? undefined}
            height={image.height ?? undefined}
          />
        </div>
      )}
    </div>
  );
}
