import {useState} from 'react';
import {Form, NavLink} from 'react-router';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '~/components/ui/Popover/Popover';
import type {CustomerCompanyLocation} from '~/root';
import {useLocationSelection} from './LocationSelectionContext';
import {BriefcaseIcon, PinIcon} from './icons';

const NAV_ITEMS = [
  {label: 'My Account', to: '/account'},
  {label: 'Order History', to: '/account/orders'},
];

export function AccountMenu({
  name,
  email,
  company,
  locations,
  selectedLocation,
}: {
  name: string;
  email: string;
  company: {id: string; name: string} | null;
  locations: CustomerCompanyLocation[];
  selectedLocation: CustomerCompanyLocation | null;
}) {
  const [open, setOpen] = useState(false);
  const {open: openLocationSwitcher} = useLocationSelection();
  const initial = name.charAt(0).toUpperCase();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Account, signed in as ${name}`}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-semibold !text-white"
      >
        {initial}
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <div className="px-4 py-3">
          <p className="text-sm font-bold text-slate-900">{name}</p>
          <p className="text-sm text-slate-500">{email}</p>
        </div>

        {company && (
          <div className="border-t border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <BriefcaseIcon />
              {company.name}
            </div>
            {selectedLocation && (
              <div className="mt-2 flex items-center justify-between gap-2 text-sm text-slate-700">
                <span className="flex items-center gap-2">
                  <PinIcon />
                  {selectedLocation.name}
                  {selectedLocation.role && (
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {selectedLocation.role}
                    </span>
                  )}
                </span>
                {locations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      openLocationSwitcher();
                    }}
                    className="text-xs font-medium text-teal hover:underline"
                  >
                    Switch
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="border-t border-slate-100 py-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="border-t border-slate-100 py-1">
          <Form
            action="/account/logout"
            method="post"
            onSubmit={() => setOpen(false)}
          >
            <button
              type="submit"
              className="block w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-slate-50"
            >
              Sign Out
            </button>
          </Form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
