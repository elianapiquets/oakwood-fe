import {Link} from 'react-router';

export function OrderEmptyState({searchTerm}: {searchTerm?: string}) {
  if (searchTerm) {
    return (
      <div className="rounded border border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-base font-semibold text-slate-900">
          No orders match #{searchTerm}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Order numbers must match exactly.
        </p>
        <Link
          to="/account/orders"
          prefetch="intent"
          className="mt-4 inline-block text-sm font-medium text-teal hover:underline"
        >
          Clear search
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded border border-slate-200 bg-white px-6 py-16 text-center">
      <p className="text-base font-semibold text-slate-900">No orders yet</p>
      <p className="mt-1 text-sm text-slate-500">
        Orders placed through the site will appear here.
      </p>
      <Link
        to="/collections"
        prefetch="intent"
        className="mt-4 inline-block text-sm font-medium text-teal hover:underline"
      >
        Browse the catalog →
      </Link>
    </div>
  );
}
