import {CatalogHeader} from './CatalogHeader';
import {CatalogTable, type CatalogTableProduct} from './CatalogTable';

export function CatalogResults({
  title,
  description,
  products,
}: {
  title: string;
  description?: string | null;
  products: CatalogTableProduct[];
}) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <CatalogHeader title={title} description={description} />
      <CatalogTable products={products} />
    </div>
  );
}
