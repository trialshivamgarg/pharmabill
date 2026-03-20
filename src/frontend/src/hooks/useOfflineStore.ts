export type PendingMutationType =
  | "addMedicine"
  | "updateMedicine"
  | "deleteMedicine"
  | "addCustomer"
  | "updateCustomer"
  | "deleteCustomer"
  | "createBill"
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
