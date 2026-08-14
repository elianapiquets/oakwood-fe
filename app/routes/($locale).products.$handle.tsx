import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  getSeoMeta,
  type SeoConfig,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {fetchProductByHandle} from '~/lib/backend';
import {getRootSeo, truncate} from '~/lib/seo';
import {ProductBreadcrumb} from '~/components/product/ProductBreadcrumb';
import {ProductGallery} from '~/components/product/ProductGallery';
import {ProductInfoColumn} from '~/components/product/ProductInfoColumn';
import {ProductDetailsSection} from '~/components/product/ProductDetailsSection';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo);
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) throw new Error('Expected product handle to be defined');

  const [{product}, backendProduct] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    fetchProductByHandle(handle),
  ]);

  if (!product?.id) {
    const redirectData = await storefront
      .query(URL_REDIRECTS_QUERY, {
        variables: {query: `path:/products/${handle}`},
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
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: product});

  const variant = product.selectedOrFirstAvailableVariant;
  const price = variant?.price;
  const image = variant?.image?.url;
  const description = product.seo?.description ?? truncate(product.description);
  const {pathPrefix} = context.storefront.i18n;

  const seo: SeoConfig = {
    title: product.seo?.title ?? product.title,
    ...(description ? {description} : {}),
    url: `${pathPrefix}/products/${product.handle}`,
    ...(image ? {media: image} : {}),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.seo?.description ?? product.description,
      sku: variant?.sku,
      ...(product.vendor
        ? {brand: {'@type': 'Brand', name: product.vendor}}
        : {}),
      ...(image ? {image} : {}),
      offers: {
        '@type': 'Offer',
        price: price?.amount,
        priceCurrency: price?.currencyCode ?? 'USD',
        availability: variant?.availableForSale
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      },
    },
  };

  return {product, chemistry: backendProduct?.chemistry ?? null, seo};
}

// TODO: breadcrumb, gallery, identifiers, perks, quote callout, and the
// details section below are still on mock data. See app/components/product/.
export default function Product() {
  const {product} = useLoaderData<typeof loader>();

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  return (
    <div className="w-full px-8 py-6">
      <ProductBreadcrumb />
      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery />
        <ProductInfoColumn
          price={selectedVariant?.price}
          compareAtPrice={selectedVariant?.compareAtPrice}
          availableForSale={selectedVariant?.availableForSale}
          unit={selectedVariant?.title}
          productOptions={productOptions}
          selectedVariant={selectedVariant}
        />
      </div>
      <div className="mt-12">
        <ProductDetailsSection />
      </div>
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariantShopify on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment ProductShopify on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariantShopify
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariantShopify
    }
    adjacentVariants(selectedOptions: $selectedOptions) {
      ...ProductVariantShopify
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query ProductShopify(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductShopify
    }
  }
  ${PRODUCT_FRAGMENT}
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
