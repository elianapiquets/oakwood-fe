import {useSubmit, useNavigation} from 'react-router';
import {useForm} from 'react-hook-form';
import type {SubmitHandler} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';

import {Checkbox, Form2} from '~/components/ui';
import {CompanyCard} from '~/components/Account/company/CompanyCard';
import {AddressPlaceholder} from './AddressPlaceholder';
import {
  CREATE_LOCATION_DEFAULTS,
  NO_PAYMENT_TERMS,
  ORDER_SUBMISSION_OPTIONS,
  TAX_SETTING_OPTIONS,
  createLocationSchema,
  type CreateLocationValues,
} from './constants';

export type PaymentTermsOption = {id: string; name: string};

/**
 * Company location create form, modelled on Shopify admin's "New location".
 *
 * `Form2` is only the `<form>` element; each `Form2.Item` binds one field, so
 * the fields can sit at any depth — inside these cards, in this case — while
 * still sharing a single `useForm` instance.
 *
 * Hints live *outside* their `Form2.Item`. An Item forwards the injected field
 * props to every element child, so a bare `<p>` inside one would receive
 * `errormessage`, `onChange` and friends as DOM attributes. Only field-aware
 * components belong directly inside an Item.
 *
 * No company id is submitted: the route action reads the company from the
 * signed-in customer's session, so a customer can only add a location to their
 * own company.
 */
export function CreateLocationForm({
  companyName,
  paymentTermsOptions,
  serverError,
}: {
  companyName: string;
  paymentTermsOptions: PaymentTermsOption[];
  serverError?: string | null;
}) {
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSaving = navigation.state !== 'idle';

  const methods = useForm<CreateLocationValues>({
    resolver: zodResolver(createLocationSchema),
    defaultValues: CREATE_LOCATION_DEFAULTS,
  });

  const paymentTermsItems = [
    {value: NO_PAYMENT_TERMS, label: 'No payment terms'},
    ...paymentTermsOptions.map(({id, name}) => ({value: id, label: name})),
  ];

  const onSubmit: SubmitHandler<CreateLocationValues> = (values) => {
    // TEMP diagnostic — remove once the create path is confirmed.
    console.warn('[create-location] 1. rhf values', values);

    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      formData.append(key, String(value));
    }
    void submit(formData, {method: 'post'});
  };

  return (
    <Form2 onSubmit={(event) => void methods.handleSubmit(onSubmit)(event)}>
      <div>
          {serverError ? (
            <p
              role="alert"
              className="mb-6 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {serverError}
            </p>
          ) : null}
      </div>

      <CompanyCard title="Shipping address">
        <div className="flex flex-col gap-3 px-4 py-4">
          <AddressPlaceholder label="Add address" />
          <label
            htmlFor="billingSameAsShipping"
            className="flex items-center gap-2 text-sm text-slate-400"
          >
            <Checkbox id="billingSameAsShipping" checked disabled />
            Billing address is same as shipping address
          </label>
        </div>
      </CompanyCard>

      <CompanyCard title="Location details" className="mt-6">
        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Form2.Item methods={methods} name="name">
              <Form2.Label label="Location name" colon={false} required />
              <Form2.Input id="name" placeholder="Midtown" />
              <Form2.Error />
            </Form2.Item>
            <p className="text-xs text-slate-500">
              Used by customers to identify which location an order is for.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Form2.Item methods={methods} name="externalId">
              <Form2.Label label="Location ID" colon={false} />
              <Form2.Input id="externalId" />
              <Form2.Error />
            </Form2.Item>
            <p className="text-xs text-slate-500">
              Add an existing external ID, or leave blank to generate one from
              the name.
            </p>
          </div>
        </div>
      </CompanyCard>

      <CompanyCard title="Customers" className="mt-6">
        <div className="px-4 py-4">
          <p className="text-sm text-slate-400">
            Assigning customers to a location isn&apos;t wired up yet.
          </p>
        </div>
      </CompanyCard>

      <CompanyCard title="Payment terms" className="mt-6">
        <div className="px-4 py-4">
          <Form2.Item methods={methods} name="paymentTermsTemplateId">
            <Form2.Select
              id="paymentTermsTemplateId"
              options={paymentTermsItems}
            />
            <Form2.Error />
          </Form2.Item>
        </div>
      </CompanyCard>

      <CompanyCard title="Checkout" className="mt-6">
        <div className="flex flex-col gap-5 px-4 py-4">
          <Form2.Item methods={methods} name="editableShippingAddress">
            <Form2.Checkbox
              heading="Ship to address"
              label="Allow customers to ship to any one-time address"
            />
            <Form2.Error />
          </Form2.Item>

          <Form2.Item methods={methods} name="orderSubmission">
            <Form2.RadioGroup
              label="Order submission"
              options={ORDER_SUBMISSION_OPTIONS}
            />
            <Form2.Error />
          </Form2.Item>
        </div>
      </CompanyCard>

      <CompanyCard title="Tax details" className="mt-6">
        <div className="flex flex-col gap-4 px-4 py-4">
          <Form2.Item methods={methods} name="taxRegistrationId">
            <Form2.Label label="Tax ID" colon={false} />
            <Form2.Input id="taxRegistrationId" />
            <Form2.Error />
          </Form2.Item>

          <Form2.Item methods={methods} name="taxSetting">
            <Form2.Label label="Tax settings" colon={false} />
            <Form2.Select id="taxSetting" options={TAX_SETTING_OPTIONS} />
            <Form2.Error />
          </Form2.Item>
        </div>
      </CompanyCard>

      <div className="mt-6 flex items-center justify-end gap-3">
        <span className="text-xs text-slate-500">Adding to {companyName}</span>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Form2>
  );
}
