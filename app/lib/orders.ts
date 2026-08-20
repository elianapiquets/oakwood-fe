import type {
  FulfillmentEventStatus,
  OrderFinancialStatus,
  OrderFulfillmentStatus,
} from '@shopify/hydrogen/customer-account-api-types';

/**
 * "Today at 4:00 pm" / "Yesterday at 9:46 am" / "Aug 11 at 3:42 pm", matching
 * the orders design. Dates in another year keep the year so old orders stay
 * unambiguous.
 */
export function formatOrderDate(value: string, now: Date = new Date()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    // Intl gives "4:00 PM"; the design uses lowercase.
    .toLowerCase();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfOrderDay = new Date(date);
  startOfOrderDay.setHours(0, 0, 0, 0);

  const daysAgo = Math.round(
    (startOfToday.getTime() - startOfOrderDay.getTime()) / 86_400_000,
  );

  if (daysAgo === 0) return `Today at ${time}`;
  if (daysAgo === 1) return `Yesterday at ${time}`;

  const day = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() === now.getFullYear() ? {} : {year: 'numeric'}),
  }).format(date);

  return `${day} at ${time}`;
}

/** Sentence-cases an unmapped SCREAMING_SNAKE enum rather than showing it raw. */
function humanize(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
    )
    .join(' ');
}

const FINANCIAL_STATUS_LABELS: Partial<Record<OrderFinancialStatus, string>> = {
  AUTHORIZED: 'Authorized',
  EXPIRED: 'Expired',
  PAID: 'Paid',
  PARTIALLY_PAID: 'Partially paid',
  PARTIALLY_REFUNDED: 'Partially refunded',
  PENDING: 'Pending',
  REFUNDED: 'Refunded',
  VOIDED: 'Voided',
};

const FULFILLMENT_STATUS_LABELS: Partial<
  Record<OrderFulfillmentStatus, string>
> = {
  FULFILLED: 'Fulfilled',
  IN_PROGRESS: 'In progress',
  ON_HOLD: 'On hold',
  OPEN: 'Open',
  PARTIALLY_FULFILLED: 'Partially fulfilled',
  PENDING_FULFILLMENT: 'Pending',
  READY_FOR_DELIVERY: 'Ready for delivery',
  READY_FOR_PICKUP: 'Ready for pickup',
  RESTOCKED: 'Restocked',
  SCHEDULED: 'Scheduled',
  UNFULFILLED: 'Unfulfilled',
};

const SHIPMENT_STATUS_LABELS: Partial<Record<FulfillmentEventStatus, string>> =
  {
    ATTEMPTED_DELIVERY: 'Attempted delivery',
    CARRIER_PICKED_UP: 'Picked up by carrier',
    CONFIRMED: 'Confirmed',
    DELAYED: 'Delayed',
    DELIVERED: 'Delivered',
    FAILURE: 'Failed',
    IN_TRANSIT: 'In Transit',
    LABEL_PRINTED: 'Label printed',
    LABEL_PURCHASED: 'Label purchased',
    OUT_FOR_DELIVERY: 'Out for delivery',
    PICKED_UP: 'Picked up',
    READY_FOR_PICKUP: 'Ready for pickup',
  };

export function financialStatusLabel(
  status?: OrderFinancialStatus | null,
): string | null {
  if (!status) return null;
  return FINANCIAL_STATUS_LABELS[status] ?? humanize(status);
}

export function fulfillmentStatusLabel(
  status?: OrderFulfillmentStatus | null,
): string | null {
  if (!status) return null;
  return FULFILLMENT_STATUS_LABELS[status] ?? humanize(status);
}

export function shipmentStatusLabel(
  status?: FulfillmentEventStatus | null,
): string | null {
  if (!status) return null;
  return SHIPMENT_STATUS_LABELS[status] ?? humanize(status);
}

/**
 * Order GIDs can carry a `?key=…` suffix that the Customer Account API needs
 * back verbatim, so the whole trailing segment is encoded into the route param
 * rather than just the numeric id.
 */
export function orderIdToParam(gid: string): string {
  return encodeURIComponent(gid.split('/').pop() ?? gid);
}

export function orderParamToGid(param: string): string {
  return `gid://shopify/Order/${decodeURIComponent(param)}`;
}

/** Tone shared by the status pills; lives here so status → color stays with status → label. */
export type OrderStatusTone = 'neutral' | 'green' | 'amber' | 'blue' | 'red';

export function financialStatusTone(
  status?: OrderFinancialStatus | null,
): OrderStatusTone {
  switch (status) {
    case 'PAID':
      return 'neutral';
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
    case 'VOIDED':
    case 'EXPIRED':
      return 'red';
    case 'PENDING':
    case 'AUTHORIZED':
    case 'PARTIALLY_PAID':
      return 'amber';
    default:
      return 'neutral';
  }
}

/**
 * What the FULFILLMENT column shows. Once a shipment is moving, the shipment
 * status is more informative than "In progress", which is why an in-flight
 * order reads "In Transit" rather than its raw fulfillment status.
 */
export function fulfillmentDisplay(order: {
  fulfillmentStatus?: OrderFulfillmentStatus | null;
  fulfillments?: {
    nodes: Array<{latestShipmentStatus?: FulfillmentEventStatus | null}>;
  } | null;
}): {label: string; tone: OrderStatusTone} | null {
  const shipmentStatus =
    order.fulfillments?.nodes?.[0]?.latestShipmentStatus ?? null;

  switch (order.fulfillmentStatus) {
    case 'FULFILLED':
      return {label: 'Fulfilled', tone: 'green'};
    case 'UNFULFILLED':
      return {label: 'Unfulfilled', tone: 'amber'};
    case 'RESTOCKED':
      return {label: 'Restocked', tone: 'red'};
    default:
      break;
  }

  const shipmentLabel = shipmentStatusLabel(shipmentStatus);
  if (shipmentLabel) return {label: shipmentLabel, tone: 'blue'};

  const label = fulfillmentStatusLabel(order.fulfillmentStatus);
  return label ? {label, tone: 'blue'} : null;
}

/** Delivery sub-line under the shipping method: green once delivered. */
export function shipmentStatusTone(
  status?: FulfillmentEventStatus | null,
): OrderStatusTone {
  switch (status) {
    case 'DELIVERED':
      return 'green';
    case 'FAILURE':
    case 'DELAYED':
    case 'ATTEMPTED_DELIVERY':
      return 'red';
    default:
      return 'blue';
  }
}

/**
 * Item count for the ITEMS column.
 *
 * `Order.lineItemsSummary` would give this in one cheap field and is in the
 * published 2026-04 schema, but this shop's live endpoint rejects it
 * ("Field 'lineItemsSummary' doesn't exist on type 'Order'"), and
 * `LineItemConnection` exposes no `totalCount`. So the quantities are summed
 * from the line items we fetch, and `hasMore` reports when an order has more
 * lines than the query asked for — better a visible "50+" than a wrong total.
 */
export function orderItemCount(order: {
  lineItems?: {
    nodes: Array<{quantity?: number | null}>;
    pageInfo?: {hasNextPage?: boolean | null} | null;
  } | null;
}): {count: number; hasMore: boolean} {
  const nodes = order.lineItems?.nodes ?? [];
  const count = nodes.reduce((total, line) => total + (line.quantity ?? 0), 0);
  return {count, hasMore: Boolean(order.lineItems?.pageInfo?.hasNextPage)};
}

export function orderItemCountLabel(
  order: Parameters<typeof orderItemCount>[0],
): string {
  const {count, hasMore} = orderItemCount(order);
  const suffix = count === 1 && !hasMore ? 'item' : 'items';
  return `${count}${hasMore ? '+' : ''} ${suffix}`;
}
