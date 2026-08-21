import {redirect, useActionData, useLoaderData} from 'react-router';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import type {Route} from './+types/($locale).account.company.create-location';

import {getRootSeo} from '~/lib/seo';
import {getPathPrefix} from '~/lib/i18n';
import {locationIdToParam} from '~/lib/orderFilters';
import {slugify} from '~/lib/slug';
import {
  createCompanyLocation,
  fetchPaymentTermsTemplates,
} from '~/lib/backend';
import {COMPANY_QUERY} from '~/graphql/customer-account/CompanyOverviewQuery';
import {
  CreateLocationForm,
  NO_PAYMENT_TERMS,
  createLocationSchema,
} from '~/components/Account/Location';
import {
  addressSchema,
  toAddressInput,
  type AddressValues,
} from '~/components/Address';
import {CompanyBreadcrumb} from '~/components/Account/company/CompanyCard';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo) ?? [];
};

/**
 * The company is never a request parameter. Both the loader and the action read
 * it from the signed-in customer's own `companyContacts`, so a customer can
 * only add a location to their own company — and a customer with no company
 * can't reach the page at all.
 *
 * That check has to live here: `oakwood-be` authenticates with one shared
 * `x-api-key` and cannot tell one customer from another.
 */
async function requireCustomerCompany(
  customerAccount: Route.LoaderArgs['context']['customerAccount'],
) {
  if (!(await customerAccount.isLoggedIn())) {
    throw await customerAccount.login();
  }

  const {data} = await customerAccount.query(COMPANY_QUERY);
  const contact = data?.customer?.companyContacts?.nodes?.[0] ?? null;
  const company = contact?.company ?? null;

  if (!company || !contact?.id) {
    throw new Response('No company for this customer', {status: 404});
  }

  // The contact id comes from the session too, for the same reason the company
  // does — the new location is assigned to whoever is signed in, never to an
  // id supplied by the form.
  return {
    company: company as {id: string; name: string},
    contactId: contact.id as string,
  };
}

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount, storefront} = context;

  const {company} = await requireCustomerCompany(customerAccount);

  // Fetched, not hardcoded: `companyLocationCreate` needs a real
  // PaymentTermsTemplate gid.
  const paymentTermsOptions = await fetchPaymentTermsTemplates();

  const seo: SeoConfig = {
    title: `New location for ${company.name}`,
    url: `${getPathPrefix(storefront)}/account/company/create-location`,
  };

  return {
    company,
    paymentTermsOptions: paymentTermsOptions.map(({id, name}) => ({id, name})),
    seo,
  };
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;

  const {company, contactId} = await requireCustomerCompany(customerAccount);

  const formData = await request.formData();
  const raw = Object.fromEntries(formData);

  // Re-validated server-side: the client resolver is a convenience, not a
  // guarantee, and FormData arrives as strings either way.
  const parsed = createLocationSchema.safeParse({
    ...raw,
    editableShippingAddress: raw.editableShippingAddress === 'true',
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? 'Please check the form and retry.',
    };
  }

  const values = parsed.data;

  /**
   * The addresses arrive as JSON, one blob each, because they're edited in a
   * dialog with its own form rather than as fields of this one. Re-validated
   * here for the same reason the rest is: the client resolver is a convenience,
   * not a guarantee.
   */
  function parseAddress(field: string): AddressValues | null | 'invalid' {
    const value = raw[field];
    if (typeof value !== 'string' || !value) return null;

    try {
      const result = addressSchema.safeParse(JSON.parse(value));
      return result.success ? result.data : 'invalid';
    } catch {
      return 'invalid';
    }
  }

  const shippingAddress = parseAddress('shippingAddress');
  const billingAddress = parseAddress('billingAddress');
  const billingSameAsShipping = raw.billingSameAsShipping === 'true';

  if (shippingAddress === 'invalid' || billingAddress === 'invalid') {
    return {error: 'That address is incomplete. Please check it and retry.'};
  }

  // Shopify rejects the mutation outright without a shipping address.
  if (!shippingAddress) {
    return {error: 'A shipping address is required.'};
  }

  const input = {
    name: values.name,
    // A blank Location ID becomes a slug of the name, so every location has a
    // stable external identifier.
    externalId: values.externalId || slugify(values.name),
    // Shopify creates a location with no contacts, which the account pages then
    // 404 on: they authorize against the customer's own
    // `companyContacts.locations`. Assigning the creator makes the location they
    // just made reachable, and puts it in their locations list.
    assignContactId: contactId,
    shippingAddress: toAddressInput(shippingAddress),
    // When this is true Shopify ignores `billingAddress` entirely, so it's only
    // sent when the customer supplied a different one.
    billingSameAsShipping,
    ...(!billingSameAsShipping && billingAddress
      ? {billingAddress: toAddressInput(billingAddress)}
      : {}),
    ...(values.taxRegistrationId
      ? {taxRegistrationId: values.taxRegistrationId}
      : {}),
    // The three admin tax choices collapse to one boolean; the middle one needs
    // a `taxExemptions` list this form doesn't collect yet.
    taxExempt: values.taxSetting === 'NO_COLLECT',
    buyerExperienceConfiguration: {
      checkoutToDraft: values.orderSubmission === 'DRAFT',
      editableShippingAddress: values.editableShippingAddress,
      ...(values.paymentTermsTemplateId !== NO_PAYMENT_TERMS
        ? {paymentTermsTemplateId: values.paymentTermsTemplateId}
        : {}),
    },
  };

  const result = await createCompanyLocation(company.id, input);

  if (!result.ok) {
    return {error: result.error};
  }

  return redirect(
    `/account/company/${locationIdToParam(result.location.id)}`,
  );
}

export default function CreateLocationPage() {
  const {company, paymentTermsOptions} = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-8">
      <CompanyBreadcrumb path="/account/company" />
      <h1 className="mt-1 mb-6 text-3xl font-extrabold tracking-tight text-navy">
        New location for {company.name}
      </h1>

      <CreateLocationForm
        companyName={company.name}
        paymentTermsOptions={paymentTermsOptions}
        serverError={actionData?.error ?? null}
      />
    </div>
  );
}
