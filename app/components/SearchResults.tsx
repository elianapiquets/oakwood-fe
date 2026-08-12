import {ProductsTable} from '~/components/ProductsTable';
import type {BackendProduct} from '~/lib/backend';
import type {ProductListItem} from '~/components/ProductListRow';

function backendToListItem(p: BackendProduct): ProductListItem {
  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    variants: {nodes: p.variants},
    chemistry: p.chemistry,
  };
}

export function SearchResults({
  products,
  term,
}: {
  products: BackendProduct[];
  term: string;
}) {
  if (!products.length) {
    return (
      <p>
        No results found for <q>{term}</q>
      </p>
    );
  }

  return <ProductsTable nodes={products.map(backendToListItem)} />;
}

SearchResults.Empty = function SearchResultsEmpty() {
  return <p>Enter a term to search.</p>;
};
