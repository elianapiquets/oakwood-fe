import {BACKEND_URL, BACKEND_HEADERS} from '~/lib/backend';
import type {BackendProduct} from '~/lib/backend';

export type SearchResult = {
  type: 'regular' | 'predictive';
  term: string;
  products: BackendProduct[];
  error?: string;
};

export async function searchBackend(
  q: string,
  limit = 10,
): Promise<BackendProduct[]> {
  if (!q.trim()) return [];
  return fetch(
    `${BACKEND_URL}/api/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    {headers: BACKEND_HEADERS},
  )
    .then((r) => (r.ok ? (r.json() as Promise<BackendProduct[]>) : []))
    .catch(() => []);
}
