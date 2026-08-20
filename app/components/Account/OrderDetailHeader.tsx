import {Link} from 'react-router';
import {
  financialStatusLabel,
  financialStatusTone,
  formatOrderDate,
  fulfillmentDisplay,
} from '~/lib/orders';
import {OrderStatusBadge} from './OrderStatusBadge';

export function OrderDetailHeader({order}: {order: any}) {
  const purchasingCompany =
    order.purchasingEntity?.__typename === 'PurchasingCompany'
      ? order.purchasingEntity
      : null;

  const customerName = [order.customer?.firstName, order.customer?.lastName]
    .filter(Boolean)
    .join(' ');

  const payment = financialStatusLabel(order.financialStatus);
  const fulfillment = fulfillmentDisplay(order);

  return (
    <header>
      <Link
        to="/account/orders"
        prefetch="intent"
        className="text-sm font-medium text-teal hover:underline"
      >
        ← Back to orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">
          Order {order.name}
        </h1>
        {payment && (
          <OrderStatusBadge
            label={payment}
            tone={financialStatusTone(order.financialStatus)}
          />
        )}
        {fulfillment && (
          <OrderStatusBadge label={fulfillment.label} tone={fulfillment.tone} />
        )}
      </div>

      <p className="mt-1 text-sm text-slate-500">
        Placed {formatOrderDate(order.processedAt)}
        {customerName ? ` by ${customerName}` : ''}
        {purchasingCompany?.location?.name
          ? ` · ${purchasingCompany.location.name}`
          : ''}
        {purchasingCompany?.company?.name
          ? ` · ${purchasingCompany.company.name}`
          : ''}
      </p>
    </header>
  );
}
