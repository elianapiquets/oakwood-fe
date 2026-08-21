import type {OrderStatusTone} from '~/lib/orders';

const TONE_CLASSES: Record<OrderStatusTone, string> = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-600 before:bg-slate-400',
  green:
    'border-emerald-200 bg-emerald-50 text-emerald-700 before:bg-emerald-500',
  amber: 'border-amber-200 bg-amber-50 text-amber-700 before:bg-amber-500',
  blue: 'border-blue-200 bg-blue-50 text-blue-700 before:bg-blue-500',
  red: 'border-red-200 bg-red-50 text-red-700 before:bg-red-500',
};

/**
 * The pill used for payment and fulfillment status: a dot plus a label, in a
 * tone chosen by the caller so status-to-color stays with the status maps
 * rather than being re-derived here.
 */
export function OrderStatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: OrderStatusTone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium before:h-1.5 before:w-1.5 before:rounded-full before:content-[''] ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}
