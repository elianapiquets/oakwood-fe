import * as z from 'zod';

/**
 * Sentinel for "No payment terms". A real value rather than an empty string,
 * because Base UI's Select treats '' as a value that matches no item and falls
 * back to the placeholder — here the no-terms choice is a legitimate, and
 * default, selection. The action drops `paymentTermsTemplateId` when it sees it.
 */
export const NO_PAYMENT_TERMS = 'NONE';

/**
 * Shopify's admin offers three tax choices, but `CompanyLocationTaxSettings` is
 * only `{taxExempt, taxExemptions, taxRegistrationId}` — there is no enum or
 * server-side record behind them, unlike payment terms. So this list is local.
 *
 * `COLLECT_UNLESS_EXEMPT` needs a `taxExemptions: [TaxExemption!]` list to mean
 * anything, and this form doesn't collect one yet, so it currently behaves the
 * same as `COLLECT`. It's offered because the admin offers it.
 */
export const TAX_SETTING_OPTIONS = [
  {value: 'COLLECT', label: 'Collect tax'},
  {value: 'COLLECT_UNLESS_EXEMPT', label: 'Collect tax unless exemptions apply'},
  {value: 'NO_COLLECT', label: "Don't collect tax"},
] as const;

/** Maps onto `buyerExperienceConfiguration.checkoutToDraft`. */
export const ORDER_SUBMISSION_OPTIONS = [
  {
    value: 'AUTOMATIC',
    label: 'Automatically submit orders',
    hint: 'Orders without shipping addresses will be submitted as draft orders',
  },
  {
    value: 'DRAFT',
    label: 'Submit all orders as drafts for review',
    hint: null,
  },
] as const;

export const createLocationSchema = z.object({
  name: z.string().trim().min(1, 'Location name is required'),
  /** Blank is allowed: the action falls back to a slug of the name. */
  externalId: z.string().trim(),
  paymentTermsTemplateId: z.string(),
  editableShippingAddress: z.boolean(),
  orderSubmission: z.enum(['AUTOMATIC', 'DRAFT']),
  taxRegistrationId: z.string().trim(),
  taxSetting: z.enum(['COLLECT', 'COLLECT_UNLESS_EXEMPT', 'NO_COLLECT']),
});

export type CreateLocationValues = z.infer<typeof createLocationSchema>;

export const CREATE_LOCATION_DEFAULTS: CreateLocationValues = {
  name: '',
  externalId: '',
  paymentTermsTemplateId: NO_PAYMENT_TERMS,
  editableShippingAddress: false,
  orderSubmission: 'AUTOMATIC',
  taxRegistrationId: '',
  taxSetting: 'COLLECT',
};

/**
 * TEMPORARY. `companyLocationCreate` rejects a location with no shipping
 * address — `userErrors: [{field: ['input','shippingAddress'], message:
 * 'Invalid input.'}]` — even though `CompanyLocationInput` marks the field
 * optional and no field inside `CompanyAddressInput` is non-null.
 *
 * Sent so the rest of the pipeline (payment terms, checkout config, tax) can be
 * verified end to end. **Delete this the moment the real address fields land** —
 * until then every location created through this form claims the same address.
 */
export const TEMP_SHIPPING_ADDRESS = {
  address1: '1741 Old Dillon Rd',
  city: 'Estill',
  zoneCode: 'SC',
  zip: '29918',
  countryCode: 'US',
} as const;
