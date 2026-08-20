import {Image, Money} from '@shopify/hydrogen';

export function OrderDetailLineItems({lineItems}: {lineItems: any[]}) {
  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th scope="col" className="px-4 py-3">
              Item
            </th>
            <th scope="col" className="px-4 py-3">
              SKU
            </th>
            <th scope="col" className="px-4 py-3">
              Qty
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lineItems.map((item) => (
            <tr key={item.id} className="align-top">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  {item.image?.url && (
                    <Image
                      data={item.image}
                      alt={item.image.altText ?? item.name}
                      aspectRatio="1/1"
                      sizes="48px"
                      className="h-12 w-12 flex-shrink-0 rounded border border-slate-200 object-cover"
                    />
                  )}
                  <span className="text-sm font-semibold text-slate-900">
                    {item.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 font-mono text-xs text-slate-500">
                {item.sku ?? '—'}
              </td>
              <td className="px-4 py-4 text-sm text-slate-700">
                {item.quantity}
              </td>
              <td className="px-4 py-4 text-right text-sm font-bold text-slate-900">
                {item.totalPrice ? <Money data={item.totalPrice} /> : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
