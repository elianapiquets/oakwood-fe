import {ProductListRow, type ProductListItem} from '~/components/ProductListRow';

export function ProductsTable({nodes}: {nodes: ProductListItem[]}) {
  return (
    <div className="products-table-wrap">
      <table className="products-table">
        <thead>
          <tr className="products-table-header">
            <th className="col-product">Product</th>
            <th className="col-sku">SKU</th>
            <th className="col-purity">Purity</th>
            <th className="col-sizes">Sizes / Order</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((product) => (
            <ProductListRow key={product.id} product={product} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
