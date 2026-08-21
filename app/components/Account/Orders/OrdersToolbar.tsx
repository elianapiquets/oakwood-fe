import {Form, Link, useNavigation} from 'react-router';
import {
  ORDER_FILTER_FIELDS,
  SHIPMENT_STATUS_OPTIONS,
  locationIdToParam,
} from '~/lib/orderFilters';
import {shipmentStatusLabel} from '~/lib/orders';

/**
 * Search + shipment-state filter, deliberately in ONE GET form.
 *
 * Both controls submit together so neither clears the other, and the active
 * tab rides along in a hidden field. Being a GET form it submits only its own
 * fields, which drops any pagination cursor — so a new search or filter starts
 * at page 1.
 *
 * The state filter is shipment status, not fulfillment status: the order
 * `query` argument supports `shipment_status` and has no `fulfillment_status`
 * filter, so "Unfulfilled" isn't selectable — an order with no shipment has no
 * shipment status to match.
 */
export function OrdersToolbar({
  searchTerm,
  shipmentStatus,
  activeLocationId,
}: {
  searchTerm: string;
  shipmentStatus: string;
  activeLocationId: string | null;
}) {
  const navigation = useNavigation();
  const isBusy = navigation.state !== 'idle';
  const hasFilters = Boolean(searchTerm || shipmentStatus);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Form method="get" className="flex flex-wrap items-center gap-2">
        {activeLocationId && (
          <input
            type="hidden"
            name={ORDER_FILTER_FIELDS.LOCATION}
            value={locationIdToParam(activeLocationId)}
          />
        )}

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

        <label
          htmlFor="order-shipment"
          className="text-sm font-medium text-slate-600"
        >
          Delivery
        </label>
        <select
          id="order-shipment"
          name={ORDER_FILTER_FIELDS.SHIPMENT_STATUS}
          defaultValue={shipmentStatus}
          // Submitting on change keeps the select feeling instant while still
          // being a plain server round trip.
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
        >
          <option value="">All</option>
          {SHIPMENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {shipmentStatusLabel(option.status)}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={isBusy}
          className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-60"
        >
          {isBusy ? 'Searching…' : 'Search'}
        </button>
      </Form>

      {hasFilters && (
        <Link
          to={
            activeLocationId
              ? `/account/orders?${ORDER_FILTER_FIELDS.LOCATION}=${locationIdToParam(activeLocationId)}`
              : '/account/orders'
          }
          prefetch="intent"
          className="text-sm font-medium text-teal hover:underline"
        >
          Clear
        </Link>
      )}
    </div>
  );
}
