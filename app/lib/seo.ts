import type {SeoConfig} from '@shopify/hydrogen';

/**
 * Pulls the root route's `seo` (site-wide defaults) out of the `matches` array
 * passed to every route's `meta()` function, so it can be merged with the
 * current route's own `seo` via `getSeoMeta(getRootSeo(matches), data?.seo)`.
 */
export function getRootSeo(
  // Entries are optional because React Router types `matches` as a tuple whose
  // trailing members may be undefined.
  matches: ReadonlyArray<{id: string; data?: unknown} | undefined>,
): SeoConfig | undefined {
  const root = matches.find((match) => match?.id === 'root');
  return (root?.data as {seo?: SeoConfig} | undefined)?.seo;
}

export function truncate(
  text?: string | null,
  length = 160,
): string | undefined {
  if (!text) return undefined;
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}
