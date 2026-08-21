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
 * only `{taxExempt, taxExemptions, taxRegistrationId}` — no enum, no
 * server-side record, unlike payment terms. So this list is local, and it has
 * to fit what can actually be stored.
 *
 * The admin's middle option, "Collect tax unless exemptions apply", is
 * deliberately **not** here. It's `taxExempt: false` plus a non-empty
 * `taxExemptions` array; with nothing collecting exemptions it stores
 * identically to "Collect tax" — so choosing it saved fine and then read back
 * as "Collect tax", looking for all the world like a selection that didn't
 * stick. Two options that round-trip truthfully beat three where one lies.
 *
 * Add it back together with an exemptions picker (the `TaxExemption` enum), not
 * before.
 */
export const TAX_SETTING_OPTIONS = [
  {value: 'COLLECT', label: 'Collect tax'},
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
  taxSetting: z.enum(['COLLECT', 'NO_COLLECT']),
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
