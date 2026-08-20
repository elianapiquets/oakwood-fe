import {Link, useLoaderData} from 'react-router';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import type {Route} from './+types/($locale).account.company.$id';
import {getRootSeo} from '~/lib/seo';
import {getPathPrefix} from '~/lib/i18n';
import {locationIdToParam, locationParamToGid} from '~/lib/orderFilters';
import {
  AdminOnlyAction,
  CompanyBreadcrumb,
  CompanyCard,
  FieldLabel,
  InitialsBadge,
} from '~/components/Account/company/CompanyCard';

/**
 * Verified against the live 2026-04 schema — the bundled
 * `customer-account.schema.json` advertises several fields this API doesn't
 * have. Notably absent on `CompanyLocation`: `company`, `paymentInstruments`,
 * `taxExemptions`/`taxExemptionsDetails`; `CompanyAddress` exposes
 * `formattedAddress`, not `formatted`; and `BuyerExperienceConfiguration` has
 * only `deposit` and `payNowOnly` — no named payment-terms template.
 *
 * The company name and the authorization check come from `customer` in the
 * same document, so the page costs one request rather than two.
 */
const LOCATION_QUERY = `#graphql-customer-account
  query CompanyLocationDetail($locationId: ID!) {
    customer {
      companyContacts(first: 1) {
        nodes {
          company {
            id
            name
          }
          locations(first: 50) {
            nodes {
              id
            }
          }
        }
      }
    }
    companyLocation(id: $locationId) {
      id
      name
      taxIdentifier
      shippingAddress {
        formattedAddress
      }
      billingAddress {
        formattedAddress
      }
      buyerExperienceConfiguration {
        payNowOnly
      }
      contacts(first: 50) {
        nodes {
          id
          title
          customer {
            firstName
            lastName
            emailAddress {
              emailAddress
            }
          }
        }
      }
      roleAssignments(first: 50) {
        nodes {
          contact {
            id
          }
          role {
            name
          }
        }
      }
    }
  }
` as const;

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

  const seo: SeoConfig = {
    title: location.name,
    url: `${getPathPrefix(storefront)}/account/company/${locationIdToParam(location.id)}`,
  };

  return {
    location,
    companyName: contact?.company?.name ?? null,
    contacts,
    seo,
  };
}

export default function CompanyLocationPage() {
  const {location, companyName, contacts} = useLoaderData<typeof loader>();

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
            <dd className="mt-1 font-mono">{location.taxIdentifier ?? '—'}</dd>
            <dd className="mt-3 text-xs text-slate-400">
              Tax-exempt status and the exemption certificate aren&apos;t
              exposed on a company location by this API version.
            </dd>
          </dl>
        </CompanyCard>

        <CompanyCard
          title="Payment Terms"
          action={<AdminOnlyAction label="Edit" variant="link" />}
        >
          <div className="px-4 py-4 text-sm text-slate-700">
            {typeof payNowOnly === 'boolean' ? (
              <span className="inline-block rounded border border-blue-200 bg-blue-50 px-3 py-2 font-bold text-blue-700">
                {payNowOnly ? 'Pay now' : 'Net terms'}
              </span>
            ) : (
              <span className="text-slate-400">Not configured</span>
            )}
            <p className="mt-3 text-xs text-slate-400">
              Only whether net terms are allowed is available — the named
              template, such as &ldquo;Net 30&rdquo;, isn&apos;t exposed.
            </p>
          </div>
        </CompanyCard>

        <CompanyCard
          title="Payment Methods"
          action={<AdminOnlyAction label="+ Add" variant="link" />}
        >
          <div className="px-4 py-4 text-sm">
            <span className="text-slate-400">
              A company location&apos;s stored payment instruments aren&apos;t
              exposed by the Customer Account API.
            </span>
          </div>
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
