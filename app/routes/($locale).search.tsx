import {useLoaderData} from 'react-router';
import type {Route} from './+types/search';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import {SearchForm} from '~/components/SearchForm';
import {SearchResults} from '~/components/SearchResults';
import {searchBackend, type SearchResult} from '~/lib/search';
import {getRootSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo);
};

export async function loader({
  request,
  context,
}: Route.LoaderArgs): Promise<SearchResult & {seo: SeoConfig}> {
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '').trim();
  const isPredictive = url.searchParams.has('predictive');
  const limit = isPredictive ? 8 : 20;

  const products = await searchBackend(term, limit);
  const {pathPrefix} = context.storefront.i18n;

  const seo: SeoConfig = {
    title: 'Search',
    url: `${pathPrefix}/search`,
  };

  return {
    type: isPredictive ? 'predictive' : 'regular',
    term,
    products,
    seo,
  };
}

export default function SearchPage() {
  const {term, products} = useLoaderData<typeof loader>();

  return (
    <div className="search">
      <h1>Search</h1>
      <SearchForm>
        {({inputRef}) => (
          <>
            <input
              defaultValue={term}
              name="q"
              placeholder="Search by name, CAS number, or keyword…"
              ref={inputRef}
              type="search"
            />
            &nbsp;
            <button type="submit">Search</button>
          </>
        )}
      </SearchForm>
      {!term ? (
        <SearchResults.Empty />
      ) : (
        <SearchResults products={products} term={term} />
      )}
    </div>
  );
}
