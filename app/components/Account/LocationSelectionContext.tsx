import {createContext, useContext, useState, type ReactNode} from 'react';

interface LocationSelectionContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const LocationSelectionContext =
  createContext<LocationSelectionContextValue | null>(null);

// Mirrors the existing Aside.Provider/useAside() pattern already used
// app-wide for the cart/search/mobile-menu overlays.
export function LocationSelectionProvider({children}: {children: ReactNode}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <LocationSelectionContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </LocationSelectionContext.Provider>
  );
}

export function useLocationSelection() {
  const context = useContext(LocationSelectionContext);
  if (!context) {
    throw new Error(
      'useLocationSelection must be used within a LocationSelectionProvider',
    );
  }
  return context;
}
