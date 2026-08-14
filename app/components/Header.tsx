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
    <div className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Main header row */}
      <div className="flex items-center px-6 py-3 bg-white gap-4">
        <NavLink prefetch="intent" to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0" end>
          <div className="w-11 h-11 bg-navy text-white flex items-center justify-center font-extrabold text-base rounded flex-shrink-0">
            OC
          </div>
          <div className="flex flex-col">
            <span className="text-[1.4rem] font-bold leading-tight whitespace-nowrap">
              <span className="text-navy">Oakwood</span>{' '}
              <span className="text-teal">Chemical</span>
            </span>
            <span className="text-[0.65rem] text-gray-400 tracking-wider">
              Enabling Discovery
            </span>
          </div>
        </NavLink>

        <div className="hidden md:block flex-1 text-center">
          <p className="text-sm font-semibold text-navy m-0 mb-0.5">
            Supporting Scientific Discovery, It&apos;s in our Chemistry
          </p>
          <p className="text-[0.8rem] text-teal m-0">
            Chemicals for Research &amp; Development
          </p>
        </div>

        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          <NavLink
            to="/pages/contact"
            aria-label="Contact us"
            className="text-gray-500 hover:text-navy"
          >
            <MailIcon />
          </NavLink>
          <UserAvatar customerName={customerName} />
          <CartToggle cart={cart} />
        </div>
      </div>

      {/* Nav bar */}
      <div className="bg-navy flex items-center text-white">
        <HeaderMenu
          menu={menu}
          viewport="desktop"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
        <HeaderMenuMobileToggle />
      </div>

      {/* Search row */}
      <div className="hidden md:flex items-center px-6 py-2 gap-3 bg-gray-50 border-b border-gray-200">
        <HeaderSearchBar />
        <span className="text-gray-300 select-none">|</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <NavLink
            to="/search"
            className="text-gray-700 text-xs px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 whitespace-nowrap no-underline"
          >
            Structure Search
          </NavLink>
          <NavLink
            to="/account"
            className="text-gray-700 text-xs px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 whitespace-nowrap no-underline"
          >
            Track Your Order
          </NavLink>
          <a
            href="tel:18004673386"
            className="text-gray-700 text-xs font-bold whitespace-nowrap ml-2 no-underline"
          >
            1-800-467-3386
          </a>
        </div>
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
  const {close} = useAside();

  function resolveUrl(rawUrl: string) {
    if (
      rawUrl.includes('myshopify.com') ||
      rawUrl.includes(publicStoreDomain) ||
      rawUrl.includes(primaryDomainUrl)
    ) {
      return new URL(rawUrl).pathname;
    }
    return rawUrl;
  }

  if (viewport === 'mobile') {
    return (
      <nav className="flex flex-col gap-4" role="navigation">
        <NavLink
          end
          onClick={close}
          prefetch="intent"
          to="/"
          className={({isActive}) =>
            isActive ? 'font-bold text-black' : 'text-gray-700'
          }
        >
          Home
        </NavLink>
        {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
          if (!item.url) return null;
          const url = resolveUrl(item.url);
          const isExternal = url.startsWith('http');
          return (
            <div key={item.id}>
              {isExternal ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700"
                  onClick={close}
                >
                  {item.title}
                </a>
              ) : (
                <NavLink
                  className={({isActive}) =>
                    isActive ? 'font-bold text-black' : 'text-gray-700'
                  }
                  onClick={close}
                  prefetch="intent"
                  to={url}
                >
                  {item.title}
                </NavLink>
              )}
              {item.items && item.items.length > 0 && (
                <div className="pl-4 mt-2 flex flex-col gap-2">
                  {item.items.map((child) => {
                    if (!child.url) return null;
                    const childUrl = resolveUrl(child.url);
                    const childIsExternal = childUrl.startsWith('http');
                    return childIsExternal ? (
                      <a
                        key={child.id}
                        href={childUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-teal"
                        onClick={close}
                      >
                        {child.title}
                      </a>
                    ) : (
                      <NavLink
                        key={child.id}
                        to={childUrl}
                        className="text-sm text-gray-600 hover:text-teal"
                        onClick={close}
                        prefetch="intent"
                      >
                        {child.title}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="hidden md:flex px-3" role="navigation">
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;
        const url = resolveUrl(item.url);
        const isExternal = url.startsWith('http');
        const hasChildren = item.items && item.items.length > 0;
        const navLinkClass = (isActive: boolean) =>
          [
            'flex items-center gap-1 px-3.5 py-2.5 text-[0.85rem] whitespace-nowrap no-underline border-b-2 transition-colors',
            isActive
              ? 'text-white font-semibold border-teal'
              : 'text-white/85 border-transparent hover:text-white hover:bg-white/10',
          ].join(' ');

        if (hasChildren) {
          const noLink = url === '#' || url === '';
          return (
            <div key={item.id} className="relative group flex items-center">
              {noLink ? (
                <button
                  type="button"
                  className={navLinkClass(false)}
                >
                  {item.title}
                  <span className="text-[0.6rem] opacity-75">▾</span>
                </button>
              ) : isExternal ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={navLinkClass(false)}
                  onClick={close}
                >
                  {item.title}
                  <span className="text-[0.6rem] opacity-75">▾</span>
                </a>
              ) : (
                <NavLink
                  className={({isActive}) => navLinkClass(isActive)}
                  to={url}
                  prefetch="intent"
                  onClick={close}
                >
                  {item.title}
                  <span className="text-[0.6rem] opacity-75">▾</span>
                </NavLink>
              )}
              <div className="hidden group-hover:block absolute top-full left-0 bg-white shadow-lg min-w-[210px] z-50 border-t-2 border-teal text-gray-700">
                {item.items.map((child) => {
                  if (!child.url) return null;
                  const childUrl = resolveUrl(child.url);
                  const childIsExternal = childUrl.startsWith('http');
                  return childIsExternal ? (
                    <a
                      key={child.id}
                      href={childUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-5 py-3 text-gray-700 text-sm border-b border-gray-100 last:border-b-0 hover:bg-gray-50 hover:text-teal no-underline"
                      onClick={close}
                    >
                      {child.title}
                    </a>
                  ) : (
                    <NavLink
                      key={child.id}
                      to={childUrl}
                      className="block px-5 py-3 text-gray-700 text-sm border-b border-gray-100 last:border-b-0 hover:bg-gray-50 hover:text-teal no-underline"
                      onClick={close}
                      prefetch="intent"
                    >
                      {child.title}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        }

        const noLink = url === '#' || url === '';
        return noLink ? (
          <span key={item.id} className={navLinkClass(false)}>
            {item.title}
          </span>
        ) : isExternal ? (
          <a
            key={item.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={navLinkClass(false)}
            onClick={close}
          >
            {item.title}
          </a>
        ) : (
          <NavLink
            className={({isActive}) => navLinkClass(isActive)}
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
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
      className="text-white ml-auto pr-4 md:hidden text-xl"
      onClick={() => open('mobile')}
    >
      ☰
    </button>
  );
}

function HeaderSearchBar() {
  return (
    <form
      className="flex flex-1 min-w-130 max-w-[720px] items-center gap-2"
      action="/search"
      method="get"
    >
      <span className="text-gray-400 text-sm flex-shrink-0">🔍</span>
      <input
        className="flex-1 py-1.5 text-xs outline-none bg-transparent text-gray-700 placeholder:text-[0.85rem] placeholder:text-gray-400"
        style={{border: 'none', margin: 0}}
        type="text"
        name="q"
        placeholder="Search products by name, CAS number, or structure..."
        autoComplete="off"
      />
      <span className="text-white">
        <button
          type="submit"
          className="bg-navy px-5 py-1.5 text-sm font-semibold cursor-pointer hover:bg-navy-dark rounded flex-shrink-0"
          style={{border: 'none'}}
        >
          Search
        </button>
      </span>
    </form>
  );
}

function CartBadge({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
      className="relative text-gray-500 hover:text-navy cursor-pointer"
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
      <BagIcon />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-navy px-1 text-[0.6rem] font-semibold text-white">
          {count}
        </span>
      )}
    </a>
  );
}

function UserAvatar({
  customerName,
}: {
  customerName: HeaderProps['customerName'];
}) {
  return (
    <Suspense
      fallback={
        <NavLink to="/account/login" aria-label="Account" className="text-gray-500 hover:text-navy">
          <UserIcon />
        </NavLink>
      }
    >
      <Await resolve={customerName}>
        {(name) =>
          name ? (
            <NavLink
              to="/account"
              aria-label={`Account, signed in as ${name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-semibold !text-white"
            >
              {name.charAt(0).toUpperCase()}
            </NavLink>
          ) : (
            <NavLink to="/account/login" aria-label="Account" className="text-gray-500 hover:text-navy">
              <UserIcon />
            </NavLink>
          )
        }
      </Await>
    </Suspense>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h12l1 12H5L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
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
