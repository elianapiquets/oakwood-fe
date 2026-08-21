import {Link, useLoaderData} from 'react-router';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import type {Route} from './+types/($locale).account.company.$id';
import {getRootSeo} from '~/lib/seo';
import {getPathPrefix} from '~/lib/i18n';
import {
  assignCompanyLocationAddress,
  fetchCompanyLocationBilling,
} from '~/lib/backend';
import {locationIdToParam, locationParamToGid} from '~/lib/orderFilters';
import {roleCanEdit} from '~/lib/b2bRoles';
import {
  AdminOnlyAction,
  CompanyBreadcrumb,
  CompanyCard,
  FieldLabel,
  InitialsBadge,
} from '~/components/Account/company/CompanyCard';
import {LOCATION_QUERY} from '~/graphql/customer-account/CompanyLocationQuery';
import {LocationAddressCard} from '~/components/Account/Location';
import {
  addressSchema,
  toAddressInput,
  type AddressValues,
} from '~/components/Address';

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

type LocationPermissions = {
  shippingAddress: boolean;
  billingAddress: boolean;
  location: boolean;
  contacts: boolean;
  contactRoles: boolean;
};

const NO_PERMISSIONS: LocationPermissions = {
  shippingAddress: false,
  billingAddress: false,
  location: false,
  contacts: false,
  contactRoles: false,
};

/**
 * What the signed-in contact may change at this location.
 *
 * Derived from the viewer's own role assignment, per resource — not from the
 * role's name, which is editable in Admin and would fail permissively. A
 * contact with no assignment here gets nothing, which is the safe direction.
 */
function locationPermissions(
  viewerContactId: string | null,
  roleAssignments: any[],
): LocationPermissions {
  if (!viewerContactId) return NO_PERMISSIONS;

  const mine = roleAssignments.find(
    (assignment) => assignment?.contact?.id === viewerContactId,
  );
  const role = mine?.role;
  if (!role) return NO_PERMISSIONS;

  return {
    shippingAddress: roleCanEdit(role.shippingAddressPermission, role.name),
    billingAddress: roleCanEdit(role.billingAddressPermission, role.name),
    location: roleCanEdit(role.locationPermission, role.name),
    contacts: roleCanEdit(role.contactPermission, role.name),
    contactRoles: roleCanEdit(role.contactRolePermission, role.name),
  };
}

/**
 * Shopify's `CompanyAddress` into the dialog's shape. Blank rather than null
 * throughout, because the form fields are controlled — and `null` when there's
 * no address at all, which is what makes the card read "Add" instead of "Edit".
 */
function toAddressValues(node: any): AddressValues | null {
  if (!node) return null;

  return {
    countryCode: node.countryCode ?? 'US',
    firstName: node.firstName ?? '',
    lastName: node.lastName ?? '',
    recipient: node.recipient ?? '',
    address1: node.address1 ?? '',
    address2: node.address2 ?? '',
    city: node.city ?? '',
    zoneCode: node.zoneCode ?? '',
    zip: node.zip ?? '',
    phone: node.phone ?? '',
  };
}

/**
 * Setting an address is an Admin operation, so it goes through the backend —
 * but the ownership check has to happen here. The backend authenticates the
 * storefront with one shared key and can't tell whose location this is, so the
 * location is re-read from the signed-in customer's own contacts first, exactly
 * as the loader does.
 */
export async function action({context, params, request}: Route.ActionArgs) {
  const {customerAccount} = context;

  if (!(await customerAccount.isLoggedIn())) {
    throw await customerAccount.login();
  }

  if (!params.id) {
    throw new Response('Location not found', {status: 404});
  }

  const locationId = locationParamToGid(params.id);

  const {data} = await customerAccount.query(LOCATION_QUERY, {
    variables: {locationId},
  });

  const contact = data?.customer?.companyContacts?.nodes?.[0] ?? null;
  const myLocationIds = new Set(
    (contact?.locations?.nodes ?? []).map((node: any) => node.id),
  );

  if (!myLocationIds.has(locationId)) {
    throw new Response('Location not found', {status: 404});
  }

  const formData = await request.formData();

  if (formData.get('intent') !== 'address') {
    return {error: 'Unsupported action'};
  }

  const addressType = formData.get('addressType');
  if (addressType !== 'SHIPPING' && addressType !== 'BILLING') {
    return {error: 'Unsupported address type'};
  }

  // Hiding the button is presentation; this is the actual control. A contact
  // without edit permission at this location can still post to this action.
  const permissions = locationPermissions(
    contact?.id ?? null,
    data?.companyLocation?.roleAssignments?.nodes ?? [],
  );
  const allowed =
    addressType === 'SHIPPING'
      ? permissions.shippingAddress
      : permissions.billingAddress;

  if (!allowed) {
    return {error: 'You do not have permission to change this address.'};
  }

  const raw = formData.get('address');
  if (typeof raw !== 'string') {
    return {error: 'No address supplied'};
  }

  let parsed;
  try {
    parsed = addressSchema.safeParse(JSON.parse(raw));
  } catch {
    return {error: 'That address could not be read.'};
  }

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'That address is incomplete.',
    };
  }

  const result = await assignCompanyLocationAddress(
    locationIdToParam(locationId),
    // Blank fields are dropped, not sent as empty strings — Shopify parses
    // `phone`, so `phone: ''` reads as an invalid number.
    toAddressInput(parsed.data),
    [addressType],
  );

  if (!result.ok) return {error: result.error};

  return {ok: true};
}

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

  // TEMP diagnostic — remove once the permission gate is confirmed.
  console.warn(
    '[location perms] viewerContactId=' +
      String(contact?.id) +
      ' roleAssignments=' +
      JSON.stringify(location.roleAssignments?.nodes ?? []),
  );

  return {
    location,
    shippingAddress: toAddressValues(location.shippingAddress),
    billingAddress: toAddressValues(location.billingAddress),
    permissions: locationPermissions(
      contact?.id ?? null,
      location.roleAssignments?.nodes ?? [],
    ),
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
    shippingAddress,
    billingAddress,
    permissions,
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
        <LocationAddressCard
          title="Shipping Address"
          addressType="SHIPPING"
          address={shippingAddress}
          formattedAddress={location.shippingAddress?.formattedAddress ?? null}
          emptyLabel="No shipping address on file"
          canEdit={permissions.shippingAddress}
        />

        <LocationAddressCard
          title="Billing Address"
          addressType="BILLING"
          address={billingAddress}
          formattedAddress={location.billingAddress?.formattedAddress ?? null}
          emptyLabel="No billing address on file"
          canEdit={permissions.billingAddress}
        />

        <CompanyCard
          title="Tax Details"
          action={
            permissions.location ? (
              <AdminOnlyAction label="Edit" variant="link" />
            ) : null
          }
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
          action={
            permissions.location ? (
              <AdminOnlyAction label="Edit" variant="link" />
            ) : null
          }
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
          action={
            /* PAYMENT_METHOD is its own ResourceType; until it's fetched this
               follows the location permission, which a location admin has. */
            permissions.location ? (
              <AdminOnlyAction label="+ Add" variant="link" />
            ) : null
          }
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
        action={
          permissions.contacts ? (
            <AdminOnlyAction label="+ Add Customer" />
          ) : null
        }
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
                  {permissions.contactRoles ? (
                        <AdminOnlyAction label="Change Role" variant="link" />
                      ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CompanyCard>
    </div>
  );
}
