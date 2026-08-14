import {Link} from 'react-router';

export interface CatalogSidebarCollection {
  id: string;
  title: string;
  handle: string;
}

export function CatalogSidebar({
  collections,
}: {
  collections: CatalogSidebarCollection[];
}) {
  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white">
      <div className="bg-navy px-3 py-2 text-xs font-bold uppercase tracking-widest text-white">
        Featured Products
      </div>
      <nav className="divide-y divide-slate-100">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            to={`/collections/${collection.handle}`}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-blue-700 hover:bg-slate-50 hover:underline"
          >
            <span aria-hidden="true">&mdash;</span>
            {collection.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}
