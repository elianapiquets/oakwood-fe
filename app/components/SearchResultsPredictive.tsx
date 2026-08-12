import {Link, useFetcher} from 'react-router';
import {useRef, useEffect} from 'react';
import {useAside} from './Aside';
import type {SearchResult} from '~/lib/search';

type UsePredictiveSearchReturn = {
  term: React.MutableRefObject<string>;
  products: SearchResult['products'];
  state: ReturnType<typeof useFetcher>['state'];
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
};

function usePredictiveSearch(): UsePredictiveSearchReturn {
  const fetcher = useFetcher<SearchResult>({key: 'search'});
  const term = useRef<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (fetcher?.state === 'loading') {
    term.current = String(fetcher.formData?.get('q') || '');
  }

  useEffect(() => {
    if (!inputRef.current) {
      inputRef.current = document.querySelector('input[type="search"]');
    }
  }, []);

  return {
    products: fetcher?.data?.products ?? [],
    state: fetcher.state,
    inputRef,
    term,
  };
}

type SearchResultsPredictiveProps = {
  children: (args: {
    products: SearchResult['products'];
    term: React.MutableRefObject<string>;
    state: ReturnType<typeof useFetcher>['state'];
    inputRef: React.MutableRefObject<HTMLInputElement | null>;
    closeSearch: () => void;
    total: number;
  }) => React.ReactNode;
};

export function SearchResultsPredictive({
  children,
}: SearchResultsPredictiveProps) {
  const aside = useAside();
  const {products, state, inputRef, term} = usePredictiveSearch();

  function closeSearch() {
    if (inputRef.current) {
      inputRef.current.blur();
      inputRef.current.value = '';
    }
    aside.close();
  }

  return children({products, closeSearch, inputRef, state, term, total: products.length});
}

SearchResultsPredictive.Products = function PredictiveProducts({
  products,
  term,
  closeSearch,
}: {
  products: SearchResult['products'];
  term: React.MutableRefObject<string>;
  closeSearch: () => void;
}) {
  if (!products.length) return null;

  return (
    <div className="predictive-search-result">
      <h5>Products</h5>
      <ul>
        {products.map((product) => (
          <li key={product.id} className="predictive-search-result-item">
            <Link to={`/products/${product.handle}`} onClick={closeSearch}>
              <div>
                <p>{product.title}</p>
                {product.variants[0]?.sku && (
                  <small>SKU: {product.variants[0].sku}</small>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

SearchResultsPredictive.Empty = function PredictiveEmpty({
  term,
}: {
  term: React.MutableRefObject<string>;
}) {
  if (!term.current) return null;
  return <p>No results found for <q>{term.current}</q></p>;
};
