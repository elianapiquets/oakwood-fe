import {Link, useLoaderData} from 'react-router';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import type {Route} from './+types/($locale).account.company._index';
import {getRootSeo} from '~/lib/seo';
import {getPathPrefix} from '~/lib/i18n';
import {locationIdToParam} from '~/lib/orderFilters';
import {
  CompanyBreadcrumb,
  CompanyCard,
  InitialsBadge,
} from '~/components/Account/company/CompanyCard';
import {COMPANY_QUERY} from '~/graphql/customer-account/CompanyOverviewQuery';

/**
 * Fields verified against the live 2026-04 schema. `contacts` is fetched only
 * to count the people at each location for the summary line — `OrderConnection`
 * and friends expose no `totalCount`, so a count means fetching ids.
 */

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo) ?? [];
};

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount, storefront} = context;

  if (!(await customerAccount.isLoggedIn())) {
    throw await customerAccount.login();
  }

  const {data} = await customerAccount.query(COMPANY_QUERY);
  const contact = data?.customer?.companyContacts?.nodes?.[0] ?? null;
  const company = contact?.company ?? null;

  if (!company) {
    throw new Response('No company for this customer', {status: 404});
  }

  type CompanyLocationRow = {
    id: string;
    name: string;
    area: string | null;
    customerCount: number;
    /** Only `payNowOnly` is exposed — there's no named terms template. */
    netTermsAllowed: boolean | null;
  };

  const locations: CompanyLocationRow[] = (contact?.locations?.nodes ?? []).map(
    (location: any) => {
      const city = location.shippingAddress?.city ?? null;
      const zone = location.shippingAddress?.zoneCode ?? null;

      return {
        id: location.id as string,
        name: location.name as string,
        area: [city, zone].filter(Boolean).join(', ') || null,
        customerCount: location.contacts?.nodes?.length ?? 0,
        netTermsAllowed:
          typeof location.buyerExperienceConfiguration?.payNowOnly === 'boolean'
            ? !location.buyerExperienceConfiguration.payNowOnly
            : null,
      };
    },
  );

  const seo: SeoConfig = {
    title: company.name,
    url: `${getPathPrefix(storefront)}/account/company`,
  };

  return {company, locations, seo};
}

export default function CompanyPage() {
  const {company, locations} = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-8">
      <CompanyBreadcrumb path="/account/company" />
      <h1 className="mt-1 mb-6 text-3xl font-extrabold tracking-tight text-navy">
        {company.name}
      </h1>

      <CompanyCard title="Display Name">
        <div className="flex items-center gap-3 px-4 py-4">
          <InitialsBadge value={company.name} />
          <div>
            <span className="block text-sm font-bold text-slate-900">
              {company.name}
            </span>
            <span className="block font-mono text-xs text-slate-500">
              ID: {company.externalId ?? company.id.split('/').pop()}
            </span>
          </div>
        </div>
      </CompanyCard>

      <CompanyCard
        title="Locations"
        count={locations.length}
        className="mt-6"
        action={
          <Link
            to="/account/company/create-location"
            prefetch="intent"
            className="rounded bg-navy px-3 py-1.5 text-sm font-semibold !text-white no-underline hover:opacity-90"
          >
            + Add Location
          </Link>
        }
      >
        <ul className="divide-y divide-slate-100">
          {locations.map((location) => (
            <li
              key={location.id}
              className="flex items-center justify-between gap-4 px-4 py-4"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-500"
                >
                  📍
                </span>
                <div>
                  <span className="block text-sm font-bold text-slate-900">
                    {location.name}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {[
                      location.area,
                      `${location.customerCount} ${location.customerCount === 1 ? 'customer' : 'customers'}`,
                      location.netTermsAllowed === null
                        ? null
                        : location.netTermsAllowed
                          ? 'Net terms'
                          : 'Pay now',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
              </div>
              <Link
                to={`/account/company/${locationIdToParam(location.id)}`}
                prefetch="intent"
                className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50"
              >
                View Location ›
              </Link>
            </li>
          ))}
        </ul>
      </CompanyCard>
    </div>
  );
}
