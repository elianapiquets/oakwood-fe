import {Suspense, useState} from 'react';
import {Await, useFetcher} from 'react-router';
import type {CustomerData, CustomerCompanyLocation} from '~/root';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/Dialog/Dialog';
import {useLocationSelection} from './LocationSelectionContext';
import {BriefcaseIcon, PinIcon, CheckIcon} from './icons';

export function LocationSelectionDialog({
  customer,
}: {
  customer: Promise<CustomerData | null>;
}) {
  return (
    <Suspense fallback={null}>
      <Await resolve={customer}>
        {(resolvedCustomer) =>
          resolvedCustomer?.company && resolvedCustomer.locations.length > 1 ? (
            <LocationSelectionDialogContent
              companyName={resolvedCustomer.company.name}
              locations={resolvedCustomer.locations}
              selectedLocationId={resolvedCustomer.selectedLocation?.id ?? null}
              needsLocationSelection={resolvedCustomer.needsLocationSelection}
            />
          ) : null
        }
      </Await>
    </Suspense>
  );
}

function LocationSelectionDialogContent({
  companyName,
  locations,
  selectedLocationId,
  needsLocationSelection,
}: {
  companyName: string;
  locations: CustomerCompanyLocation[];
  selectedLocationId: string | null;
  needsLocationSelection: boolean;
}) {
  const {isOpen: switchRequested, close: closeSwitch} = useLocationSelection();
  // Dismissing the forced prompt (X/Escape/backdrop) shouldn't reappear on
  // every render within this browser tab — but it's not remembered once the
  // whole app actually reloads, since this state resets on unmount.
  const [forcedPromptDismissed, setForcedPromptDismissed] = useState(false);
  const fetcher = useFetcher();

  const open =
    (needsLocationSelection && !forcedPromptDismissed) || switchRequested;

  function handleSelect() {
    // Close immediately rather than waiting on the fetcher — the dropdown
    // updates once root revalidates in the background.
    closeSwitch();
    setForcedPromptDismissed(true);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeSwitch();
          setForcedPromptDismissed(true);
        }
      }}
      modal
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select a Location</DialogTitle>
          <DialogDescription>
            Choose which location you&apos;re ordering for. You can switch at
            any time from your account menu.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
          <BriefcaseIcon />
          {companyName}
        </div>

        <div className="-mx-2 divide-y divide-slate-100">
          {locations.map((location) => {
            const isSelected = selectedLocationId === location.id;
            return (
              <fetcher.Form
                key={location.id}
                method="post"
                action="/account/select-location"
              >
                <input type="hidden" name="locationId" value={location.id} />
                <button
                  type="submit"
                  onClick={handleSelect}
                  className="flex w-full items-center justify-between gap-3 rounded px-2 py-3 text-left hover:bg-slate-50"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        isSelected
                          ? 'bg-navy text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <PinIcon />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        {location.name}
                      </span>
                      {location.role && (
                        <span className="block text-xs text-blue-700">
                          {location.role}
                        </span>
                      )}
                    </span>
                  </span>
                  {isSelected && (
                    <span className="text-navy">
                      <CheckIcon />
                    </span>
                  )}
                </button>
              </fetcher.Form>
            );
          })}
        </div>

        <p className="text-xs text-slate-500">
          Your role at the selected location determines what you can order
          and approve. Contact your admin to update location access.
        </p>
      </DialogContent>
    </Dialog>
  );
}
