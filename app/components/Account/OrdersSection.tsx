import {Pagination} from '@shopify/hydrogen';
import {OrdersTable} from './OrdersTable';
import {OrderEmptyState} from './OrderEmptyState';
import {OrdersPager} from './OrdersPager';
import {OrdersTabs, type OrdersTabLocation} from './OrdersTabs';
import {OrdersToolbar} from './OrdersToolbar';

interface OrdersSectionProps {
  orders: any;
  scope: 'company' | 'customer';
  locations: OrdersTabLocation[];
  activeLocationId: string | null;
  searchTerm: string;
  shipmentStatus: string;
  /** True when the contact's role at this location only permits its own orders. */
  scopedToOwnOrders: boolean;
  roleName: string | null;
}

/**
 * Composes the orders view: location tabs, the search/filter toolbar, the
 * table, and the pager. Only the *data* differs per tab — the table and pager
 * are the same components in every case, with the location applied server-side
 * as an order-query filter.
 *
 * Uses Hydrogen's <Pagination> directly rather than
 * <PaginatedResourceSection>, which renders one element per node and so can't
 * produce a single <table>/<tbody>. The pager builds plain links from
 * `previousPageUrl`/`nextPageUrl` instead of Hydrogen's `PreviousLink`/
 * `NextLink`, because those carry the state that makes pages accumulate; those
 * URLs derive from the current search params, so the tab, search and filter
 * all survive paging.
 */
export function OrdersSection({
  orders,
  scope,
  locations,
  activeLocationId,
  searchTerm,
  shipmentStatus,
  scopedToOwnOrders,
  roleName,
}: OrdersSectionProps) {
  const hasOrders = Boolean(orders?.nodes?.length);
  const isFiltered = Boolean(searchTerm || shipmentStatus);
  const showTabs = scope === 'company' && locations.length > 0;

  const chrome = (
    <>
      {showTabs && (
        <OrdersTabs locations={locations} activeLocationId={activeLocationId} />
      )}
      {/* Keep the toolbar on a miss so filters can be cleared or retried, but
          don't show it to someone with no orders and no filters applied. */}
      {(hasOrders || isFiltered) && (
        <OrdersToolbar
          searchTerm={searchTerm}
          shipmentStatus={shipmentStatus}
          activeLocationId={activeLocationId}
        />
      )}
      {scopedToOwnOrders && (
        <p className="text-xs text-slate-500">
          Showing only orders you placed at this location
          {roleName ? ` — your role here is ${roleName}` : ''}. A location admin
          can see every order for the location.
        </p>
      )}
    </>
  );

  if (!hasOrders) {
    return (
      <div className="flex flex-col gap-4">
        {chrome}
        <OrderEmptyState searchTerm={searchTerm} isFiltered={isFiltered} />
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
          {chrome}
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
