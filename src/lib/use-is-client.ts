import { useSyncExternalStore } from "react";

/**
 * Returns false during SSR, true on the client (after hydration).
 * Used to gate Portal rendering so React doesn't hit a hydration mismatch.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
