"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** True once the component has mounted on the client — avoids hydration-mismatch flicker. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
