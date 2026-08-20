import {Link} from 'react-router';
import {Money} from '@shopify/hydrogen';
import {
  financialStatusLabel,
  financialStatusTone,
  formatOrderDate,
  fulfillmentDisplay,
  orderIdToParam,
  orderItemCountLabel,
  shipmentStatusLabel,
  shipmentStatusTone,
} from '~/lib/orders';
import {OrderStatusBadge} from './OrderStatusBadge';

const DELIVERY_TONE_TEXT = {
  neutral: 'text-slate-500',
  green: 'text-emerald-700',
  amber: 'text-amber-700',
  blue: 'text-blue-700',
  red: 'text-red-700',
} as const;

export function OrderRow({
  order,
  showCompanyColumns,
}: {
  order: any;
  showCompanyColumns: boolean;
}) {
  const purchasingCompany =
    order.purchasingEntity?.__typename === 'PurchasingCompany'
      ? order.purchasingEntity
      : null;

  const customerName =
    [order.customer?.firstName, order.customer?.lastName]
      .filter(Boolean)
      .join(' ') || '—';

  const payment = financialStatusLabel(order.financialStatus);
  const fulfillment = fulfillmentDisplay(order);
  const shipmentStatus = order.fulfillments?.nodes?.[0]?.latestShipmentStatus;
  const delivery = shipmentStatusLabel(shipmentStatus);

  return (
    <tr className="align-top">
      <td className="px-4 py-4">
        <Link
          to={`/account/orders/${orderIdToParam(order.id)}`}
          prefetch="intent"
          className="font-semibold text-blue-700 hover:underline"
        >
          {order.name}
        </Link>
      </td>

      <td className="px-4 py-4 text-sm text-slate-700">
        {formatOrderDate(order.processedAt)}
      </td>

      {showCompanyColumns && (
        <td className="px-4 py-4">
          <span className="block text-sm font-semibold text-blue-700">
            {customerName}
          </span>
          {purchasingCompany?.company?.name && (
            <span className="block text-xs text-slate-500">
              {purchasingCompany.company.name}
            </span>
          )}
        </td>
      )}

      {showCompanyColumns && (
        <td className="px-4 py-4 font-mono text-xs text-slate-500">
          {purchasingCompany?.location?.name ?? '—'}
        </td>
      )}

      <td className="px-4 py-4 text-sm font-bold text-slate-900">
        <Money data={order.totalPrice} />
      </td>

      <td className="px-4 py-4">
        {payment && (
          <OrderStatusBadge
            label={payment}
            tone={financialStatusTone(order.financialStatus)}
          />
        )}
      </td>

      <td className="px-4 py-4">
        {fulfillment && (
          <OrderStatusBadge label={fulfillment.label} tone={fulfillment.tone} />
        )}
      </td>

      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
        {orderItemCountLabel(order)}
      </td>

      <td className="px-4 py-4 text-sm text-slate-700">
        {order.shippingLine?.title ?? '—'}
        {delivery && (
          <span
            className={`block text-xs font-medium ${
              DELIVERY_TONE_TEXT[shipmentStatusTone(shipmentStatus)]
            }`}
          >
            {delivery}
          </span>
        )}
      </td>
    </tr>
  );
}
