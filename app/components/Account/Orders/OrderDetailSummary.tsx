import {Money} from '@shopify/hydrogen';
import {shipmentStatusLabel} from '~/lib/orders';

function SummaryRow({label, value}: {label: string; value: React.ReactNode}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export function OrderDetailSummary({order}: {order: any}) {
  const shipmentStatus = order.fulfillments?.nodes?.[0]?.latestShipmentStatus;
  const delivery = shipmentStatusLabel(shipmentStatus);
  const address: string[] = order.shippingAddress?.formatted ?? [];

  return (
    <aside className="flex flex-col gap-6">
      <section className="rounded border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
          Summary
        </h2>
        <dl className="divide-y divide-slate-100">
          {order.subtotal && (
            <SummaryRow
              label="Subtotal"
              value={<Money data={order.subtotal} />}
            />
          )}
          {order.totalShipping && (
            <SummaryRow
              label="Shipping"
              value={<Money data={order.totalShipping} />}
            />
          )}
          {order.totalTax && (
            <SummaryRow label="Tax" value={<Money data={order.totalTax} />} />
          )}
          <div className="flex items-center justify-between pt-3 text-base">
            <dt className="font-bold text-slate-900">Total</dt>
            <dd className="font-extrabold text-slate-900">
              <Money data={order.totalPrice} />
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
          Delivery
        </h2>
        <p className="text-sm text-slate-700">
          {order.shippingLine?.title ?? 'Standard'}
        </p>
        {delivery && (
          <p className="text-xs font-medium text-slate-500">{delivery}</p>
        )}
        {address.length > 0 && (
          <address className="mt-3 not-italic text-sm text-slate-700">
            {address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        )}
      </section>

      {order.statusPageUrl && (
        <a
          href={order.statusPageUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Track or reorder on Shopify →
        </a>
      )}
    </aside>
  );
}
