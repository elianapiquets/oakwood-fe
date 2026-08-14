import {Link} from 'react-router';

export function ProductQuoteCallout() {
  return (
    <div className="mt-6 flex items-start justify-between gap-4 rounded border border-slate-200 bg-slate-50 p-4">
      <div>
        <p className="text-sm font-bold text-slate-900">
          Need a different size or bulk pricing?
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Custom quantities and returnable cylinder programs available.
        </p>
      </div>
      <Link
        to="/pages/contact"
        className="whitespace-nowrap text-sm font-semibold text-blue-700 hover:underline"
      >
        Request a Quote &rarr;
      </Link>
    </div>
  );
}
