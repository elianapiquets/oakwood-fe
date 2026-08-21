import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import type {SeoConfig} from '@shopify/hydrogen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import type {Route} from './+types/root';
import favicon from '~/assets/favicon.svg';
import {FOOTER_QUERY, HEADER_QUERY} from '~/lib/fragments';
import {CUSTOMER_LOCATIONS_QUERY} from '~/graphql/customer-account/CustomerLocationsQuery';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';
import tailwindCss from './styles/tailwind.css?url';
import {PageLayout} from './components/PageLayout';
import {useRevalidateOnPageRestore} from '~/lib/revalidate';

export type RootLoader = typeof loader;

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const {storefront, env} = args.context;

  return {
    ...deferredData,
    ...criticalData,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const {storefront} = context;

  const [header] = await Promise.all([
    storefront.query(HEADER_QUERY, {
      cache: storefront.CacheNone(),
      variables: {
        headerMenuHandle: 'main-menu',
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  const {shop} = header;
  const seo: SeoConfig = {
    title: shop.name,
    titleTemplate: `%s | ${shop.name}`,
    description: shop.description,
    url: shop.primaryDomain.url,
    ...(shop.brand?.logo?.image?.url ? {media: shop.brand.logo.image.url} : {}),
  };

  return {header, seo};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
export interface CustomerCompanyLocation {
  id: string;
  name: string;
  role: string | null;
  /** `shippingAddress.formattedAddress`, rendered under the name in the selector. */
  address: string[];
}

export interface CustomerData {
  name: string;
  email: string;
  company: {id: string; name: string} | null;
  locations: CustomerCompanyLocation[];
  /**
   * For display. Falls back to the only location when the customer has exactly
   * one, so the account menu shows it before the session has been written.
   */
  selectedLocation: CustomerCompanyLocation | null;
  /**
   * The raw session-backed choice, with no fallback. This is what decides
   * whether a location still needs persisting — `selectedLocation` can't, since
   * its fallback would make an unsaved single-location customer look settled.
   */
  selectedLocationId: string | null;
  needsLocationSelection: boolean;
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const {storefront, customerAccount, cart} = context;

  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheNone(),
      variables: {
        footerMenuHandle: 'footer',
      },
    })
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  const customer: Promise<CustomerData | null> = customerAccount
    .isLoggedIn()
    .then(async (isLoggedIn) => {
      if (!isLoggedIn) return null;
      const {data} = await customerAccount.query(CUSTOMER_LOCATIONS_QUERY);
      const {firstName, lastName, emailAddress} = data?.customer ?? {};
      const name = [firstName, lastName].filter(Boolean).join(' ') || null;
      const email = emailAddress?.emailAddress ?? null;
      if (!name && !email) return null;

      const contact = data?.customer?.companyContacts?.nodes?.[0] ?? null;
      const company = contact?.company ?? null;
      const locations: CustomerCompanyLocation[] = contact
        ? contact.locations.nodes.map((loc: any) => ({
            id: loc.id,
            name: loc.name,
            role:
              loc.roleAssignments.nodes.find(
                (ra: any) => ra.contact.id === contact.id,
              )?.role.name ?? null,
            address: loc.shippingAddress?.formattedAddress ?? [],
          }))
        : [];

      // Hydrogen's own purpose-built B2B "buyer" session slot (not a custom
      // session key) — the same value cart.updateBuyerIdentity() reads from
      // internally when merging buyer identity into cart mutations.
      const buyer = await customerAccount.getBuyer();
      const selectedLocationId = buyer?.companyLocationId ?? null;
      const selectedLocation =
        locations.find((location) => location.id === selectedLocationId) ??
        (locations.length === 1 ? locations[0] : null);
      const needsLocationSelection =
        !!company && locations.length > 1 && !selectedLocation;

      return {
        name: name ?? email!,
        email: email ?? '',
        company,
        locations,
        selectedLocation,
        selectedLocationId,
        needsLocationSelection,
      };
    })
    .catch(() => null);

  return {
    cart: cart.get(),
    footer,
    customer,
  };
}

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={tailwindCss}></link>
        <link rel="stylesheet" href={resetStyles}></link>
        <link rel="stylesheet" href={appStyles}></link>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');
  useRevalidateOnPageRestore();

  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <PageLayout {...data}>
        <Outlet />
      </PageLayout>
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="route-error">
      <h1>Oops</h1>
      <h2>{errorStatus}</h2>
      {errorMessage && (
        <fieldset>
          <pre>{errorMessage}</pre>
        </fieldset>
      )}
    </div>
  );
}
