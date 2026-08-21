import {useFetchers} from 'react-router';

type CartActionData = {
  error?: string;
  removedLineCount?: number;
  warnings?: Array<{code?: string; message?: string} | null> | null;
};

/**
 * Reports what a cart mutation did beyond succeeding.
 *
 * Shopify warns that changing a cart's buyer identity "may result in an invalid
 * cart. Products not published for the current B2B customer will be removed from
 * cart" — silently. Without this the customer switches location, loses lines and
 * is told nothing, which is the drift this whole flow exists to prevent.
 *
 * Reads from in-flight/complete cart fetchers rather than props so it works from
 * both the cart page and the cart aside, wherever the switch was submitted.
 */
export function CartWarnings() {
  const fetchers = useFetchers();

  const cartData = fetchers
    .map((fetcher) => fetcher.data as CartActionData | undefined)
    .filter((value): value is CartActionData => Boolean(value));

  const removed = cartData.reduce(
    (total, value) => total + (value.removedLineCount ?? 0),
    0,
  );
  const errors = cartData
    .map((value) => value.error)
    .filter((message): message is string => Boolean(message));
  const warnings = cartData
    .flatMap((value) => value.warnings ?? [])
    .map((warning) => warning?.message)
    .filter((message): message is string => Boolean(message));

  if (!removed && !errors.length && !warnings.length) return null;

  return (
    <div
      role="status"
      className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
    >
      {removed > 0 ? (
        <p>
          {removed} {removed === 1 ? 'item was' : 'items were'} removed because
          the selected location can&apos;t order {removed === 1 ? 'it' : 'them'}
          .
        </p>
      ) : null}
      {errors.map((message) => (
        <p key={message}>{message}</p>
      ))}
      {warnings.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}
