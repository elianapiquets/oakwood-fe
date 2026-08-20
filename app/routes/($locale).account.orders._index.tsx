import {useLoaderData} from 'react-router';
import {
  getPaginationVariables,
  getSeoMeta,
  type SeoConfig,
} from '@shopify/hydrogen';
import type {Route} from './+types/account.orders._index';
import {getRootSeo} from '~/lib/seo';
import {
  buildOrderSearchQuery,
  locationIdToParam,
  parseOrderFilters,
  ORDER_FILTER_FIELDS,
} from '~/lib/orderFilters';
import {OrdersSection} from '~/components/Account/OrdersSection';

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
          company {
            id
            name
          }
          locations(first: 20) {
            nodes {
              id
              name
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
  return getSeoMeta(getRootSeo(matches), data?.seo);
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
  const locations: Array<{id: string; name: string}> =
    contact?.locations?.nodes ?? [];

  const scope: 'company' | 'customer' = company ? 'company' : 'customer';

  // Default to the first location rather than an unscoped list, so what's on
  // screen always matches the selected tab.
  const activeLocation =
    scope === 'company' && locations.length
      ? (locations.find(
          (location) => locationIdToParam(location.id) === requestedLocation,
        ) ?? locations[0])
      : null;

  const query =
    buildOrderSearchQuery({
      ...filters,
      ...(activeLocation
        ? {locationId: locationIdToParam(activeLocation.id)}
        : {}),
    }) ?? null;

  const variables = {...paginationVariables, query};

  let orders = null;
  if (scope === 'company') {
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

  const {pathPrefix} = storefront.i18n;
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
      />
    </div>
  );
}
