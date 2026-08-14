import {CatalogHeader} from './CatalogHeader';
import {CatalogTable} from './CatalogTable';

export function CatalogResults() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <CatalogHeader />
      <CatalogTable />
    </div>
  );
}
