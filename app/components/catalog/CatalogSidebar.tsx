import {Link} from 'react-router';
import {mockCollections} from './mockCatalogData';

export function CatalogSidebar() {
  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white">
      <div className="bg-navy px-3 py-2 text-xs font-bold uppercase tracking-widest text-white">
        Featured Products
      </div>
      <nav className="divide-y divide-slate-100">
        {mockCollections.map((collection) => (
          <Link
            key={collection.handle}
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
