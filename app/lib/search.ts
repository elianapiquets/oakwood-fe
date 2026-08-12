import {BACKEND_URL} from '~/lib/backend';
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
  return fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(q)}&limit=${limit}`)
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
}
