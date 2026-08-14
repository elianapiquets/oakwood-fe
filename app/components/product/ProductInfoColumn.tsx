import type {MappedProductOptions} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';
import {ProductIdentifiers} from './ProductIdentifiers';
import {ProductPriceStock} from './ProductPriceStock';
import {ProductVariantSelector} from './ProductVariantSelector';
import {ProductPerks} from './ProductPerks';
import {ProductQuoteCallout} from './ProductQuoteCallout';

export function ProductInfoColumn({
  price,
  compareAtPrice,
  availableForSale,
  unit,
  productOptions,
  selectedVariant,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
  availableForSale?: boolean;
  unit?: string;
  productOptions: MappedProductOptions[];
  selectedVariant?: any;
}) {
  return (
    <div>
      <ProductIdentifiers />
      <div className="mt-4">
        <ProductPriceStock
          price={price}
          compareAtPrice={compareAtPrice}
          availableForSale={availableForSale}
          unit={unit}
        />
      </div>
      <div className="mt-4">
        <ProductVariantSelector
          productOptions={productOptions}
          selectedVariant={selectedVariant}
          availableForSale={availableForSale}
        />
      </div>
      <ProductPerks />
      <ProductQuoteCallout />
    </div>
  );
}
