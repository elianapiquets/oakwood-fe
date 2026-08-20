import {OrderRow} from './OrderRow';

/**
 * CUSTOMER and LOCATION only appear for company-scoped lists: with a personal
 * customer's own orders every row would repeat the same name and carry no
 * location at all.
 */
export function OrdersTable({
  orders,
  showCompanyColumns,
}: {
  orders: any[];
  showCompanyColumns: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded border border-slate-200 bg-white">
      <table className="w-full min-w-[900px] text-left">
        <thead>
          <tr className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th scope="col" className="px-4 py-3">
              Order
            </th>
            <th scope="col" className="px-4 py-3">
              Date
            </th>
            {showCompanyColumns && (
              <th scope="col" className="px-4 py-3">
                Customer
              </th>
            )}
            {showCompanyColumns && (
              <th scope="col" className="px-4 py-3">
                Location
              </th>
            )}
            <th scope="col" className="px-4 py-3">
              Total
            </th>
            <th scope="col" className="px-4 py-3">
              Payment
            </th>
            <th scope="col" className="px-4 py-3">
              Fulfillment
            </th>
            <th scope="col" className="px-4 py-3">
              Items
            </th>
            <th scope="col" className="px-4 py-3">
              Delivery
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              showCompanyColumns={showCompanyColumns}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
