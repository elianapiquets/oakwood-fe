import {Link} from 'react-router';

export interface CatalogTableProduct {
  id: string;
  title: string;
  handle: string;
  sku: string | null;
  purity: string | null;
  sizes: string[];
}

export function CatalogTable({
  products,
}: {
  products: CatalogTableProduct[];
}) {
  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Purity</th>
            <th className="px-4 py-3">Sizes / Order</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="px-4 py-4 align-top font-semibold text-blue-700">
                <Link to={`/products/${product.handle}`} className="hover:underline">
                  {product.title}
                </Link>
              </td>
              <td className="px-4 py-4 align-top font-mono text-sm text-slate-500">
                {product.sku}
              </td>
              <td className="px-4 py-4 align-top">
                {product.purity && (
                  <span className="inline-block rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-700">
                    {product.purity}
                  </span>
                )}
              </td>
              <td className="px-4 py-4 align-top">
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className="rounded border border-slate-300 px-2 py-1 font-mono text-xs text-slate-700"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
