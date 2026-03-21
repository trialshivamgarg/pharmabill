export type PendingMutationType =
  | "addMedicine"
  | "updateMedicine"
  | "deleteMedicine"
  | "addCustomer"
  | "updateCustomer"
  | "deleteCustomer"
  | "createBill"
  | "updateBill"
  | "deleteBill"
  | "addDistributor"
  | "updateDistributor"
  | "deleteDistributor"
  | "addPurchase";

export interface PendingQueueItem {
  id: string;
  type: PendingMutationType;
  payload: any;
  timestamp: number;
}

const CACHE_KEYS = {
  medicines: "offline_medicines",
  customers: "offline_customers",
  bills: "offline_bills",
  distributors: "offline_distributors",
  purchases: "offline_purchases",
  pendingQueue: "offline_pending_queue",
} as const;

export type CacheKey = keyof typeof CACHE_KEYS;

export function getCache<T>(key: CacheKey): T | null {
  try {
    const raw = localStorage.getItem(CACHE_KEYS[key]);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setCache<T>(key: CacheKey, data: T): void {
  try {
    localStorage.setItem(CACHE_KEYS[key], JSON.stringify(data));
  } catch {
    // Storage quota exceeded or private mode — silently ignore
  }
}

export function getPendingQueue(): PendingQueueItem[] {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.pendingQueue);
    if (!raw) return [];
    return JSON.parse(raw) as PendingQueueItem[];
  } catch {
    return [];
  }
}

export function addToPendingQueue(item: PendingQueueItem): void {
  try {
    const queue = getPendingQueue();
    queue.push(item);
    localStorage.setItem(CACHE_KEYS.pendingQueue, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

export function removePendingQueueItem(id: string): void {
  try {
    const queue = getPendingQueue().filter((item) => item.id !== id);
    localStorage.setItem(CACHE_KEYS.pendingQueue, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

export function clearPendingQueue(): void {
  try {
    localStorage.removeItem(CACHE_KEYS.pendingQueue);
  } catch {
    // ignore
  }
}

// ─── Bill-local-overrides helpers ───────────────────────────────────────────
// These let us track which bills were deleted or updated locally so we can
// re-apply the overrides after a server fetch without losing changes.

const BILL_DELETIONS_KEY = "pharma_bill_deletions";
const BILL_UPDATES_KEY = "pharma_bill_updates";

export function getBillDeletions(): string[] {
  try {
    const raw = localStorage.getItem(BILL_DELETIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addBillDeletion(id: string): void {
  try {
    const ids = getBillDeletions();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(BILL_DELETIONS_KEY, JSON.stringify(ids));
    }
    // Remove from updates if it was previously updated
    const updates = getBillUpdates();
    delete updates[id];
    localStorage.setItem(BILL_UPDATES_KEY, JSON.stringify(updates));
  } catch {
    // ignore
  }
}

export function getBillUpdates(): Record<string, any> {
  try {
    const raw = localStorage.getItem(BILL_UPDATES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setBillUpdate(id: string, bill: any): void {
  try {
    const updates = getBillUpdates();
    updates[id] = bill;
    localStorage.setItem(BILL_UPDATES_KEY, JSON.stringify(updates));
    // Remove from deletions if previously deleted
    const deletions = getBillDeletions().filter((d) => d !== id);
    localStorage.setItem(BILL_DELETIONS_KEY, JSON.stringify(deletions));
  } catch {
    // ignore
  }
}

/**
 * Apply local overrides (deletions + updates) to a server-fetched bills array.
 * Call this after every bills fetch to ensure local edit/delete changes persist.
 */
export function applyBillOverrides<T extends { id: any }>(bills: T[]): T[] {
  const deletions = getBillDeletions();
  const updates = getBillUpdates();
  return bills
    .filter((b) => !deletions.includes(String(b.id)))
    .map((b) => {
      const override = updates[String(b.id)];
      return override ? { ...b, ...override } : b;
    });
}
