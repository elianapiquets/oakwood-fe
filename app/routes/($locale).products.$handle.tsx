import {useState} from 'react';
import {useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {fetchProductByHandle} from '~/lib/backend';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {ChemistryPanel} from '~/components/ChemistryPanel';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `Oakwood Chemical | ${data?.product.title ?? ''}`},
    {rel: 'canonical', href: `/products/${data?.product.handle}`},
  ];
};

export async function loader({params, request}: Route.LoaderArgs) {
  const {handle} = params;
  if (!handle) throw new Error('Expected product handle to be defined');

  const product = await fetchProductByHandle(handle);
  if (!product) throw new Response(null, {status: 404});

  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {product};
}

export default function Product() {
  const {product} = useLoaderData<typeof loader>();
  const {open} = useAside();

  const firstVariant = product.variants[0];
  const initialOptions = Object.fromEntries(
    (firstVariant?.selectedOptions ?? []).map(({name, value}) => [name, value]),
  );

  const [selectedOptions, setSelectedOptions] =
    useState<Record<string, string>>(initialOptions);

  const selectedVariant =
    product.variants.find((v) =>
      v.selectedOptions.every((o) => selectedOptions[o.name] === o.value),
    ) ?? firstVariant;

  return (
    <div className="product">
      {product.featuredImage && (
        <img
          src={product.featuredImage.url}
          alt={product.featuredImage.altText ?? product.title}
          width={product.featuredImage.width ?? undefined}
          height={product.featuredImage.height ?? undefined}
          className="product-image"
        />
      )}
      <div className="product-main">
        <h1>{product.title}</h1>
        {selectedVariant?.price && (
          <p className="product-price">
            ${parseFloat(selectedVariant.price).toFixed(2)}
          </p>
        )}
        <br />
        <div className="product-form">
          {product.options.map((option) => {
            if (option.values.length <= 1) return null;
            return (
              <div className="product-options" key={option.name}>
                <h5>{option.name}</h5>
                <div className="product-options-grid">
                  {option.values.map((value) => {
                    const isSelected = selectedOptions[option.name] === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`product-options-item${!isSelected ? ' link' : ''}`}
                        style={{
                          border: isSelected
                            ? '1px solid black'
                            : '1px solid transparent',
                        }}
                        onClick={() =>
                          setSelectedOptions((prev) => ({
                            ...prev,
                            [option.name]: value,
                          }))
                        }
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
                <br />
              </div>
            );
          })}
          <AddToCartButton
            disabled={!selectedVariant?.availableForSale}
            onClick={() => open('cart')}
            lines={
              selectedVariant
                ? [{merchandiseId: selectedVariant.id, quantity: 1}]
                : []
            }
          >
            {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
          </AddToCartButton>
        </div>
        <br />
        <br />
        <p>
          <strong>Description</strong>
        </p>
        <br />
        <div dangerouslySetInnerHTML={{__html: product.descriptionHtml}} />
        <br />
        <ChemistryPanel data={product.chemistry} />
      </div>
    </div>
  );
}
