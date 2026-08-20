import type {CachingStrategy, CustomerAccount, Storefront} from '@shopify/hydrogen';
import type {BuyerInput} from '@shopify/hydrogen/storefront-api-types';

type BuyerAwareContext = {
  customerAccount: CustomerAccount;
  storefront: Storefront;
};

export interface BuyerContext {
  /**
   * Ready to pass straight into a `@inContext(buyer: $buyer)` query, or `null`
   * for guests. Never a partial object — `BuyerInput.customerAccessToken` is
   * required by the Storefront API, so a buyer without one is no buyer at all.
   */
  buyer: BuyerInput | null;
  /**
   * `CacheNone()` whenever a buyer is present, so B2B price-list pricing is
   * never served to another customer from a shared cache entry. `undefined`
   * for guests, which leaves each query's existing default caching alone.
   */
  cache?: CachingStrategy;
}

/**
 * Reads the B2B buyer out of Hydrogen's own `buyer` session slot — the same
 * slot Hydrogen's cart handler writes whenever a mutation's `buyerIdentity`
 * carries a `companyLocationId`, and that it merges into every cart mutation — and pairs it with the caching
 * strategy that buyer-scoped data requires.
 *
 * `getBuyer()` resolves to `undefined` (not an empty object) when nobody is
 * logged in, despite what its type says.
 */
export async function getBuyerContext(
  context: BuyerAwareContext,
): Promise<BuyerContext> {
  const buyer = await context.customerAccount.getBuyer();

  if (!buyer?.customerAccessToken) {
    return {buyer: null};
  }

  return {
    buyer: {
      customerAccessToken: buyer.customerAccessToken,
      ...(buyer.companyLocationId
        ? {companyLocationId: buyer.companyLocationId}
        : {}),
    },
    cache: context.storefront.CacheNone(),
  };
}
