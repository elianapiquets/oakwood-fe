import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

export function ProductPriceStock({
  price,
  compareAtPrice,
  availableForSale,
  unit,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
  availableForSale?: boolean;
  unit?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900">
          {price ? <Money data={price} /> : <span>&nbsp;</span>}
        </span>
        {compareAtPrice && (
          <span className="text-lg text-slate-400 line-through">
            <Money data={compareAtPrice} />
          </span>
        )}
        {unit && <span className="text-sm text-slate-500">/ {unit}</span>}
      </div>
      <div
        className={`mt-2 flex items-center gap-2 text-sm ${
          availableForSale ? 'text-emerald-700' : 'text-slate-500'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            availableForSale ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
          aria-hidden="true"
        />
        {availableForSale ? 'In Stock USA' : 'Out of Stock'}
      </div>
    </div>
  );
}
