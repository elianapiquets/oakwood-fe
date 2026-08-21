export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3100';

export const BACKEND_HEADERS: HeadersInit = {
  'x-api-key': process.env.BACKEND_API_KEY ?? '',
};

export type BackendPage = {
  id: string;
  title: string;
  handle: string;
  body: string;
  seo: {
    title: string | null;
    description: string | null;
  };
};

export async function fetchPage(handle: string): Promise<BackendPage | null> {
  return fetch(`${BACKEND_URL}/api/pages/${handle}`, {headers: BACKEND_HEADERS})
    .then((r) => (r.ok ? (r.json() as Promise<BackendPage>) : null))
    .catch(() => null);
}

export type BackendCollection = {
  id: string;
  title: string;
  handle: string;
  image: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
};

export type BackendChemistry = {
  casNumber: string | null;
  molecularFormula: string | null;
  molecularWeight: string | null;
  purity: string | null;
  boilingPoint: string | null;
  meltingPoint: string | null;
  flashPoint: string | null;
  appearance: string | null;
  storageConditions: string | null;
  hazmat: {
    unNumber: string;
    hazardClass: string;
    packingGroup: string;
    properShippingName: string;
  } | null;
};

export type BackendProduct = {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  description: string;
  descriptionHtml: string;
  seo: {
    title: string | null;
    description: string | null;
  };
  featuredImage: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
  options: Array<{name: string; values: string[]}>;
  variants: Array<{
    id: string;
    sku: string;
    title: string;
    price: string;
    availableForSale: boolean;
    selectedOptions: Array<{name: string; value: string}>;
  }>;
  chemistry: BackendChemistry;
};

export async function fetchProductByHandle(
  handle: string,
): Promise<BackendProduct | null> {
  return fetch(`${BACKEND_URL}/api/products/by-handle/${handle}`, {
    headers: BACKEND_HEADERS,
  })
    .then((r) => (r.ok ? (r.json() as Promise<BackendProduct>) : null))
    .catch(() => null);
}

export async function fetchCollections(): Promise<BackendCollection[]> {
  return fetch(`${BACKEND_URL}/api/collections`, {headers: BACKEND_HEADERS})
    .then((r) => (r.ok ? (r.json() as Promise<BackendCollection[]>) : []))
    .catch(() => []);
}

export type BackendCollectionDetail = BackendCollection & {
  description: string | null;
  products: BackendProduct[];
};

export async function fetchCollection(
  handle: string,
): Promise<BackendCollectionDetail | null> {
  return fetch(`${BACKEND_URL}/api/collections/${handle}`, {
    headers: BACKEND_HEADERS,
  })
    .then((r) => (r.ok ? (r.json() as Promise<BackendCollectionDetail>) : null))
    .catch(() => null);
}

export async function fetchProducts(limit?: number): Promise<BackendProduct[]> {
  const url = limit
    ? `${BACKEND_URL}/api/products?limit=${limit}`
    : `${BACKEND_URL}/api/products`;
  return fetch(url, {headers: BACKEND_HEADERS})
    .then((r) => (r.ok ? (r.json() as Promise<BackendProduct[]>) : []))
    .catch(() => []);
}

export async function fetchChemistryMap(
  handles: string[],
): Promise<Map<string, BackendChemistry>> {
  if (!handles.length) return new Map();
  const data: Array<{handle: string; chemistry: BackendChemistry}> =
    await fetch(`${BACKEND_URL}/api/products?handles=${handles.join(',')}`, {
      headers: BACKEND_HEADERS,
    })
      .then((r) =>
        r.ok
          ? (r.json() as Promise<
              Array<{handle: string; chemistry: BackendChemistry}>
            >)
          : [],
      )
      .catch(() => []);
  return new Map(data.map((p) => [p.handle, p.chemistry]));
}

/**
 * Billing details for a B2B company location, served by the custom backend
 * because neither Shopify API exposes them to a logged-in customer:
 *
 * - Payment terms: `CompanyLocation.buyerExperienceConfiguration
 *   .paymentTermsTemplate` exists in the **Admin** API ("the merchant
 *   configured payment terms") but not in the Customer Account API, whose
 *   `buyerExperienceConfiguration` carries only `deposit` and `payNowOnly`.
 * - Payment methods: absent from `CompanyLocation` in *both* APIs — confirmed
 *   by introspecting the store's live Admin schema, where the type has 29
 *   fields and none return stored payment methods. Shopify's own hosted account
 *   UI renders the section anyway, so it reads them through a private internal
 *   endpoint. The backend returns an empty array to keep this contract stable
 *   if a path ever turns up.
 *
 * Shaped for display (`label`/`detail`) so the backend owns the mapping from
 * whichever Admin type it ends up reading, and this app doesn't need to know
 * card-versus-bank specifics.
 */
export type BackendCompanyLocationBilling = {
  paymentTerms: {
    name: string;
    dueInDays: number | null;
    description: string | null;
    type: string | null;
  } | null;
  paymentMethods: Array<{
    id: string;
    label: string;
    detail: string | null;
  }>;
  /**
   * From the Admin API's `CompanyLocation.taxSettings`, which the Customer
   * Account API has no equivalent of.
   */
  tax: {taxId: string | null; taxExempt: boolean | null};
};

/** Returns null when the endpoint isn't implemented yet, so callers degrade. */
export async function fetchCompanyLocationBilling(
  locationId: string,
): Promise<BackendCompanyLocationBilling | null> {
  return fetch(
    `${BACKEND_URL}/api/company-locations/${encodeURIComponent(locationId)}/billing`,
    {headers: BACKEND_HEADERS},
  )
    .then((r) =>
      r.ok ? (r.json() as Promise<BackendCompanyLocationBilling>) : null,
    )
    .catch(() => null);
}

export type BackendPaymentTermsTemplate = {
  id: string;
  name: string;
  dueInDays: number | null;
  paymentTermsType: string | null;
};

/**
 * `companyLocationCreate` needs a real `PaymentTermsTemplate` gid, so the
 * dropdown options can't be hardcoded. Falls back to an empty list, which the
 * form renders as "No payment terms" only.
 */
export async function fetchPaymentTermsTemplates(): Promise<
  BackendPaymentTermsTemplate[]
> {
  return fetch(`${BACKEND_URL}/api/payment-terms-templates`, {
    headers: BACKEND_HEADERS,
  })
    .then((r) =>
      r.ok ? (r.json() as Promise<BackendPaymentTermsTemplate[]>) : [],
    )
    .catch(() => []);
}

export type CreateCompanyLocationAddress = {
  address1?: string;
  address2?: string;
  city?: string;
  zoneCode?: string;
  zip?: string;
  /** A `CountryCode` enum value, e.g. 'US'. */
  countryCode?: string;
  recipient?: string;
  phone?: string;
};

export type CreateCompanyLocationBody = {
  name: string;
  externalId?: string;
  /**
   * Company contact to grant `Location admin` at the new location. A location
   * with no contacts is invisible to the customer who created it — the account
   * pages authorize against the customer's own `companyContacts.locations`.
   */
  assignContactId?: string;
  /** Required in practice, despite being optional on `CompanyLocationInput`. */
  shippingAddress?: CreateCompanyLocationAddress;
  /** Ignored by Shopify when `billingSameAsShipping` is true. */
  billingAddress?: CreateCompanyLocationAddress;
  billingSameAsShipping?: boolean;
  taxRegistrationId?: string;
  taxExempt?: boolean;
  buyerExperienceConfiguration?: {
    paymentTermsTemplateId?: string;
    checkoutToDraft?: boolean;
    editableShippingAddress?: boolean;
  };
};

export type CreateCompanyLocationResult =
  | {ok: true; location: {id: string; name: string}}
  | {ok: false; error: string};

/**
 * Unlike the read helpers above, this never collapses a failure into a nullish
 * value: a creation that didn't happen has to be distinguishable from one that
 * did, or the form would redirect as though it had worked.
 *
 * `companyId` comes from the signed-in customer's session, never from a form —
 * the backend's shared api key can't tell customers apart, so the storefront
 * route is what confines a customer to their own company.
 */
export async function createCompanyLocation(
  companyId: string,
  body: CreateCompanyLocationBody,
): Promise<CreateCompanyLocationResult> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/companies/${encodeURIComponent(companyId)}/locations`,
      {
        method: 'POST',
        headers: {...BACKEND_HEADERS, 'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      },
    );

    const payload = (await response.json().catch(() => null)) as
      | {id?: string; name?: string; error?: string}
      | null;

    if (!response.ok || !payload?.id) {
      return {
        ok: false,
        error: payload?.error ?? `Backend responded ${response.status}`,
      };
    }

    return {ok: true, location: {id: payload.id, name: payload.name ?? ''}};
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : 'Could not reach the backend',
    };
  }
}

export type CompanyAddressType = 'BILLING' | 'SHIPPING';

/**
 * Sets a location's shipping and/or billing address.
 *
 * The only route to it: `CompanyLocationUpdateInput` carries no address fields,
 * so this is `companyLocationAssignAddress` behind the backend.
 *
 * Like `createCompanyLocation`, failures are returned rather than swallowed —
 * a rejected address (a zip that doesn't match its province, say) has to reach
 * the form.
 */
export async function assignCompanyLocationAddress(
  locationId: string,
  address: CreateCompanyLocationAddress,
  addressTypes: CompanyAddressType[],
): Promise<{ok: true} | {ok: false; error: string}> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/company-locations/${encodeURIComponent(locationId)}/address`,
      {
        method: 'POST',
        headers: {...BACKEND_HEADERS, 'Content-Type': 'application/json'},
        body: JSON.stringify({address, addressTypes}),
      },
    );

    const payload = (await response.json().catch(() => null)) as
      | {ok?: boolean; error?: string}
      | null;

    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        error: payload?.error ?? `Backend responded ${response.status}`,
      };
    }

    return {ok: true};
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : 'Could not reach the backend',
    };
  }
}

/**
 * Sets a location's tax registration id and tax-exempt flag.
 *
 * `companyLocationUpdate` has no tax fields, so this is
 * `companyLocationTaxSettingsUpdate` behind the backend. Failures are returned,
 * not swallowed.
 */
export async function updateCompanyLocationTax(
  locationId: string,
  settings: {taxRegistrationId?: string | null; taxExempt?: boolean},
): Promise<{ok: true} | {ok: false; error: string}> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/company-locations/${encodeURIComponent(locationId)}/tax`,
      {
        method: 'POST',
        headers: {...BACKEND_HEADERS, 'Content-Type': 'application/json'},
        body: JSON.stringify(settings),
      },
    );

    const payload = (await response.json().catch(() => null)) as
      | {ok?: boolean; error?: string}
      | null;

    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        error: payload?.error ?? `Backend responded ${response.status}`,
      };
    }

    return {ok: true};
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : 'Could not reach the backend',
    };
  }
}
