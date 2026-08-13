import {Link} from 'react-router';
import type {BackendChemistry} from '~/lib/backend';

export type ProductListItem = {
  id: string;
  title: string;
  handle: string;
  variants: {
    nodes: Array<{
      id: string;
      title: string;
      sku: string;
      availableForSale: boolean;
      price?: {amount: string; currencyCode: string};
    }>;
  };
  chemistry?: BackendChemistry | null;
};

export function ProductListRow({product}: {product: ProductListItem}) {
  const variants = product.variants.nodes;
  const firstSku = variants.find((v) => v.sku)?.sku ?? '';
  const purity = product.chemistry?.purity;
  const sizes = variants.filter((v) => v.title !== 'Default Title');

  return (
    <tr className="product-list-row">
      <td className="product-list-name-cell">
        <Link to={`/products/${product.handle}`} className="product-list-link">
          {product.title}
        </Link>
      </td>
      <td className="product-list-sku-cell">{firstSku}</td>
      <td className="product-list-purity-cell">
        {purity ? <span className="purity-badge">{purity}</span> : null}
      </td>
      <td className="product-list-sizes-cell">
        <div className="size-buttons">
          {sizes.length > 0 ? (
            sizes.map((variant) => (
              <button key={variant.id} className="size-btn" type="button">
                {variant.title}
              </button>
            ))
          ) : (
            <button className="size-btn size-btn-order" type="button">
              Order
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
