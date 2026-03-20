import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useActor } from "./useActor";
import {
  clearPendingQueue,
  getPendingQueue,
  removePendingQueueItem,
} from "./useOfflineStore";
import { useOnlineStatus } from "./useOnlineStatus";

export function useSyncPending() {
  const { isOnline } = useOnlineStatus();
  const { actor } = useActor();
  const qc = useQueryClient();
  const wasOnlineRef = useRef(isOnline);

  useEffect(() => {
    const becameOnline = !wasOnlineRef.current && isOnline;
    wasOnlineRef.current = isOnline;

    if (!becameOnline || !actor) return;

    const queue = getPendingQueue();
    if (queue.length === 0) {
      toast.success("Back online");
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
            case "createBill":
              await actor.createBill(item.payload);
              break;
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
        } catch {
          failed++;
        }
      }

      if (failed === 0) {
        clearPendingQueue();
        toast.success(
          `Back online — ${synced} change${synced !== 1 ? "s" : ""} synced successfully`,
        );
      } else {
        toast.error(
          `Sync partial: ${synced} synced, ${failed} failed. Will retry next time.`,
        );
      }

      qc.invalidateQueries();
    })();
  }, [isOnline, actor, qc]);
}
