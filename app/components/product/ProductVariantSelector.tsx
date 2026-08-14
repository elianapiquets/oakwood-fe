import {useState} from 'react';
import {Link, useNavigate} from 'react-router';
import type {MappedProductOptions} from '@shopify/hydrogen';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';

export function ProductVariantSelector({
  productOptions,
  // Typed loosely, same as the pre-existing ProductForm.tsx — its own
  // `ProductFragment['selectedOrFirstAvailableVariant']` type reference no
  // longer resolves against the generated storefront types.
  selectedVariant,
  availableForSale,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant?: any;
  availableForSale?: boolean;
}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const [quantity, setQuantity] = useState(1);

  return (
    <div>
      {productOptions.map((option) => {
        if (option.optionValues.length === 1) return null;

        return (
          <div key={option.name} className="mb-4">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">
                {option.name}:
              </span>{' '}
              {option.optionValues.find((value) => value.selected)?.name}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                } = value;

                const className = `rounded border px-4 py-2 text-sm font-semibold ${
                  selected
                    ? 'border-navy bg-navy text-white'
                    : 'border-slate-300 bg-white text-slate-700'
                } ${!available ? 'opacity-30' : ''}`;

                if (isDifferentProduct) {
                  return (
                    <Link
                      key={option.name + name}
                      className={className}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                    >
                      {name}
                    </Link>
                  );
                }

                return (
                  <button
                    key={option.name + name}
                    type="button"
                    disabled={!exists}
                    onClick={() => {
                      if (!selected) {
                        void navigate(`?${variantUriQuery}`, {
                          replace: true,
                          preventScrollReset: true,
                        });
                      }
                    }}
                    className={className}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-2">
        <p className="text-sm font-semibold text-slate-900">Quantity</p>
        {/*
          The Icon component (app/components/ui/icons) is broken today — it
          casts a Vite-imported SVG file path to a React component, which
          crashes at render. Using plain glyphs here until that's fixed.
        */}
        <div className="mt-2 inline-flex items-center rounded border border-slate-300">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="flex h-10 w-10 items-center justify-center text-lg font-semibold text-slate-700"
          >
            &minus;
          </button>
          <span className="flex h-10 w-10 items-center justify-center text-sm font-semibold text-slate-900">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
            className="flex h-10 w-10 items-center justify-center text-lg font-semibold text-slate-700"
          >
            &#43;
          </button>
        </div>
      </div>

      <AddToCartButton
        disabled={!selectedVariant || !availableForSale}
        onClick={() => open('cart')}
        className="mt-6 w-full rounded bg-navy py-3 text-sm font-bold !text-white hover:bg-navy-dark disabled:opacity-40"
        lines={
          selectedVariant
            ? [{merchandiseId: selectedVariant.id, quantity, selectedVariant}]
            : []
        }
      >
        {availableForSale ? 'Add to Cart' : 'Sold Out'}
      </AddToCartButton>
    </div>
  );
}
