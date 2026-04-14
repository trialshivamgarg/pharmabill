import { useActor as useCaffeineActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";
import type { backendInterface } from "../backend";

/**
 * Returns the real backend actor connected to the Internet Computer canister.
 * Falls back to null when offline or during initial load.
 */
export function useActor(): {
  actor: backendInterface | null;
  isFetching: boolean;
} {
  return useCaffeineActor<backendInterface>(createActor);
}
