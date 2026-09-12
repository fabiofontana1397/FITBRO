import { useEffect, useState } from 'react';

type PersistCapable = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
};

/** True once a zustand `persist` store has finished loading from storage. */
export function useStoreHydrated(store: PersistCapable): boolean {
  const [hydrated, setHydrated] = useState(() => store.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    return store.persist.onFinishHydration(() => setHydrated(true));
  }, [store, hydrated]);

  return hydrated;
}
