/**
 * URL/ID-safe slug, used to fill a company location's `externalId` when the
 * customer leaves the Location ID field blank.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    // Strip combining marks so "Café" becomes "cafe" rather than "caf".
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
