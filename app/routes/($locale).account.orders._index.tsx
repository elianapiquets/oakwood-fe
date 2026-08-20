import {useLoaderData} from 'react-router';
import {
  getPaginationVariables,
  getSeoMeta,
  type SeoConfig,
} from '@shopify/hydrogen';
import type {PermittedOperation} from '@shopify/hydrogen/customer-account-api-types';
import type {Route} from './+types/($locale).account.orders._index';
import {getRootSeo} from '~/lib/seo';
import {
  buildOrderSearchQuery,
  locationIdToParam,
  parseOrderFilters,
  ORDER_FILTER_FIELDS,
} from '~/lib/orderFilters';
import {roleCanViewAllLocationOrders} from '~/lib/b2bRoles';
import {OrdersSection} from '~/components/Account/OrdersSection';
import {getPathPrefix} from '~/lib/i18n';

// Every column the orders table renders. Spread into both connections below so
// the two scopes can share one row component.
const ORDER_ITEM_FRAGMENT = `#graphql-customer-account
  fragment OrderItem on Order {
    id
    name
    processedAt
    financialStatus
    fulfillmentStatus
    statusPageUrl
    totalPrice {
      amount
      currencyCode
    }
    customer {
      firstName
      lastName
    }
    purchasingEntity {
      __typename
      ... on PurchasingCompany {
        company {
          name
        }
        location {
          name
        }
      }
    }
    lineItems(first: 50) {
      nodes {
        quantity
      }
      pageInfo {
        hasNextPage
      }
    }
    shippingLine {
      title
    }
    fulfillments(first: 1) {
      nodes {
        latestShipmentStatus
      }
    }
  }
` as const;

// Cheap scope probe: is this a company customer, and which locations may they
// order for? Kept separate from the orders queries so resolving the active tab
// never costs a second full orders fetch.
const COMPANY_LOCATIONS_QUERY = `#graphql-customer-account
  query CompanyOrderLocations {
    customer {
      companyContacts(first: 1) {
        nodes {
          id
          company {
            id
            name
          }
          locations(first: 20) {
            nodes {
              id
              name
              roleAssignments(first: 20) {
                nodes {
                  contact {
                    id
                  }
                  role {
                    name
                    resourcePermission(resource: ORDER)
                  }
                }
              }
            }
          }
        }
      }
    }
  }
` as const;

// B2B: every order under the company, across all locations and contacts.
// Shopify scopes this to what the contact's role actually permits.
const COMPANY_ORDERS_QUERY = `#graphql-customer-account
  query CompanyOrders(
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $query: String
  ) {
    customer {
      companyContacts(first: 1) {
        nodes {
          company {
            id
            name
            orders(
              first: $first
              last: $last
              before: $startCursor
              after: $endCursor
              query: $query
              sortKey: PROCESSED_AT
              reverse: true
            ) {
              nodes {
                ...OrderItem
              }
              pageInfo {
                hasPreviousPage
                hasNextPage
                startCursor
                endCursor
              }
            }
          }
        }
      }
    }
  }
  ${ORDER_ITEM_FRAGMENT}
` as const;

// Own-orders scope for a role without ORDER view permission at its location.
// Uses the contact's own connection rather than a
// `purchasing_company_contact_id` filter — that filter is well-formed but
// matches nothing, so it silently returned an empty list.
const CONTACT_ORDERS_QUERY = `#graphql-customer-account
  query ContactOrders(
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $query: String
  ) {
    customer {
      companyContacts(first: 1) {
        nodes {
          orders(
            first: $first
            last: $last
            before: $startCursor
            after: $endCursor
            query: $query
            sortKey: PROCESSED_AT
            reverse: true
          ) {
            nodes {
              ...OrderItem
            }
            pageInfo {
              hasPreviousPage
              hasNextPage
              startCursor
              endCursor
            }
          }
        }
      }
    }
  }
  ${ORDER_ITEM_FRAGMENT}
` as const;

// Non-B2B fallback: just this customer's own orders.
const CUSTOMER_ORDERS_QUERY = `#graphql-customer-account
  query CustomerOrders(
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $query: String
  ) {
    customer {
      orders(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        query: $query
        sortKey: PROCESSED_AT
        reverse: true
      ) {
        nodes {
          ...OrderItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
      }
    }
  }
  ${ORDER_ITEM_FRAGMENT}
` as const;

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo) ?? [];
};

export async function loader({context, request}: Route.LoaderArgs) {
  const {customerAccount, storefront} = context;

  if (!(await customerAccount.isLoggedIn())) {
    // Thrown, not returned: returning the redirect unions it into the loader's
    // return type and collapses `useLoaderData` to `undefined` at the call site.
    throw await customerAccount.login();
  }

  // TEMPORARY: 3 so pagination is exercisable against a small order set.
  // Put this back to 20 before merging.
  const paginationVariables = getPaginationVariables(request, {pageBy: 3});

  const url = new URL(request.url);
  const filters = parseOrderFilters(url.searchParams);
  const requestedLocation = url.searchParams.get(ORDER_FILTER_FIELDS.LOCATION);

  // A company customer gets one tab per location they belong to, and the list
  // is always scoped to the active location through the `query` argument's
  // `purchasing_company_location_id` filter — so it stays one connection, one
  // set of cursors, and the same table component.
  const {data: scopeData} = await customerAccount.query(
    COMPANY_LOCATIONS_QUERY,
  );
  const contact = scopeData?.customer?.companyContacts?.nodes?.[0] ?? null;
  const company = contact?.company ?? null;
  type OrderLocation = {
    id: string;
    name: string;
    roleAssignments?: {
      nodes: Array<{
        contact?: {id: string} | null;
        role?: {
          name?: string | null;
          resourcePermission?: PermittedOperation[] | null;
        } | null;
      }>;
    } | null;
  };
  const locations: OrderLocation[] = contact?.locations?.nodes ?? [];

  const scope: 'company' | 'customer' = company ? 'company' : 'customer';

  // Default to the first location rather than an unscoped list, so what's on
  // screen always matches the selected tab.
  const activeLocation =
    scope === 'company' && locations.length
      ? (locations.find(
          (location) => locationIdToParam(location.id) === requestedLocation,
        ) ?? locations[0])
      : null;

  // At each location this contact holds one role. A location administrator
  // sees every order placed for that location; an ordering-only role sees only
  // the orders it placed, which is enforced by adding
  // `purchasing_company_contact_id` to the query rather than filtering after
  // the fact — so pagination and the total stay correct too.
  const myRoleAtLocation = activeLocation?.roleAssignments?.nodes?.find(
    (assignment: any) => assignment?.contact?.id === contact?.id,
  );
  const canViewAllAtLocation = roleCanViewAllLocationOrders(
    myRoleAtLocation?.role?.resourcePermission,
  );

  const query =
    buildOrderSearchQuery({
      ...filters,
      ...(activeLocation
        ? {locationId: locationIdToParam(activeLocation.id)}
        : {}),
    }) ?? null;

  const variables = {...paginationVariables, query};

  let orders = null;
  if (scope === 'company' && !canViewAllAtLocation) {
    // Ordering-only at this location: the contact's own orders, still narrowed
    // to the active location by the same `query` filter.
    const {data} = await customerAccount.query(CONTACT_ORDERS_QUERY, {
      variables,
    });
    orders = data?.customer?.companyContacts?.nodes?.[0]?.orders ?? null;
  } else if (scope === 'company') {
    const {data} = await customerAccount.query(COMPANY_ORDERS_QUERY, {
      variables,
    });
    orders =
      data?.customer?.companyContacts?.nodes?.[0]?.company?.orders ?? null;
  } else {
    const {data} = await customerAccount.query(CUSTOMER_ORDERS_QUERY, {
      variables,
    });
    orders = data?.customer?.orders ?? null;
  }

  const pathPrefix = getPathPrefix(storefront);
  const seo: SeoConfig = {
    title: 'Orders',
    url: `${pathPrefix}/account/orders`,
  };

  return {
    orders,
    scope,
    companyName: company?.name ?? null,
    locations,
    activeLocationId: activeLocation?.id ?? null,
    searchTerm: filters.name ?? '',
    // Lets the UI say why a list is short, instead of looking broken.
    scopedToOwnOrders: Boolean(activeLocation) && !canViewAllAtLocation,
    roleName: myRoleAtLocation?.role?.name ?? null,
    shipmentStatus: filters.shipmentStatus ?? '',
    seo,
  };
}

export default function OrdersPage() {
  const {
    orders,
    scope,
    locations,
    activeLocationId,
    searchTerm,
    shipmentStatus,
    scopedToOwnOrders,
    roleName,
  } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-navy">
        Orders
      </h1>
      <OrdersSection
        orders={orders}
        scope={scope}
        locations={locations}
        activeLocationId={activeLocationId}
        searchTerm={searchTerm}
        shipmentStatus={shipmentStatus}
        scopedToOwnOrders={scopedToOwnOrders}
        roleName={roleName}
      />
    </div>
  );
}
