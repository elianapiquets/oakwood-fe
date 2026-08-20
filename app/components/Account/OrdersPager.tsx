import {Link} from 'react-router';

const BASE_CLASSES =
  'inline-flex h-9 w-9 items-center justify-center rounded border text-sm';
const ENABLED_CLASSES = 'border-slate-300 text-slate-700 hover:bg-slate-50';
const DISABLED_CLASSES = 'border-slate-200 text-slate-300 cursor-not-allowed';

function PagerControl({
  to,
  enabled,
  label,
  glyph,
}: {
  to: string;
  enabled: boolean;
  label: string;
  glyph: string;
}) {
  if (!enabled) {
    return (
      <span
        aria-disabled="true"
        aria-label={label}
        className={`${BASE_CLASSES} ${DISABLED_CLASSES}`}
      >
        <span aria-hidden="true">{glyph}</span>
      </span>
    );
  }

  return (
    // No `state` prop on purpose: passing Hydrogen's pagination state is what
    // makes pages accumulate. Without it each click replaces the page.
    <Link
      to={to}
      aria-label={label}
      className={`${BASE_CLASSES} ${ENABLED_CLASSES}`}
    >
      <span aria-hidden="true">{glyph}</span>
    </Link>
  );
}

export function OrdersPager({
  previousPageUrl,
  nextPageUrl,
  hasPreviousPage,
  hasNextPage,
}: {
  previousPageUrl: string;
  nextPageUrl: string;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}) {
  // Nothing to page through — don't show dead controls.
  if (!hasPreviousPage && !hasNextPage) return null;

  return (
    <nav
      aria-label="Orders pagination"
      className="flex items-center justify-end gap-2"
    >
      <PagerControl
        to={previousPageUrl}
        enabled={hasPreviousPage}
        label="Previous page"
        glyph="←"
      />
      <PagerControl
        to={nextPageUrl}
        enabled={hasNextPage}
        label="Next page"
        glyph="→"
      />
    </nav>
  );
}
