/**
 * Field name constants for order filtering
 */
export const ORDER_FILTER_FIELDS = {
  NAME: 'name',
  CONFIRMATION_NUMBER: 'confirmation_number',
  /** URL param for the active company-location tab (numeric id). */
  LOCATION: 'tab',
  /** URL param for the shipment-state filter. */
  SHIPMENT_STATUS: 'shipment',
} as const;

/**
 * The order `query` argument supports `shipment_status` but NOT
 * `fulfillment_status` (verified against the 2026-04 Customer API docs), so the
 * state filter is built on shipment status. Note there is deliberately no
 * "unfulfilled" option: an order with no shipment yet has no shipment status,
 * so it can't be selected by this filter.
 */
export const SHIPMENT_STATUS_OPTIONS = [
  {value: 'in_transit', status: 'IN_TRANSIT'},
  {value: 'out_for_delivery', status: 'OUT_FOR_DELIVERY'},
  {value: 'delivered', status: 'DELIVERED'},
  {value: 'delayed', status: 'DELAYED'},
  {value: 'attempted_delivery', status: 'ATTEMPTED_DELIVERY'},
] as const;

const VALID_SHIPMENT_STATUSES = new Set(
  SHIPMENT_STATUS_OPTIONS.map((option) => option.value),
);

/** `gid://shopify/CompanyLocation/123` → `123`, for tidy URLs and because the
 * search syntax wants the numeric id, not a GID. */
export function locationIdToParam(gid: string): string {
  return gid.split('/').pop() ?? gid;
}

/**
 * Whether a role may see every order at its location, or only its own.
 *
 * Reads Shopify's permission model rather than the role's name, which can be
 * renamed in Admin. Verified against this store: a "Location admin" role
 * returns ["VIEW","ADD"] for ORDER, while "Ordering only" returns an empty
 * list — so holding any view permission is the signal.
 *
 * Restrictive on purpose: an unreadable role or empty list means own-orders
 * only. Being too restrictive shows an admin fewer orders; being too permissive
 * would show one buyer another buyer's orders.
 */
export function roleCanViewAllLocationOrders(
  orderPermissions: readonly string[] | null | undefined,
): boolean {
  if (!orderPermissions?.length) return false;
  return orderPermissions.some((permission) =>
    ['VIEW', 'ALL', 'EDIT', 'DELETE'].includes(permission),
  );
}

/**
 * Parameters for filtering customer orders, see: https://shopify.dev/docs/api/customer/latest/queries/customer#returns-Customer.fields.orders.arguments.query
 */
export interface OrderFilterParams {
  /** Order name or number (e.g., "#1001" or "1001") */
  name?: string;
  /** Order confirmation number */
  confirmationNumber?: string;
  /** Numeric company location id — scopes results to one location's orders. */
  locationId?: string;
  /** One of SHIPMENT_STATUS_OPTIONS' values. */
  shipmentStatus?: string;
}

/**
 * Sanitizes a filter value to prevent injection attacks or malformed queries.
 * Allows only alphanumeric characters, underscore, and dash.
 * @param value - The input string to sanitize
 * @returns The sanitized string
 */
function sanitizeFilterValue(value: string): string {
  // Only allow alphanumeric, underscore, and dash
  // Remove anything else to prevent injection
  return value.replace(/[^a-zA-Z0-9_\-]/g, '');
}

/**
 * Builds a query string for filtering customer orders using the Customer Account API
 * @param filters - The filter parameters
 * @returns A formatted query string for the GraphQL query parameter, or undefined if no filters
 * @example
 * buildOrderSearchQuery(\{ name: '1001' \}) // returns "name:1001"
 * buildOrderSearchQuery(\{ name: '1001', confirmationNumber: 'ABC123' \}) // returns "name:1001 AND confirmation_number:ABC123"
 */
export function buildOrderSearchQuery(
  filters: OrderFilterParams,
): string | undefined {
  const queryParts: string[] = [];

  if (filters.name) {
    // Remove # if present and trim
    const cleanName = filters.name.replace(/^#/, '').trim();
    const sanitizedName = sanitizeFilterValue(cleanName);
    if (sanitizedName) {
      queryParts.push(`name:${sanitizedName}`);
    }
  }

  if (filters.confirmationNumber) {
    const cleanConfirmation = filters.confirmationNumber.trim();
    const sanitizedConfirmation = sanitizeFilterValue(cleanConfirmation);
    if (sanitizedConfirmation) {
      queryParts.push(`confirmation_number:${sanitizedConfirmation}`);
    }
  }

  if (filters.locationId) {
    const sanitizedLocation = sanitizeFilterValue(filters.locationId);
    if (sanitizedLocation) {
      queryParts.push(`purchasing_company_location_id:${sanitizedLocation}`);
    }
  }

  if (filters.shipmentStatus) {
    // Only ever emit a value we defined — never pass user input through.
    if (VALID_SHIPMENT_STATUSES.has(filters.shipmentStatus as any)) {
      queryParts.push(`shipment_status:${filters.shipmentStatus}`);
    }
  }

  return queryParts.length > 0 ? queryParts.join(' AND ') : undefined;
}

/**
 * Parses order filter parameters from URLSearchParams
 * @param searchParams - The URL search parameters
 * @returns Parsed filter parameters
 * @example
 * const url = new URL('https://example.com/orders?name=1001&confirmation_number=ABC123');
 * parseOrderFilters(url.searchParams) // returns \{ name: '1001', confirmationNumber: 'ABC123' \}
 */
export function parseOrderFilters(
  searchParams: URLSearchParams,
): OrderFilterParams {
  const filters: OrderFilterParams = {};

  const name = searchParams.get(ORDER_FILTER_FIELDS.NAME);
  if (name) {
    filters.name = name;
  }

  const confirmationNumber = searchParams.get(
    ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER,
  );
  if (confirmationNumber) {
    filters.confirmationNumber = confirmationNumber;
  }

  const shipmentStatus = searchParams.get(ORDER_FILTER_FIELDS.SHIPMENT_STATUS);
  if (shipmentStatus && VALID_SHIPMENT_STATUSES.has(shipmentStatus as any)) {
    filters.shipmentStatus = shipmentStatus;
  }

  return filters;
}
