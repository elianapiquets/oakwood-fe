import {Link} from 'react-router';
import {tabsListVariants} from '~/components/ui';
import {cn} from '@/lib/utils';
import {locationIdToParam, ORDER_FILTER_FIELDS} from '~/lib/orderFilters';

export interface OrdersTabLocation {
  id: string;
  name: string;
}

const TAB_BASE =
  'relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors no-underline';
const TAB_ACTIVE =
  'text-navy after:absolute after:inset-x-0 after:-bottom-[5px] after:h-0.5 after:bg-navy';
const TAB_INACTIVE = 'text-slate-500 hover:text-navy';

/**
 * One tab per company location the contact belongs to.
 *
 * Intentionally NOT base-ui's <Tabs> Root/Tab: those own the active-tab state
 * and register each Tab's DOM node into a Map held in Root state. Here the
 * active tab comes from the URL — the location goes into the order query's
 * `purchasing_company_location_id` filter — so switching tabs must be a real
 * navigation. Passing `render={<Link/>}` to a Tab handed base-ui a fresh
 * element every render, so it re-registered on each pass and looped
 * ("Maximum update depth exceeded"). Plain links hold no state and can't.
 *
 * Styling still comes from the Tabs module (`tabsListVariants`) so this matches
 * the design system. Marked up as navigation rather than with `role="tab"`,
 * since tab roles imply panels these links don't have.
 */
export function OrdersTabs({
  locations,
  activeLocationId,
}: {
  locations: OrdersTabLocation[];
  activeLocationId: string | null;
}) {
  if (!locations.length) return null;

  const activeId = activeLocationId ?? locations[0].id;

  return (
    <nav
      aria-label="Order locations"
      className={cn(tabsListVariants({variant: 'line'}), 'h-auto gap-2')}
    >
      {locations.map((location) => {
        const isActive = location.id === activeId;
        return (
          <Link
            key={location.id}
            to={`/account/orders?${ORDER_FILTER_FIELDS.LOCATION}=${locationIdToParam(location.id)}`}
            prefetch="intent"
            aria-current={isActive ? 'page' : undefined}
            className={cn(TAB_BASE, isActive ? TAB_ACTIVE : TAB_INACTIVE)}
          >
            {location.name}
          </Link>
        );
      })}
    </nav>
  );
}
