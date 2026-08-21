import {useLoaderData, data, type HeadersFunction} from 'react-router';
import type {Route} from './+types/($locale).cart';
import type {CartQueryDataReturn, SeoConfig} from '@shopify/hydrogen';
import type {CartLineInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {CartForm, getSeoMeta} from '@shopify/hydrogen';
import {CartMain} from '~/components/Cart';
import {getRootSeo} from '~/lib/seo';
import {getPathPrefix} from '~/lib/i18n';
import {CUSTOMER_LOCATION_IDS_QUERY} from '~/graphql/customer-account/CartCustomerLocationIdsQuery';

export const meta: Route.MetaFunction = ({data, matches}) => {
  return getSeoMeta(getRootSeo(matches), data?.seo) ?? [];
};

export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;

// Only the customer's own locations may be selected. Shopify's B2B cookbook
// submits a client-supplied `companyLocationId` straight into the mutation; this
// re-reads the customer's real locations and rejects anything else.

export async function action({request, context}: Route.ActionArgs) {
  const {cart, customerAccount} = context;

  const formData = await request.formData();

  const {action, inputs} = CartForm.getFormInput(formData);

  if (!action) {
    throw new Error('No action provided');
  }

  let status = 200;
  let result: CartQueryDataReturn;
  /** Lines dropped by a buyer-identity change, surfaced to the cart UI. */
  let removedLineCount = 0;
  /** Which path actually applied the company location. */
  let strategy: 'updated' | 'recreated' = 'updated';

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = (
        formDiscountCode ? [formDiscountCode] : []
      ) as string[];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesAdd: {
      const formGiftCardCode = inputs.giftCardCode;

      const giftCardCodes = (
        formGiftCardCode ? [formGiftCardCode] : []
      ) as string[];

      result = await cart.addGiftCardCodes(giftCardCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesRemove: {
      const appliedGiftCardIds = inputs.giftCardCodes as string[];
      result = await cart.removeGiftCardCodes(appliedGiftCardIds);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate: {
      const buyerIdentity = (inputs.buyerIdentity ?? {}) as {
        companyLocationId?: string | null;
      };
      const requestedLocationId = buyerIdentity.companyLocationId ?? null;

      if (requestedLocationId) {
        if (!(await customerAccount.isLoggedIn())) {
          return data({error: 'Not logged in'}, {status: 401});
        }

        const {data: customerData} = await customerAccount.query(
          CUSTOMER_LOCATION_IDS_QUERY,
        );
        const ownLocationIds = new Set(
          (
            customerData?.customer?.companyContacts?.nodes?.[0]?.locations
              ?.nodes ?? []
          ).map((location: any) => location.id),
        );

        if (!ownLocationIds.has(requestedLocationId)) {
          return data({error: 'Invalid location'}, {status: 403});
        }
      }

      // Shopify documents this mutation as able to invalidate a cart:
      // "Products not published for the current B2B customer will be removed
      // from cart". Count the lines first so the removal can be reported
      // instead of the customer silently losing items.
      const linesBefore = requestedLocationId
        ? ((await cart.get())?.lines?.nodes?.length ?? 0)
        : 0;

      result = await cart.updateBuyerIdentity({...inputs.buyerIdentity});

      if (
        requestedLocationId &&
        (result?.errors?.length || result?.userErrors?.length)
      ) {
        return data(
          {
            error: 'Failed to switch location',
            errors: result.errors,
            userErrors: result.userErrors,
          },
          {status: 500},
        );
      }

      if (requestedLocationId) {
        // Read the cart back rather than trusting the mutation's own payload:
        // the response can lag the change even when it did apply.
        const confirmed = (await cart.get()) as CartApiQueryFragment | null;
        const linesAfter = confirmed?.lines?.nodes?.length ?? 0;
        removedLineCount = Math.max(0, linesBefore - linesAfter);

        const appliedLocationId =
          confirmed?.buyerIdentity?.purchasingCompany?.location?.id ?? null;

        // Measured on this store: `cartBuyerIdentityUpdate` returns no errors
        // and still leaves `purchasingCompany` unset on a cart that has lines —
        // exactly the invalid-cart case Shopify documents. An empty cart needs
        // no fallback: the session buyer is already set, so the next
        // `addLines()` creates the cart at the right location.
        if (appliedLocationId !== requestedLocationId && linesAfter > 0) {
          const lines: CartLineInput[] = (confirmed?.lines?.nodes ?? [])
            // Bundle components arrive as top-level lines beside their parent
            // (the filter CartMain applies when rendering); Shopify re-derives
            // them, so re-adding would double up.
            .filter(
              (line) =>
                !(
                  'parentRelationship' in line &&
                  line.parentRelationship?.parent
                ),
            )
            .map((line) => ({
              merchandiseId: line.merchandise.id,
              quantity: line.quantity,
              attributes: line.attributes.flatMap(({key, value}) =>
                value == null ? [] : [{key, value}],
              ),
            }));

          const discountCodes = (confirmed?.discountCodes ?? [])
            .filter((discount) => discount.applicable)
            .map(({code}) => code);

          // Gift cards can't be carried over — the Storefront API exposes only
          // their last four characters, never the code.
          const recreated = await cart.create({
            lines,
            discountCodes,
            buyerIdentity: {companyLocationId: requestedLocationId},
            ...(confirmed?.note ? {note: confirmed.note} : {}),
            ...(confirmed?.attributes?.length
              ? {
                  attributes: confirmed.attributes.flatMap(({key, value}) =>
                    value == null ? [] : [{key, value}],
                  ),
                }
              : {}),
          });

          if (
            recreated.errors?.length ||
            recreated.userErrors?.length ||
            !recreated.cart?.id
          ) {
            return data(
              {
                error: 'Failed to switch location',
                errors: recreated.errors,
                userErrors: recreated.userErrors,
              },
              {status: 500},
            );
          }

          removedLineCount = Math.max(
            0,
            linesBefore - (recreated.cart.lines?.nodes?.length ?? 0),
          );
          result = recreated;
          strategy = 'recreated';
        }
      }

      break;
    }
    default:
      throw new Error(`${action} cart action is not defined`);
  }

  const cartId = result?.cart?.id;
  const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
  const {cart: cartResult, errors, warnings} = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string') {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return data(
    {
      cart: cartResult,
      errors,
      warnings,
      removedLineCount,
      strategy,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

export async function loader({context}: Route.LoaderArgs) {
  const {cart, storefront} = context;
  const cartData = await cart.get();
  const pathPrefix = getPathPrefix(storefront);

  const seo: SeoConfig = {
    title: 'Cart',
    url: `${pathPrefix}/cart`,
  };

  return {cart: cartData, seo};
}

export default function Cart() {
  const {cart} = useLoaderData<typeof loader>();

  return (
    <div className="cart">
      <h1>Cart</h1>
      <CartMain layout="page" cart={cart} />
    </div>
  );
}
