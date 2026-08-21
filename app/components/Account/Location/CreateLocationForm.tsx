import {useState} from 'react';
import {useSubmit, useNavigation} from 'react-router';
import {useForm} from 'react-hook-form';
import type {SubmitHandler} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';

import {Checkbox, Form} from '~/components/ui';
import {CompanyCard} from '~/components/Account/company/CompanyCard';
import {LOCATION_ADMIN_ROLE} from '~/lib/b2bRoles';
import {
  AddressDialog,
  formatAddressLines,
  type AddressValues,
} from '~/components/Address';
import {
  CREATE_LOCATION_DEFAULTS,
  NO_PAYMENT_TERMS,
  ORDER_SUBMISSION_OPTIONS,
  TAX_SETTING_OPTIONS,
  createLocationSchema,
  type CreateLocationValues,
  type PaymentTermsOption,
} from './constants';

/**
 * A saved address, or a button to add one. A location has exactly one shipping
 * and one billing address, so saving replaces rather than appends.
 */
function AddressSummary({
  address,
  emptyLabel,
  onEdit,
}: {
  address: AddressValues | null;
  emptyLabel: string;
  onEdit: () => void;
}) {
  if (!address) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full items-center gap-2 rounded border border-dashed border-slate-300 px-3 py-3 text-left text-sm text-slate-600 hover:bg-slate-50"
      >
        + {emptyLabel}
      </button>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded border border-slate-200 px-3 py-3">
      <div className="text-sm text-slate-700">
        {formatAddressLines(address).map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-sm text-navy underline"
      >
        Edit
      </button>
    </div>
  );
}

/**
 * Company location create form, modelled on Shopify admin's "New location".
 *
 * `Form` is only the `<form>` element; each `Form.Item` binds one field, so
 * the fields can sit at any depth — inside these cards, in this case — while
 * still sharing a single `useForm` instance.
 *
 * Hints live *outside* their `Form.Item`. An Item forwards the injected field
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
  contactEmail,
  paymentTermsOptions,
  serverError,
}: {
  companyName: string;
  /** The signed-in customer, who is assigned to the new location. */
  contactEmail?: string | null;
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

  // The addresses live outside the location's `useForm`. `FormController`
  // resolves errors with a flat `formState.errors[name]` lookup, so a nested
  // path like `shippingAddress.address1` would never find its message — the
  // dialog validates them with its own form instead.
  const [shippingAddress, setShippingAddress] = useState<AddressValues | null>(
    null,
  );
  const [billingAddress, setBillingAddress] = useState<AddressValues | null>(
    null,
  );
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [openDialog, setOpenDialog] = useState<'shipping' | 'billing' | null>(
    null,
  );
  const [addressError, setAddressError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<CreateLocationValues> = (values) => {
    // Shopify rejects a location with no shipping address, so say so here
    // rather than spend a round trip finding out.
    if (!shippingAddress) {
      setAddressError('A shipping address is required.');
      return;
    }

    if (!billingSameAsShipping && !billingAddress) {
      setAddressError(
        'Add a billing address, or tick "Billing address is same as shipping address".',
      );
      return;
    }

    setAddressError(null);

    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      formData.append(key, String(value));
    }

    // One JSON blob per address, rather than ten flat keys each.
    formData.append('shippingAddress', JSON.stringify(shippingAddress));
    formData.append('billingSameAsShipping', String(billingSameAsShipping));
    if (!billingSameAsShipping && billingAddress) {
      formData.append('billingAddress', JSON.stringify(billingAddress));
    }

    void submit(formData, {method: 'post'});
  };

  return (
    <Form
      methods={methods}
      onSubmit={(event) => void methods.handleSubmit(onSubmit)(event)}
    >
      <CompanyCard title="Shipping address">
        <div className="flex flex-col gap-3 px-4 py-4">
          <AddressSummary
            address={shippingAddress}
            emptyLabel="Add address"
            onEdit={() => setOpenDialog('shipping')}
          />

          <label
            htmlFor="billingSameAsShipping"
            className="flex items-center gap-2 text-sm text-slate-700"
          >
            <Checkbox
              id="billingSameAsShipping"
              checked={billingSameAsShipping}
              onCheckedChange={(checked) => {
                setBillingSameAsShipping(checked);
                setAddressError(null);
              }}
            />
            Billing address is same as shipping address
          </label>

          {billingSameAsShipping ? null : (
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
              <span className="text-sm font-medium text-slate-900">
                Billing address
              </span>
              <AddressSummary
                address={billingAddress}
                emptyLabel="Add billing address"
                onEdit={() => setOpenDialog('billing')}
              />
            </div>
          )}

          {addressError ? (
            <p role="alert" className="text-xs text-red-600">
              {addressError}
            </p>
          ) : null}
        </div>
      </CompanyCard>

      <AddressDialog
        open={openDialog === 'shipping'}
        onOpenChange={(next) => setOpenDialog(next ? 'shipping' : null)}
        title={
          shippingAddress ? 'Edit shipping address' : 'Add shipping address'
        }
        value={shippingAddress}
        onSave={(address) => {
          setShippingAddress(address);
          setAddressError(null);
        }}
      />

      <AddressDialog
        open={openDialog === 'billing'}
        onOpenChange={(next) => setOpenDialog(next ? 'billing' : null)}
        title={billingAddress ? 'Edit billing address' : 'Add billing address'}
        value={billingAddress}
        onSave={(address) => {
          setBillingAddress(address);
          setAddressError(null);
        }}
      />

      <CompanyCard title="Location details" className="mt-6">
        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Form.Item name="name">
              <Form.Label label="Location name" colon={false} required />
              <Form.Input id="name" placeholder="Midtown" />
              <Form.Error />
            </Form.Item>
            <p className="text-xs text-slate-500">
              Used by customers to identify which location an order is for.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Form.Item name="externalId">
              <Form.Label label="Location ID" colon={false} />
              <Form.Input id="externalId" />
              <Form.Error />
            </Form.Item>
            <p className="text-xs text-slate-500">
              Add an existing external ID, or leave blank to generate one from
              the name.
            </p>
          </div>
        </div>
      </CompanyCard>

      {/* Read-only. Shopify creates a location with no contacts, and a location
          with no contacts is invisible to the person who made it — so the
          creator is assigned automatically. Saying so here means the assignment
          isn't a surprise. Choosing other customers comes later. */}
      <CompanyCard title="Customers" className="mt-6">
        <div className="flex flex-col gap-2 px-4 py-4">
          <p className="text-sm text-slate-700">
            You&apos;ll be added to this location as{' '}
            <span className="font-semibold">{LOCATION_ADMIN_ROLE}</span>.
          </p>
          {contactEmail ? (
            <p className="text-sm text-slate-500">{contactEmail}</p>
          ) : null}
          <p className="text-xs text-slate-400">
            Other customers can be added to the location after it&apos;s
            created.
          </p>
        </div>
      </CompanyCard>

      <CompanyCard title="Payment terms" className="mt-6">
        <div className="px-4 py-4">
          <Form.Item name="paymentTermsTemplateId">
            <Form.Select
              id="paymentTermsTemplateId"
              options={paymentTermsItems}
            />
            <Form.Error />
          </Form.Item>
        </div>
      </CompanyCard>

      <CompanyCard title="Checkout" className="mt-6">
        <div className="flex flex-col gap-5 px-4 py-4">
          <Form.Item name="editableShippingAddress">
            <Form.Checkbox
              heading="Ship to address"
              label="Allow customers to ship to any one-time address"
            />
            <Form.Error />
          </Form.Item>

          <Form.Item name="orderSubmission">
            <Form.RadioGroup
              label="Order submission"
              options={ORDER_SUBMISSION_OPTIONS}
            />
            <Form.Error />
          </Form.Item>
        </div>
      </CompanyCard>

      <CompanyCard title="Tax details" className="mt-6">
        <div className="flex flex-col gap-4 px-4 py-4">
          <Form.Item name="taxRegistrationId">
            <Form.Label label="Tax ID" colon={false} />
            <Form.Input id="taxRegistrationId" />
            <Form.Error />
          </Form.Item>

          <Form.Item name="taxSetting">
            <Form.Label label="Tax settings" colon={false} />
            <Form.Select id="taxSetting" options={TAX_SETTING_OPTIONS} />
            <Form.Error />
          </Form.Item>
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
    </Form>
  );
}
