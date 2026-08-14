import {Link} from 'react-router';
import {mockBreadcrumb} from './mockProduct';

export function ProductBreadcrumb() {
  return (
    <nav className="flex items-center gap-2 text-sm text-slate-500">
      <Link to="/" className="text-blue-700 hover:underline">
        Home
      </Link>
      <span aria-hidden="true">/</span>
      <Link
        to={`/collections/${mockBreadcrumb.collectionHandle}`}
        className="text-blue-700 hover:underline"
      >
        {mockBreadcrumb.collectionTitle}
      </Link>
      <span aria-hidden="true">/</span>
      <span>{mockBreadcrumb.itemNumber}</span>
    </nav>
  );
}
