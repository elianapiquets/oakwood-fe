import type {PermittedOperation} from '@shopify/hydrogen/customer-account-api-types';

/**
 * Operations on `ResourceType.ORDER` that let a company contact see every
 * order at its location, rather than only the ones it placed.
 *
 * Typed against Hydrogen's `PermittedOperation`, so a typo or a value Shopify
 * removes is a compile error instead of a permission check that silently
 * returns false.
 *
 * Observed on this store: a "Location admin" role returns `['VIEW', 'ADD']`
 * for ORDER, while "Ordering only" returns `[]`. `ADD` is deliberately absent
 * below — placing orders is not permission to read other buyers' orders.
 */
export const ORDER_VIEW_ALL_PERMISSIONS = [
  'VIEW',
  'ALL',
  'EDIT',
  'DELETE',
] as const satisfies readonly PermittedOperation[];

/**
 * Whether a role may see every order at its location, or only its own.
 *
 * Reads Shopify's permission model rather than the role's name: names are
 * editable in Admin, so matching on them breaks silently — and breaks
 * permissively, which would show one buyer another buyer's orders.
 *
 * Restrictive by design. An unreadable role, or one with no ORDER permissions,
 * means own-orders-only. Being too restrictive shows an admin fewer orders;
 * being too permissive is a privacy bug.
 */
export function roleCanViewAllLocationOrders(
  orderPermissions: readonly PermittedOperation[] | null | undefined,
): boolean {
  if (!orderPermissions?.length) return false;
  return orderPermissions.some((permission) =>
    (ORDER_VIEW_ALL_PERMISSIONS as readonly PermittedOperation[]).includes(
      permission,
    ),
  );
}
