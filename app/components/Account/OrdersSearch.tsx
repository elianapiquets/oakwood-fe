import {Form, Link, useNavigation} from 'react-router';
import {ORDER_FILTER_FIELDS} from '~/lib/orderFilters';

/**
 * Server-side order search. A plain GET form on purpose: it submits only its
 * own field, which drops any pagination cursor still in the URL so a new
 * search starts from the first page. The loader turns `?name=` into a Shopify
 * `query:` argument, so matching happens across the whole order set rather
 * than the rows currently on screen.
 */
export function OrdersSearch({searchTerm}: {searchTerm: string}) {
  const navigation = useNavigation();
  const isSearching = navigation.state !== 'idle';

  return (
    <div className="flex items-center gap-3">
      <Form method="get" className="flex items-center gap-2">
        <label htmlFor="order-search" className="sr-only">
          Search orders by order number
        </label>
        <input
          id="order-search"
          type="search"
          name={ORDER_FILTER_FIELDS.NAME}
          defaultValue={searchTerm}
          placeholder="Search by order #…"
          className="w-72 rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
        >
          {isSearching ? 'Searching…' : 'Search'}
        </button>
      </Form>

      {searchTerm && (
        <Link
          to="/account/orders"
          prefetch="intent"
          className="text-sm font-medium text-teal hover:underline"
        >
          Clear
        </Link>
      )}
    </div>
  );
}
