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
import type {SafetyDataSheetData} from '~/components/product/ProductSafetyInformation';
import type {CertificateOfAnalysis} from '~/components/product/ProductCertificatesOfAnalysis';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo);
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) throw new Error('Expected product handle to be defined');

  const [{product}, backendProduct, safetyDataSheetsResult, certificatesResult] =
    await Promise.all([
      storefront.query(PRODUCT_QUERY, {
        variables: {handle, selectedOptions: getSelectedProductOptions(request)},
      }),
      fetchProductByHandle(handle),
      // No server-side filter exists for metaobjects by field value, so we
      // fetch all entries of each type and filter by product below.
      storefront.query(SAFETY_DATA_SHEET_QUERY, {variables: {first: 50}}),
      storefront.query(CERTIFICATES_OF_ANALYSIS_QUERY, {variables: {first: 50}}),
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

  const safetyDataSheetEntry = (
    safetyDataSheetsResult.metaobjects?.nodes ?? []
  ).find(
    (entry: any) =>
      entry.fields.find((field: any) => field.key === 'product')?.reference
        ?.id === product.id,
  );

  const getField = (key: string) =>
    safetyDataSheetEntry?.fields.find((field: any) => field.key === key);

  const safetyDataSheet: SafetyDataSheetData | null = safetyDataSheetEntry
    ? {
        title: getField('title')?.value ?? null,
        description: getField('description')?.value ?? null,
        fileUrl: getField('file')?.reference?.url ?? null,
      }
    : null;

  const certificatesOfAnalysis: CertificateOfAnalysis[] = (
    certificatesResult.metaobjects?.nodes ?? []
  )
    .filter(
      (entry: any) =>
        entry.fields.find((field: any) => field.key === 'product')?.reference
          ?.id === product.id,
    )
    .map((entry: any) => {
      const getCoaField = (key: string) =>
        entry.fields.find((field: any) => field.key === key);
      return {
        id: entry.id,
        lotNumber: getCoaField('lot_number')?.value ?? null,
        dateIssued: getCoaField('date_issued')?.value ?? null,
        fileUrl: getCoaField('file')?.reference?.url ?? null,
      };
    })
    .sort((a, b) => (b.dateIssued ?? '').localeCompare(a.dateIssued ?? ''));

  return {
    product,
    chemistry: backendProduct?.chemistry ?? null,
    seo,
    safetyDataSheet,
    certificatesOfAnalysis,
  };
}

// TODO: breadcrumb, gallery, identifiers, perks, quote callout, and the
// details section below are still on mock data. See app/components/product/.
export default function Product() {
  const {product, safetyDataSheet, certificatesOfAnalysis} =
    useLoaderData<typeof loader>();
  const images = product.images?.nodes ?? [];

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
        <ProductGallery images={images} />
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
        <ProductDetailsSection
          safetyDataSheet={safetyDataSheet}
          certificatesOfAnalysis={certificatesOfAnalysis}
        />
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
    images(first: 12) {
      nodes {
        __typename
        id
        url
        altText
        width
        height
      }
    }
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

const SAFETY_DATA_SHEET_QUERY = `#graphql
  query SafetyDataSheets($first: Int!) {
    metaobjects(type: "safety_data_sheet", first: $first) {
      nodes {
        id
        handle
        type
        fields {
          key
          value
          reference {
            ... on Product {
              id
              handle
            }
            ... on GenericFile {
              id
              url
              mimeType
            }
            ... on MediaImage {
              id
              image {
                url
              }
            }
          }
        }
      }
    }
  }
` as const;

const CERTIFICATES_OF_ANALYSIS_QUERY = `#graphql
  query CertificatesOfAnalysis($first: Int!) {
    metaobjects(type: "certificates_of_analysis", first: $first) {
      nodes {
        id
        handle
        type
        fields {
          key
          value
          reference {
            ... on Product {
              id
              handle
            }
            ... on GenericFile {
              id
              url
              mimeType
            }
          }
        }
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
