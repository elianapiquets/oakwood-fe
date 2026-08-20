import {useLoaderData} from 'react-router';
import {
  getPaginationVariables,
  getSeoMeta,
  type SeoConfig,
} from '@shopify/hydrogen';
import type {Route} from './+types/account.orders._index';
import {getRootSeo} from '~/lib/seo';
import {buildOrderSearchQuery, parseOrderFilters} from '~/lib/orderFilters';
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

  // Server-side search: Shopify matches across the customer's/company's whole
  // order set, so an order that isn't on the current page is still found.
  // `buildOrderSearchQuery` strips a leading '#' and sanitizes the value.
  const filters = parseOrderFilters(new URL(request.url).searchParams);
  const searchQuery = buildOrderSearchQuery(filters) ?? null;
  const variables = {...paginationVariables, query: searchQuery};

  // Resolve scope and fetch in one round trip for B2B customers: if the
  // customer has a company contact, this response already carries the orders.
  // The two connections can't be fetched together — a cursor minted by
  // `company.orders` is meaningless to `customer.orders` and errors on page 2.
  const {data: companyData} = await customerAccount.query(
    COMPANY_ORDERS_QUERY,
    {variables},
  );
  const company =
    companyData?.customer?.companyContacts?.nodes?.[0]?.company ?? null;

  let orders = company?.orders ?? null;
  let scope: 'company' | 'customer' = 'company';

  if (!company) {
    scope = 'customer';
    const {data: customerData} = await customerAccount.query(
      CUSTOMER_ORDERS_QUERY,
      {variables},
    );
    orders = customerData?.customer?.orders ?? null;
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
    searchTerm: filters.name ?? '',
    seo,
  };
}

export default function OrdersPage() {
  const {orders, scope, searchTerm} = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-navy">
        Orders
      </h1>
      <OrdersSection orders={orders} scope={scope} searchTerm={searchTerm} />
    </div>
  );
}
