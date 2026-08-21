import * as z from 'zod';

/**
 * One address, shaped to Shopify's `CompanyAddressInput`.
 *
 * The five required fields are what the API needs to accept an address at all —
 * `companyLocationCreate` rejects a location whose `shippingAddress` it can't
 * resolve. Everything else is genuinely optional.
 *
 * Note "Company/attention" is `recipient`: `CompanyAddressInput` has no
 * `company` field. Its full field list, from introspection at 2025-07, is
 * address1, address2, city, zip, recipient, firstName, lastName, phone,
 * zoneCode, countryCode.
 */
export const addressSchema = z.object({
  countryCode: z.string().min(1, 'Country is required'),
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  recipient: z.string().trim(),
  address1: z.string().trim().min(1, 'Address is required'),
  address2: z.string().trim(),
  city: z.string().trim().min(1, 'City is required'),
  zoneCode: z.string().min(1, 'State is required'),
  zip: z.string().trim().min(1, 'ZIP code is required'),
  phone: z.string().trim(),
});

export type AddressValues = z.infer<typeof addressSchema>;

export const ADDRESS_DEFAULTS: AddressValues = {
  countryCode: 'US',
  firstName: '',
  lastName: '',
  recipient: '',
  address1: '',
  address2: '',
  city: '',
  zoneCode: '',
  zip: '',
  phone: '',
};

/**
 * Display lines for a saved address, in the order a postal address reads.
 * Used for the summary rows that stand in for the dialog once it's filled.
 */
export function formatAddressLines(address: AddressValues): string[] {
  const name = [address.firstName, address.lastName].filter(Boolean).join(' ');
  const cityLine = [
    address.city,
    [address.zoneCode, address.zip].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');

  return [
    name,
    address.recipient,
    address.address1,
    address.address2,
    cityLine,
    address.countryCode,
    address.phone,
  ].filter((line): line is string => Boolean(line));
}

/**
 * An address with only the fields the customer actually filled in.
 *
 * Blank fields are dropped rather than sent as empty strings, because Shopify
 * doesn't treat those as "not provided": it parses `phone`, so `phone: ''` comes
 * back as an invalid number even though the admin happily leaves it empty. The
 * admin omits blank fields, and so do we.
 */
export function toAddressInput(address: AddressValues): Partial<AddressValues> {
  return Object.fromEntries(
    Object.entries(address).filter(
      ([, value]) => typeof value === 'string' && value.trim() !== '',
    ),
  );
}
