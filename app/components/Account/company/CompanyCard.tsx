import type {ReactNode} from 'react';

/** Card shell used across the company and location pages. */
export function CompanyCard({
  title,
  count,
  action,
  children,
  className = '',
}: {
  title: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-lg border border-slate-200 bg-white ${className}`}
    >
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h2 className="text-sm font-bold text-navy">
          {title}
          {typeof count === 'number' ? (
            <span className="ml-1 font-normal text-slate-500">({count})</span>
          ) : null}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

/**
 * An action the design calls for that the Customer Account API can't perform —
 * changing roles, adding contacts or locations, editing company details are all
 * Admin API operations. Rendered disabled rather than omitted, so the page
 * still matches the design and the gap is visible instead of silent.
 */
export function AdminOnlyAction({
  label,
  variant = 'primary',
}: {
  label: string;
  variant?: 'primary' | 'secondary' | 'link';
}) {
  const title = 'Needs a backend endpoint — this is an Admin API operation';

  if (variant === 'link') {
    return (
      <button
        type="button"
        disabled
        title={title}
        className="text-sm text-slate-400 underline cursor-not-allowed"
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled
      title={title}
      className={
        variant === 'primary'
          ? 'rounded bg-navy px-3 py-1.5 text-sm font-semibold text-white opacity-50 cursor-not-allowed'
          : 'rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-500 opacity-70 cursor-not-allowed'
      }
    >
      {label}
    </button>
  );
}

/** Square avatar with initials, as used for the company badge. */
export function InitialsBadge({
  value,
  shape = 'square',
}: {
  value: string;
  shape?: 'square' | 'circle';
}) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center text-sm font-bold text-white ${
        shape === 'circle' ? 'rounded-full bg-navy' : 'rounded bg-teal'
      }`}
    >
      {initials || '—'}
    </span>
  );
}

/** Small uppercase label used above values in the detail cards. */
export function FieldLabel({children}: {children: ReactNode}) {
  return (
    <dt className="font-mono text-[0.65rem] uppercase tracking-wider text-slate-400">
      {children}
    </dt>
  );
}

/** Breadcrumb path shown above each page title. */
export function CompanyBreadcrumb({path}: {path: string}) {
  return (
    <p className="font-mono text-[0.7rem] uppercase tracking-wider text-slate-400">
      {path}
    </p>
  );
}
