import {Pagination} from '@shopify/hydrogen';
import {OrdersTable} from './OrdersTable';
import {OrderEmptyState} from './OrderEmptyState';
import {OrdersPager} from './OrdersPager';
import {OrdersSearch} from './OrdersSearch';

/**
 * Wraps the table in Hydrogen's <Pagination>. Deliberately not
 * <PaginatedResourceSection>: that helper renders one element per node with no
 * shared wrapper, so it can't produce a single <table>/<tbody>.
 *
 * The pager uses `previousPageUrl`/`nextPageUrl` rather than Hydrogen's
 * `PreviousLink`/`NextLink`, because those helpers carry the pagination state
 * that makes pages accumulate. Discrete pages need plain links. Those URLs are
 * built from the current location's search params, so an active `?name=`
 * search survives paging.
 *
 * There's no page count: the Customer Account API's `OrderConnection` exposes
 * only edges/nodes/pageInfo — no total — so "page N of M" isn't derivable
 * without walking every page.
 */
export function OrdersSection({
  orders,
  scope,
  searchTerm,
}: {
  orders: any;
  scope: 'company' | 'customer';
  searchTerm: string;
}) {
  const hasOrders = Boolean(orders?.nodes?.length);

  if (!hasOrders) {
    return (
      <div className="flex flex-col gap-4">
        {/* Keep the box on a miss so the search can be cleared or retried, but
            don't show it to a customer who has no orders at all. */}
        {Boolean(searchTerm) && <OrdersSearch searchTerm={searchTerm} />}
        <OrderEmptyState searchTerm={searchTerm} />
      </div>
    );
  }

  return (
    <Pagination connection={orders}>
      {({
        nodes,
        hasNextPage,
        hasPreviousPage,
        previousPageUrl,
        nextPageUrl,
      }) => (
        <div className="flex flex-col gap-4">
          <OrdersSearch searchTerm={searchTerm} />
          <OrdersTable
            orders={nodes}
            showCompanyColumns={scope === 'company'}
          />
          <OrdersPager
            previousPageUrl={previousPageUrl}
            nextPageUrl={nextPageUrl}
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
          />
        </div>
      )}
    </Pagination>
  );
}
