import {Link, useLoaderData} from 'react-router';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import type {Route} from './+types/($locale).account.company.$id';
import {getRootSeo} from '~/lib/seo';
import {getPathPrefix} from '~/lib/i18n';
import {fetchCompanyLocationBilling} from '~/lib/backend';
import {locationIdToParam, locationParamToGid} from '~/lib/orderFilters';
import {
  AdminOnlyAction,
  CompanyBreadcrumb,
  CompanyCard,
  FieldLabel,
  InitialsBadge,
} from '~/components/Account/company/CompanyCard';
import {LOCATION_QUERY} from '~/graphql/customer-account/CompanyLocationQuery';

/**
 * Verified against the live 2026-04 schema — the bundled
 * `customer-account.schema.json` advertises several fields this API doesn't
 * have. Notably absent on `CompanyLocation`: `company`, `paymentInstruments`,
 * `taxExemptions`/`taxExemptionsDetails`; `CompanyAddress` exposes
 * `formattedAddress`, not `formatted`; and `BuyerExperienceConfiguration` has
 * only `deposit` and `payNowOnly` — no named payment-terms template. The
 * named terms ("Net 30") are therefore read off the most recent order at the
 * location, via `paymentInformation.paymentTerms.paymentTermsName`, which
 * Shopify documents as the name of the template the terms were created from.
 *
 * The company name and the authorization check come from `customer` in the
 * same document, so the page costs one request rather than two.
 */

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo) ?? [];
};

export async function loader({context, params}: Route.LoaderArgs) {
  const {customerAccount, storefront} = context;

  if (!(await customerAccount.isLoggedIn())) {
    throw await customerAccount.login();
  }

  if (!params.id) {
    throw new Response('Location not found', {status: 404});
  }

  const locationId = locationParamToGid(params.id);

  const {data, errors} = await customerAccount.query(LOCATION_QUERY, {
    variables: {locationId},
  });

  const contact = data?.customer?.companyContacts?.nodes?.[0] ?? null;
  const location = data?.companyLocation;

  // Authorize against the contact's own locations: without this, any location
  // id in the URL could be probed.
  const myLocationIds = new Set(
    (contact?.locations?.nodes ?? []).map((node: any) => node.id),
  );

  if (!location || errors?.length || !myLocationIds.has(locationId)) {
    throw new Response('Location not found', {status: 404});
  }

  // Role per contact, so the customer list can show it inline.
  const roleByContactId = new Map<string, string>();
  for (const assignment of location.roleAssignments?.nodes ?? []) {
    if (assignment?.contact?.id && assignment.role?.name) {
      roleByContactId.set(assignment.contact.id, assignment.role.name);
    }
  }

  type LocationContact = {
    id: string;
    name: string | null;
    email: string | null;
    title: string | null;
    role: string | null;
  };
  const contacts: LocationContact[] = (location.contacts?.nodes ?? []).map(
    (node: any) => ({
      id: node.id,
      name:
        [node.customer?.firstName, node.customer?.lastName]
          .filter(Boolean)
          .join(' ') || null,
      email: node.customer?.emailAddress?.emailAddress ?? null,
      title: node.title ?? null,
      role: roleByContactId.get(node.id) ?? null,
    }),
  );

  // Two sources, in order of preference:
  //  1. the backend (Admin API) — the location's *configured* terms and its
  //     stored payment methods, neither of which the Customer Account API has
  //  2. the terms actually applied to the location's most recent order, which
  //     is the best the Customer Account API can offer
  const billing = await fetchCompanyLocationBilling(
    locationIdToParam(locationId),
  );

  const orderTermsName =
    location.orders?.nodes?.[0]?.paymentInformation?.paymentTerms
      ?.paymentTermsName ?? null;

  const paymentTerms = billing?.paymentTerms
    ? {
        name: billing.paymentTerms.name,
        description: billing.paymentTerms.description,
        dueInDays: billing.paymentTerms.dueInDays,
        source: 'configured' as const,
      }
    : orderTermsName
      ? {
          name: orderTermsName,
          description: null,
          dueInDays: null,
          source: 'order' as const,
        }
      : null;

  const paymentMethods = billing?.paymentMethods ?? [];

  // `fetchCompanyLocationBilling` returns null when the backend is unreachable
  // or the location isn't found. Distinguish that from "configured as nothing",
  // so a backend that's simply down doesn't read as absent configuration.
  const billingUnavailable = billing === null;

  // The Admin API (via the backend) has the real tax settings; the Customer
  // Account API only ever offered `taxIdentifier`.
  const tax = {
    taxId: billing?.tax?.taxId ?? location.taxIdentifier ?? null,
    taxExempt: billing?.tax?.taxExempt ?? null,
  };

  const seo: SeoConfig = {
    title: location.name,
    url: `${getPathPrefix(storefront)}/account/company/${locationIdToParam(location.id)}`,
  };

  return {
    location,
    companyName: contact?.company?.name ?? null,
    contacts,
    paymentTerms,
    paymentMethods,
    tax,
    billingUnavailable,
    seo,
  };
}

export default function CompanyLocationPage() {
  const {
    location,
    companyName,
    contacts,
    paymentTerms,
    paymentMethods,
    tax,
    billingUnavailable,
  } = useLoaderData<typeof loader>();

  const payNowOnly = location.buyerExperienceConfiguration?.payNowOnly;

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-8">
      <Link
        to="/account/company"
        prefetch="intent"
        className="text-sm font-medium text-slate-500 no-underline hover:text-navy"
      >
        ‹ {companyName ?? 'Company'}
      </Link>

      <CompanyBreadcrumb path={`/account/company/${location.name}`} />

      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-navy">
        {location.name}
      </h1>
      {companyName ? (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <span aria-hidden="true">🏢</span>
          {companyName}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <CompanyCard
          title="Shipping Address"
          action={<AdminOnlyAction label="Edit" variant="link" />}
        >
          <div className="px-4 py-4 text-sm text-slate-700">
            {location.shippingAddress?.formattedAddress?.length ? (
              <address className="not-italic">
                {location.shippingAddress.formattedAddress.map(
                  (line: string) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ),
                )}
              </address>
            ) : (
              <span className="text-slate-400">
                No shipping address on file
              </span>
            )}
          </div>
        </CompanyCard>

        <CompanyCard
          title="Tax Details"
          action={<AdminOnlyAction label="Edit" variant="link" />}
        >
          <dl className="px-4 py-4 text-sm text-slate-700">
            <FieldLabel>Tax ID / EIN</FieldLabel>
            <dd className="mt-1 font-mono">{tax.taxId ?? '—'}</dd>
            {billingUnavailable ? (
              <dd className="mt-2 text-xs text-slate-400">
                Tax-exempt status needs the backend, which is unreachable.
              </dd>
            ) : null}
            {tax.taxExempt === null ? null : (
              <dd className="mt-3 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 items-center justify-center rounded text-[0.6rem] font-bold text-white ${
                    tax.taxExempt ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  {tax.taxExempt ? '✓' : ''}
                </span>
                <span className="text-sm">
                  {tax.taxExempt ? 'Tax exempt' : 'Not tax exempt'}
                </span>
              </dd>
            )}
          </dl>
        </CompanyCard>

        <CompanyCard
          title="Payment Terms"
          action={<AdminOnlyAction label="Edit" variant="link" />}
        >
          <div className="flex items-start gap-3 px-4 py-4 text-sm text-slate-700">
            {paymentTerms ? (
              <>
                <span className="inline-block rounded border border-blue-200 bg-blue-50 px-3 py-2 font-bold text-blue-700">
                  {paymentTerms.name}
                </span>
                <span className="pt-2 text-xs text-slate-500">
                  {paymentTerms.description ??
                    (paymentTerms.dueInDays
                      ? `Payment due within ${paymentTerms.dueInDays} days of invoice.`
                      : null) ??
                    (paymentTerms.source === 'order'
                      ? "From this location's most recent order."
                      : null)}
                </span>
              </>
            ) : typeof payNowOnly === 'boolean' ? (
              <span className="inline-block rounded border border-blue-200 bg-blue-50 px-3 py-2 font-bold text-blue-700">
                {payNowOnly ? 'Pay now' : 'Net terms'}
              </span>
            ) : billingUnavailable ? (
              <span className="text-slate-400">
                Couldn&apos;t load payment terms — the backend is unreachable.
              </span>
            ) : (
              <span className="text-slate-400">Not configured</span>
            )}
          </div>
        </CompanyCard>
        <CompanyCard
          title="Payment Methods"
          action={<AdminOnlyAction label="+ Add" variant="link" />}
        >
          {paymentMethods.length ? (
            <ul className="divide-y divide-slate-100">
              {paymentMethods.map((method) => (
                <li
                  key={method.id}
                  className="flex items-center gap-3 px-4 py-3 text-sm"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-50"
                  >
                    💳
                  </span>
                  <span>
                    <span className="block font-semibold text-slate-900">
                      {method.label}
                    </span>
                    {method.detail ? (
                      <span className="block text-xs text-slate-500">
                        {method.detail}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-3 px-4 py-4 text-sm">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-50"
              >
                💳
              </span>
              <span className="text-slate-500">
                {billingUnavailable
                  ? "Couldn't load payment methods — the backend is unreachable."
                  : 'No payment methods added'}
              </span>
            </div>
          )}
        </CompanyCard>
      </div>

      <CompanyCard
        title="Customers"
        count={contacts.length}
        className="mt-6"
        action={<AdminOnlyAction label="+ Add Customer" />}
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-4 py-2">
                Name
              </th>
              <th scope="col" className="px-4 py-2">
                Email
              </th>
              <th scope="col" className="px-4 py-2">
                Role
              </th>
              <th scope="col" className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2.5">
                    <InitialsBadge
                      value={contact.name ?? contact.email ?? '?'}
                      shape="circle"
                    />
                    <span className="text-sm font-semibold text-slate-900">
                      {contact.name ?? 'Unnamed contact'}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {contact.email ?? '—'}
                </td>
                <td className="px-4 py-3">
                  {contact.role ? (
                    <span className="inline-block rounded bg-blue-50 px-2 py-0.5 font-mono text-xs text-blue-700">
                      {contact.role}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminOnlyAction label="Change Role" variant="link" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CompanyCard>
    </div>
  );
}
