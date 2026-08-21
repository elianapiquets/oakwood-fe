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

/**
 * Operations that amount to "may change this resource".
 *
 * `ADD` is absent on purpose: being able to add a contact isn't permission to
 * edit the location's addresses, and the two are separate resources anyway.
 */
export const ROLE_EDIT_PERMISSIONS = [
  'ALL',
  'EDIT',
] as const satisfies readonly PermittedOperation[];

/** The two roles this store defines. Named here so no string is retyped. */
export const LOCATION_ADMIN_ROLE = 'Location admin';
export const ORDERING_ONLY_ROLE = 'Ordering only';

/**
 * Whether a role may edit a resource at its location.
 *
 * Takes two signals, because neither alone is sufficient here:
 *
 * 1. `resourcePermission(resource: …)`, the model Shopify documents. Preferred,
 *    and the only thing `roleCanViewAllLocationOrders` uses — for ORDER it does
 *    discriminate ("Location admin" returns `['VIEW','ADD']`, "Ordering only"
 *    `[]`).
 * 2. The role's **name**. Needed because these location resources return no
 *    edit operation at all for a Location admin on this store, so relying on
 *    permissions alone hides the controls from the very people who should have
 *    them. Oakwood defines exactly two roles, and admin means editable.
 *
 * The name check fails *closed*: rename the role in Admin and admins lose the
 * controls rather than gaining them. Revisit if Shopify starts populating edit
 * operations for these resources, or if the company grows a third role.
 */
export function roleCanEdit(
  permissions: readonly PermittedOperation[] | null | undefined,
  roleName?: string | null,
): boolean {
  if (roleName === LOCATION_ADMIN_ROLE) return true;

  if (!permissions?.length) return false;
  return permissions.some((permission) =>
    (ROLE_EDIT_PERMISSIONS as readonly PermittedOperation[]).includes(
      permission,
    ),
  );
}
