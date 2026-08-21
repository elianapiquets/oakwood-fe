import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {useFetcher} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import type {CustomerCompanyLocation} from '~/root';

export type B2BLocationContextValue = {
  company: {id: string; name: string} | null;
  companyLocationId: string | null;
  locations: CustomerCompanyLocation[];
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  /**
   * True while the customer belongs to a company, has several locations, and
   * none is selected. The selector refuses to be dismissed in this state — a
   * cart with no company location can't check out as B2B.
   */
  needsLocationSelection: boolean;
};

const defaultValue: B2BLocationContextValue = {
  company: null,
  companyLocationId: null,
  locations: [],
  modalOpen: false,
  setModalOpen: () => {},
  needsLocationSelection: false,
};

const B2BLocationContext = createContext<B2BLocationContextValue>(defaultValue);

/**
 * Mirrors the hook contract of Shopify's B2B cookbook
 * (`B2BLocationProvider` / `useB2BLocation`), but takes its data as props from
 * root's loader instead of `fetcher.load('/b2blocations')`. Same API, one fewer
 * round trip, and the forced first-time modal renders server-side rather than
 * appearing a beat after hydration.
 */
export function B2BLocationProvider({
  company,
  companyLocationId,
  locations,
  needsLocationSelection,
  children,
}: {
  company: {id: string; name: string} | null;
  companyLocationId: string | null;
  locations: CustomerCompanyLocation[];
  needsLocationSelection: boolean;
  children: ReactNode;
}) {
  // Dismissing the forced prompt shouldn't make it reappear on every render in
  // this tab. It isn't remembered across a full reload, by design.
  const [dismissed, setDismissed] = useState(false);
  const [requested, setRequested] = useState(false);

  const autoSelect = useFetcher();
  const needsAutoSelect =
    Boolean(company) && !companyLocationId && locations.length === 1;

  /**
   * The cookbook auto-selects when a customer has exactly one location, from a
   * route loader. We can't do that in root's loader: the customer data is
   * deferred, and `server.ts` writes `Set-Cookie` before deferred promises
   * resolve — so `setBuyer()` there would never reach the browser. A POST does
   * persist, so the single-location case is set with one idempotent submit.
   * Once the session holds the id this never fires again.
   */
  useEffect(() => {
    if (!needsAutoSelect || autoSelect.state !== 'idle' || autoSelect.data) {
      return;
    }

    void autoSelect.submit(
      {
        [CartForm.INPUT_NAME]: JSON.stringify({
          action: CartForm.ACTIONS.BuyerIdentityUpdate,
          inputs: {buyerIdentity: {companyLocationId: locations[0].id}},
        }),
      },
      {method: 'post', action: '/cart'},
    );
  }, [needsAutoSelect, autoSelect, locations]);

  const value = useMemo<B2BLocationContextValue>(
    () => ({
      company,
      companyLocationId,
      locations,
      modalOpen: (needsLocationSelection && !dismissed) || requested,
      setModalOpen: (open: boolean) => {
        setRequested(open);
        // A required selection can't be dismissed, so don't record it as one —
        // otherwise `dismissed` would suppress the prompt for the rest of the
        // session and leave the customer with no location at all.
        if (!open && !needsLocationSelection) setDismissed(true);
      },
      needsLocationSelection,
    }),
    [
      company,
      companyLocationId,
      locations,
      needsLocationSelection,
      dismissed,
      requested,
    ],
  );

  return (
    <B2BLocationContext.Provider value={value}>
      {children}
    </B2BLocationContext.Provider>
  );
}

export function useB2BLocation(): B2BLocationContextValue {
  return useContext(B2BLocationContext);
}
