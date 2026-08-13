import {Suspense} from 'react';
import {Await, NavLink} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function Footer({
  footer: footerPromise,
  header,
  publicStoreDomain,
}: FooterProps) {
  return (
    <Suspense>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer className="bg-navy-footer text-white">
            <div className="flex items-center justify-between px-8 py-5">
              <NavLink to="/" className="no-underline flex-shrink-0">
                <span className="text-white font-bold text-lg">Oakwood</span>{' '}
                <span className="text-teal font-bold text-lg">Chemical</span>
              </NavLink>
              <FooterMenu
                menu={footer?.menu ?? null}
                primaryDomainUrl={header.shop.primaryDomain?.url ?? ''}
                publicStoreDomain={publicStoreDomain}
              />
            </div>
            <hr className="border-0 border-t border-white/20 mx-8" />
            <div className="text-center text-xs text-white/50 py-6 font-mono tracking-wide block">
              &copy; 2026 Oakwood Products Inc. All Rights Reserved.
            </div>
          </footer>
        )}
      </Await>
    </Suspense>
  );
}

function FooterMenu({
  menu,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  menu: FooterQuery['menu'] | null;
  primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
  publicStoreDomain: string;
}) {
  const linkClass = '!text-white/40 !text-xs hover:!text-white/80 no-underline whitespace-nowrap';

  return (
    <nav className="flex items-center gap-6" role="navigation">
      {(menu?.items ?? []).map((item) => {
        if (!item.url) return null;
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        const isExternal = !url.startsWith('/');
        return isExternal ? (
          <a href={url} key={item.id} rel="noopener noreferrer" target="_blank" className={linkClass}>
            {item.title}
          </a>
        ) : (
          <NavLink end key={item.id} prefetch="intent" to={url} className={linkClass}>
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

