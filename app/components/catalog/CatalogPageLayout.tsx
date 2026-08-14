import {CatalogSidebar, type CatalogSidebarCollection} from './CatalogSidebar';
import {CatalogResults} from './CatalogResults';
import type {CatalogTableProduct} from './CatalogTable';

export function CatalogPageLayout({
  collections,
  title,
  description,
  products,
}: {
  collections: CatalogSidebarCollection[];
  title: string;
  description?: string | null;
  products: CatalogTableProduct[];
}) {
  return (
    <div className="flex w-full gap-6 px-6 py-8">
      {/* Not a semantic <aside> on purpose: app.css has a global `aside {
      position: fixed; ...}` rule for the cart/search/menu drawers that would
      yank this off-screen. */}
      <div className="w-64 flex-shrink-0">
        <CatalogSidebar collections={collections} />
      </div>
      <CatalogResults title={title} description={description} products={products} />
    </div>
  );
}
