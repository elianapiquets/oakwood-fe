export const BACKEND_URL =
  process.env.BACKEND_URL ?? 'http://localhost:3100';

export type BackendPage = {
  id: string;
  title: string;
  handle: string;
  body: string;
};

export async function fetchPage(handle: string): Promise<BackendPage | null> {
  return fetch(`${BACKEND_URL}/api/pages/${handle}`)
    .then((r) => (r.ok ? r.json() : null))
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
  return fetch(`${BACKEND_URL}/api/products/by-handle/${handle}`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
}

export async function fetchCollections(): Promise<BackendCollection[]> {
  return fetch(`${BACKEND_URL}/api/collections`)
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
}

export type BackendCollectionDetail = BackendCollection & {
  description: string | null;
  products: BackendProduct[];
};

export async function fetchCollection(
  handle: string,
): Promise<BackendCollectionDetail | null> {
  return fetch(`${BACKEND_URL}/api/collections/${handle}`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
}

export async function fetchProducts(limit?: number): Promise<BackendProduct[]> {
  const url = limit
    ? `${BACKEND_URL}/api/products?limit=${limit}`
    : `${BACKEND_URL}/api/products`;
  return fetch(url)
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
}

export async function fetchChemistryMap(
  handles: string[],
): Promise<Map<string, BackendChemistry>> {
  if (!handles.length) return new Map();
  const data: Array<{handle: string; chemistry: BackendChemistry}> = await fetch(
    `${BACKEND_URL}/api/products?handles=${handles.join(',')}`,
  )
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
  return new Map(data.map((p) => [p.handle, p.chemistry]));
}
