import {Suspense} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  publicStoreDomain: string;
  customerName: Promise<string | null>;
}

type Viewport = 'desktop' | 'mobile';

export function Header({
  header,
  cart,
  publicStoreDomain,
  customerName,
}: HeaderProps) {
  const {shop, menu} = header;
  return (
    <div className="site-header">
      <div className="header-top-bar">
        <Suspense fallback={
          <NavLink to="/account/login" className="header-top-bar-link">
            Please Sign In to Place an Order
          </NavLink>
        }>
          <Await resolve={customerName}>
            {(name) =>
              name ? (
                <NavLink to="/account" className="header-top-bar-link">
                  Welcome, {name}
                </NavLink>
              ) : (
                <NavLink to="/account/login" className="header-top-bar-link">
                  Please Sign In to Place an Order
                </NavLink>
              )
            }
          </Await>
        </Suspense>
      </div>

      <div className="header-main">
        <NavLink prefetch="intent" to="/" className="header-logo" end>
          <div className="header-logo-icon">OC</div>
          <div className="header-logo-text">
            <span className="header-logo-name">
              <span className="header-logo-oakwood">Oakwood</span>{' '}
              <span className="header-logo-chemical">Chemical</span>
            </span>
            <span className="header-logo-tagline">Enabling Discovery</span>
          </div>
        </NavLink>

        <div className="header-tagline">
          <p className="header-tagline-main">
            Supporting Scientific Discovery. It&apos;s in our Chemistry
          </p>
          <p className="header-tagline-sub">
            Chemicals for Research &amp; Development
          </p>
        </div>

        <div className="header-actions">
          <NavLink to="/pages/contact" className="header-action-link">
            Contact Us
          </NavLink>
          <CartToggle cart={cart} />
          <NavLink to="/account" className="header-action-btn">
            My Account
          </NavLink>
        </div>
      </div>

      <div className="header-nav-row">
        <HeaderMenu
          menu={menu}
          viewport="desktop"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
        <HeaderMenuMobileToggle />
      </div>
    </div>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const className = `header-menu-${viewport}`;
  const {close} = useAside();

  return (
    <nav className={className} role="navigation">
      {viewport === 'mobile' && (
        <NavLink
          end
          onClick={close}
          prefetch="intent"
          style={activeLinkStyle}
          to="/"
        >
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            style={viewport === 'desktop' ? navLinkStyle : activeLinkStyle}
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className="header-menu-mobile-toggle reset"
      onClick={() => open('mobile')}
    >
      <h3>☰</h3>
    </button>
  );
}

function HeaderSearchBar() {
  const {open} = useAside();
  return (
    <form
      className="header-search-form"
      onSubmit={(e) => {
        e.preventDefault();
        open('search');
      }}
    >
      <input
        className="header-search-input"
        type="text"
        placeholder="Search products by name, CAS number, or structure..."
        onFocus={() => open('search')}
        readOnly
      />
      <button type="submit" className="header-search-btn">
        Search
      </button>
    </form>
  );
}

function CartBadge({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      className="header-action-link header-cart-badge"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
    >
      Cart ({count})
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/1',
      resourceId: null,
      tags: [],
      title: 'Home',
      type: 'HTTP',
      url: '/',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/2',
      resourceId: null,
      tags: [],
      title: 'Suppliers',
      type: 'HTTP',
      url: '/pages/suppliers',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/3',
      resourceId: null,
      tags: [],
      title: 'Chemistry',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/4',
      resourceId: null,
      tags: [],
      title: 'Custom Synthesis',
      type: 'HTTP',
      url: '/pages/custom-synthesis',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/5',
      resourceId: null,
      tags: [],
      title: 'Search',
      type: 'HTTP',
      url: '/search',
      items: [],
    },
  ],
};

function navLinkStyle({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return {
    color: isPending ? 'rgba(255,255,255,0.6)' : 'white',
    fontWeight: isActive ? ('600' as const) : undefined,
    backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : undefined,
  };
}

function activeLinkStyle({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'black',
  };
}
