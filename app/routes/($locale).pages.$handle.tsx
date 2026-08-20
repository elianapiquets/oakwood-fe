import {useState} from 'react';
import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/pages.$handle';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';
import {getRootSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo);
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
      string | undefined;
    if (target) {
      const path = target.startsWith('http')
        ? new URL(target).pathname
        : target;
      throw redirect(path, 301);
    }
    throw new Response('Not Found', {status: 404});
  }

  const {pathPrefix} = storefront.i18n;
  const seo: SeoConfig = {
    title: page.seo?.title ?? page.title,
    ...(page.seo?.description ? {description: page.seo.description} : {}),
    url: `${pathPrefix}/pages/${page.handle}`,
  };

  return {page, seo};
}

export default function Page() {
  const {page} = useLoaderData<typeof loader>();

  switch (page.handle) {
    case 'faq':
      return <FaqPage page={page} />;
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

function parseQA(html: string) {
  const items: {question: string; answer: string}[] = [];
  const parts = html.split(/<h2[^>]*>/i).filter(Boolean);
  for (const part of parts) {
    const closeIdx = part.search(/<\/h2>/i);
    if (closeIdx === -1) continue;
    const question = part
      .slice(0, closeIdx)
      .replace(/<[^>]+>/g, '')
      .trim();
    const answer = part.slice(closeIdx + 5).trim();
    if (question) items.push({question, answer});
  }
  return items;
}

function FaqPage({page}: {page: {title: string; body: string}}) {
  const items = parseQA(page.body);
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-navy mb-8">{page.title}</h1>
      <div className="border-t border-gray-200">
        {items.map((item, i) => (
          <div key={item.question} className="border-b border-gray-200">
            <button
              type="button"
              className="w-full text-left py-4 flex items-center justify-between gap-4 font-medium text-navy hover:text-teal cursor-pointer bg-transparent"
              style={{border: 'none'}}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span>{item.question}</span>
              <span className="text-xl flex-shrink-0 text-teal">
                {open === i ? '−' : '+'}
              </span>
            </button>
            {open === i && (
              <div
                className="pb-5 text-gray-600 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{__html: item.answer}}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
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
