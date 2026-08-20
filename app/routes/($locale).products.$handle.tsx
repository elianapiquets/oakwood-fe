import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/($locale).products.$handle';
import {
  getSelectedProductOptions,
  getSeoMeta,
  type SeoConfig,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {getBuyerContext} from '~/lib/buyer';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {fetchProductByHandle} from '~/lib/backend';
import {getRootSeo, truncate} from '~/lib/seo';
import {ProductBreadcrumb} from '~/components/product/ProductBreadcrumb';
import {ProductGallery} from '~/components/product/ProductGallery';
import {ProductInfoColumn} from '~/components/product/ProductInfoColumn';
import {ProductDetailsSection} from '~/components/product/ProductDetailsSection';
import type {SafetyDataSheetData} from '~/components/product/ProductSafetyInformation';
import type {CertificateOfAnalysis} from '~/components/product/ProductCertificatesOfAnalysis';
import {getPathPrefix} from '~/lib/i18n';
import {
  PRODUCT_VARIANT_FRAGMENT,
  PRODUCT_FRAGMENT,
  PRODUCT_QUERY,
  SAFETY_DATA_SHEET_QUERY,
  CERTIFICATES_OF_ANALYSIS_QUERY,
} from '~/graphql/storefront/ProductQueries';
import {URL_REDIRECTS_QUERY} from '~/graphql/storefront/RedirectQuery';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo) ?? [];
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) throw new Error('Expected product handle to be defined');

  // B2B pricing is per company location, so the product query has to be
  // contextualized with the buyer. `cache` is CacheNone whenever a buyer is
  // present — price-list pricing must never come from a shared cache entry.
  const {buyer, cache} = await getBuyerContext(context);

  const [
    {product},
    backendProduct,
    safetyDataSheetsResult,
    certificatesResult,
  ] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {
        handle,
        selectedOptions: getSelectedProductOptions(request),
        buyer,
      },
      cache,
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
      string | undefined;
    if (target) {
      const path = target.startsWith('http')
        ? new URL(target).pathname
        : target;
      throw redirect(path, 301);
    }
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: product});

  const variant = product.selectedOrFirstAvailableVariant;
  const price = variant?.price;
  const image = variant?.image?.url;
  const description = product.seo?.description ?? truncate(product.description);
  const pathPrefix = getPathPrefix(context.storefront);

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
        // `reference` is a union; only GenericFile has a top-level `url`
        // (MediaImage nests it under `image`).
        fileUrl: (() => {
          const reference = getField('file')?.reference;
          return reference && 'url' in reference
            ? (reference.url ?? null)
            : null;
        })(),
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
  // ProductGallery needs a concrete id and url; both are nullable in the
  // Storefront types, so drop incomplete images rather than casting.
  const images = (product.images?.nodes ?? []).flatMap((image) =>
    image.id && image.url ? [{...image, id: image.id, url: image.url}] : [],
  );

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
