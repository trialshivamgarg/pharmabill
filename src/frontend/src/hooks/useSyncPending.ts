import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useActor } from "./useActor";
import {
  clearPendingQueue,
  getCache,
  getPendingQueue,
  removePendingQueueItem,
  setCache,
} from "./useOfflineStore";
import { useOnlineStatus } from "./useOnlineStatus";
import type { Bill } from "./useQueries";

export function useSyncPending() {
  const { isOnline } = useOnlineStatus();
  const { actor } = useActor();
  const qc = useQueryClient();
  const wasOnlineRef = useRef(false); // start false so first online load triggers sync
  const hasSyncedOnStartRef = useRef(false);

  useEffect(() => {
    const becameOnline = !wasOnlineRef.current && isOnline;
    wasOnlineRef.current = isOnline;

    // Trigger sync when transitioning online OR on first mount if already online
    const isFirstOnlineLoad = isOnline && !hasSyncedOnStartRef.current;
    const shouldSync = becameOnline || isFirstOnlineLoad;
    if (!shouldSync || !actor) return;
    hasSyncedOnStartRef.current = true;

    const queue = getPendingQueue();
    if (queue.length === 0) {
      // Only toast when coming back online (not on initial load)
      if (becameOnline) toast.success("Back online");
      qc.invalidateQueries();
      return;
    }

    (async () => {
      let synced = 0;
      let failed = 0;

      for (const item of queue) {
        try {
          switch (item.type) {
            case "addMedicine":
              await actor.addMedicine(item.payload);
              break;
            case "updateMedicine":
              await actor.updateMedicine(item.payload);
              break;
            case "deleteMedicine":
              await actor.deleteMedicine(item.payload);
              break;
            case "addCustomer":
              await actor.addCustomer(item.payload);
              break;
            case "updateCustomer":
              await actor.updateCustomer(item.payload);
              break;
            case "deleteCustomer":
              await actor.deleteCustomer(item.payload);
              break;
            case "updateBill":
              await actor.updateBill(item.payload);
              break;
            case "deleteBill":
              await actor.deleteBill(item.payload);
              break;
            case "createBill": {
              // Capture the real backend ID and update the cache
              // so the 0n placeholder is replaced with the real id
              const assignedId = await actor.createBill(item.payload);
              const realId = BigInt(assignedId);
              const bill: Bill = item.payload as Bill;

              // Update localStorage cache with real id
              const cachedBills = getCache<Bill[]>("bills") ?? [];
              const withRealId = cachedBills.map((b) =>
                String(b.billNumber) === String(bill.billNumber) && b.id === 0n
                  ? { ...b, id: realId }
                  : b,
              );
              setCache("bills", withRealId);

              // Update React Query cache with real id
              qc.setQueryData<Bill[]>(["bills"], (old = []) =>
                old.map((b) =>
                  String(b.billNumber) === String(bill.billNumber) &&
                  b.id === 0n
                    ? { ...b, id: realId }
                    : b,
                ),
              );
              break;
            }
            case "addDistributor":
              await actor.addDistributor(item.payload);
              break;
            case "updateDistributor":
              await actor.updateDistributor(item.payload);
              break;
            case "deleteDistributor":
              await actor.deleteDistributor(item.payload);
              break;
            case "addPurchase":
              await actor.addPurchase(item.payload);
              break;
          }
          removePendingQueueItem(item.id);
          synced++;
        } catch (err) {
          // Log to DevTools so the real error is visible during debugging
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(
            `[useSyncPending] Failed to sync item (type=${item.type}, id=${item.id}):`,
            errMsg,
            err,
          );

          // Determine a human-readable label for the toast
          const labelMap: Record<string, string> = {
            createBill: "Bill creation",
            updateBill: "Bill update",
            deleteBill: "Bill deletion",
            addMedicine: "Medicine addition",
            updateMedicine: "Medicine update",
            deleteMedicine: "Medicine deletion",
            addCustomer: "Customer addition",
            updateCustomer: "Customer update",
            deleteCustomer: "Customer deletion",
            addDistributor: "Distributor addition",
            updateDistributor: "Distributor update",
            deleteDistributor: "Distributor deletion",
            addPurchase: "Purchase addition",
          };
          const label = labelMap[item.type] ?? item.type;

          // Remove the stuck item from the queue so it does not retry forever,
          // and show a descriptive message so the user knows what happened.
          removePendingQueueItem(item.id);
          toast.error(`${label} failed to sync and was removed from queue`, {
            description: errMsg,
            duration: 8000,
          });
          failed++;
        }
      }

      if (failed === 0) {
        clearPendingQueue();
        toast.success(
          `Back online — ${synced} change${synced !== 1 ? "s" : ""} synced successfully`,
        );
      } else if (synced > 0) {
        toast.warning(
          `Sync complete: ${synced} synced, ${failed} could not sync and were removed from queue`,
        );
      }
      // If only failures (synced === 0), individual per-item toasts already fired above

      qc.invalidateQueries();
    })();
  }, [isOnline, actor, qc]);
}
