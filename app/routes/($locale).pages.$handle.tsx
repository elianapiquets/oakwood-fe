import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/pages.$handle';

export const meta: Route.MetaFunction = ({data}) => {
  const description = data?.page.seo?.description ?? null;
  return [
    {title: data?.page.seo?.title ?? `Oakwood Chemical | ${data?.page.title ?? ''}`},
    {rel: 'canonical', href: `/pages/${data?.page.handle}`},
    ...(description ? [{name: 'description', content: description}] : []),
  ];
};

export async function loader({context, params}: Route.LoaderArgs) {
  const {storefront} = context;
  const {handle} = params;

  if (!handle) throw new Error('Expected page handle to be defined');

  const {page} = await storefront.query(PAGE_QUERY, {
    variables: {handle},
  });

  if (!page) {
    const redirectData = await storefront
      .query(URL_REDIRECTS_QUERY, {
        variables: {query: `path:/pages/${handle}`},
        cache: storefront.CacheShort(),
      })
      .catch(() => null);
    const target = (redirectData as any)?.urlRedirects?.nodes?.[0]?.target as
      | string
      | undefined;
    if (target) {
      const path = target.startsWith('http') ? new URL(target).pathname : target;
      throw redirect(path, 301);
    }
    throw new Response('Not Found', {status: 404});
  }

  return {page};
}

export default function Page() {
  const {page} = useLoaderData<typeof loader>();

  switch (page.handle) {
    // Add cases here as you create page-specific layouts, e.g.:
    // case 'contact': return <ContactPage page={page} />;
    // case 'about': return <AboutPage page={page} />;
    default:
      return (
        <div className="page">
          <header>
            <h1>{page.title}</h1>
          </header>
          <main dangerouslySetInnerHTML={{__html: page.body}} />
        </div>
      );
  }
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode
    $country: CountryCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    page(handle: $handle) {
      id
      title
      handle
      body
      seo {
        description
        title
      }
    }
  }
` as const;

const URL_REDIRECTS_QUERY = `#graphql
  query UrlRedirects($query: String!) {
    urlRedirects(first: 1, query: $query) {
      nodes {
        path
        target
      }
    }
  }
` as const;
