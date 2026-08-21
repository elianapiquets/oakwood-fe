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
  TEMP_SHIPPING_ADDRESS,
  createLocationSchema,
} from '~/components/Account/Location';
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

  // TEMP diagnostic — remove once the create path is confirmed.
  console.warn('[create-location] 2. raw formData', raw);

  // Re-validated server-side: the client resolver is a convenience, not a
  // guarantee, and FormData arrives as strings either way.
  const parsed = createLocationSchema.safeParse({
    ...raw,
    editableShippingAddress: raw.editableShippingAddress === 'true',
  });

  if (!parsed.success) {
    // TEMP diagnostic — remove once the create path is confirmed.
    console.log(
      '[create-location] 3. ZOD FAILED',
      JSON.stringify(parsed.error.issues, null, 2),
    );

    return {
      error:
        parsed.error.issues[0]?.message ?? 'Please check the form and retry.',
    };
  }

  const values = parsed.data;

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
    // TEMP — see TEMP_SHIPPING_ADDRESS. Shopify rejects the mutation without a
    // shipping address, so this stands in until the real fields exist.
    shippingAddress: {...TEMP_SHIPPING_ADDRESS},
    billingSameAsShipping: true,
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

  // TEMP diagnostic — remove once the create path is confirmed.
  console.log(
    '[create-location] 4. admin input',
    company.id,
    JSON.stringify(input, null, 2),
  );

  const result = await createCompanyLocation(company.id, input);

  if (!result.ok) {
    // TEMP diagnostic — remove once the create path is confirmed.
    console.warn('[create-location] 5. BACKEND FAILED', result.error);

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
