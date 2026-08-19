import {useEffect} from 'react';
import {useRevalidator} from 'react-router';

/**
 * Refetches root data when the browser restores this page from its
 * back/forward cache.
 *
 * A restored page runs no loaders — the browser hands back the exact DOM it
 * froze, so anything personalized in it is as old as the snapshot. That's how
 * the account dropdown ends up naming the company location the customer had
 * *before* they switched: they switch, leave for Shopify's checkout, then come
 * back and get the pre-switch page. Worse, `root`'s `shouldRevalidate` returns
 * false for ordinary navigations, so the stale value then survives every
 * client-side navigation after the restore.
 *
 * `shouldRevalidate` already returns true for the same-URL case that
 * `useRevalidator` produces, so this needs no change there.
 */
export function useRevalidateOnPageRestore() {
  const {revalidate} = useRevalidator();

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      // `persisted` is the whole point: a normal load already ran its loaders.
      if (event.persisted) {
        void revalidate();
      }
    }

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [revalidate]);
}
