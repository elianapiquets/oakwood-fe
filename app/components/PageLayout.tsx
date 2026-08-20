import {Await, Link} from 'react-router';
import {Suspense} from 'react';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';
import type {CustomerData} from '~/root';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header, HeaderMenu} from '~/components/Header';
import {CartMain} from '~/components/CartMain';
import {B2BLocationProvider} from '~/components/B2BLocationProvider';
import {B2BLocationSelector} from '~/components/B2BLocationSelector';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
  customer: Promise<CustomerData | null>;
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  publicStoreDomain,
  customer,
}: PageLayoutProps) {
  return (
    <B2BLocationBoundary customer={customer}>
      <Aside.Provider>
        <CartAside cart={cart} />
        <SearchAside />
        <MobileMenuAside
          header={header}
          publicStoreDomain={publicStoreDomain}
        />
        <B2BLocationSelector />
        {header && (
          <Header
            header={header}
            cart={cart}
            publicStoreDomain={publicStoreDomain}
            customer={customer}
          />
        )}
        <main className={'min-h-[calc(100vh-338px)]'}>{children}</main>
        <Footer
          footer={footer}
          header={header}
          publicStoreDomain={publicStoreDomain}
        />
      </Aside.Provider>
    </B2BLocationBoundary>
  );
}

/**
 * Root's `customer` is deferred, so the provider is fed from inside a Suspense
 * boundary. Before it resolves the provider still renders with empty values, so
 * nothing below it has to special-case a missing context.
 */
function B2BLocationBoundary({
  customer,
  children,
}: {
  customer: PageLayoutProps['customer'];
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <B2BLocationProvider
          company={null}
          companyLocationId={null}
          locations={[]}
          needsLocationSelection={false}
        >
          {children}
        </B2BLocationProvider>
      }
    >
      <Await resolve={customer} errorElement={<>{children}</>}>
        {(resolved) => (
          <B2BLocationProvider
            company={resolved?.company ?? null}
            companyLocationId={resolved?.selectedLocation?.id ?? null}
            locations={resolved?.locations ?? []}
            needsLocationSelection={Boolean(resolved?.needsLocationSelection)}
          >
            {children}
          </B2BLocationProvider>
        )}
      </Await>
    </Suspense>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Aside type="cart" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

function SearchAside() {
  return (
    <Aside type="search" heading="SEARCH">
      <div className="predictive-search">
        <br />
        <SearchFormPredictive>
          {({fetchResults, goToSearch, inputRef}) => (
            <>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Search products…"
                ref={inputRef}
                type="search"
              />
              &nbsp;
              <button onClick={goToSearch}>Search</button>
            </>
          )}
        </SearchFormPredictive>

        <SearchResultsPredictive>
          {({products, total, term, state, closeSearch}) => {
            if (state === 'loading' && term.current) {
              return <div>Loading...</div>;
            }

            if (!total) {
              return <SearchResultsPredictive.Empty term={term} />;
            }

            return (
              <>
                <SearchResultsPredictive.Products
                  products={products}
                  closeSearch={closeSearch}
                  term={term}
                />
                {term.current && total ? (
                  <Link
                    onClick={closeSearch}
                    to={`${SEARCH_ENDPOINT}?q=${term.current}`}
                  >
                    <p>
                      View all results for <q>{term.current}</q> →
                    </p>
                  </Link>
                ) : null}
              </>
            );
          }}
        </SearchResultsPredictive>
      </div>
    </Aside>
  );
}

function MobileMenuAside({
  header,
  publicStoreDomain,
}: {
  header: PageLayoutProps['header'];
  publicStoreDomain: PageLayoutProps['publicStoreDomain'];
}) {
  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="MENU">
        <HeaderMenu
          menu={header.menu}
          viewport="mobile"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
      </Aside>
    )
  );
}
