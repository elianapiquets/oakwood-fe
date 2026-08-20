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
