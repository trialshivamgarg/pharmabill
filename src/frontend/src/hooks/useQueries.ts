import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Bill as BackendBill,
  Customer as BackendCustomer,
  Distributor as BackendDistributor,
  Purchase as BackendPurchase,
} from "../backend";
import { useActor } from "./useActor";
import {
  addBillDeletion,
  addToPendingQueue,
  applyBillOverrides,
  getCache,
  setBillUpdate,
  setCache,
} from "./useOfflineStore";
import { useOnlineStatus } from "./useOnlineStatus";

// ─── Domain types ─────────────────────────────────────────────────────────────

export enum Unit {
  strip = "strip",
  tablet = "tablet",
  bottle = "bottle",
}

export enum PaymentMode {
  cash = "cash",
  card = "card",
  UPI = "UPI",
}

export interface Medicine {
  id: bigint;
  name: string;
  genericName: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  hsnCode: string;
  unit: Unit;
  purchasePrice: bigint;
  sellingPrice: bigint;
  gstPercent: bigint;
  currentStock: bigint;
  reorderLevel: bigint;
  rackLocation: string;
}

export interface Customer {
  id: bigint;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface BillItem {
  medicineId: bigint;
  medicineName: string;
  quantity: bigint;
  unitPrice: bigint;
  gstAmount: bigint;
  discountPercent: bigint;
  hsnCode: string;
  pack: string;
  batch: string;
  expiry: string;
  sgst: bigint;
  cgst: bigint;
}

export interface Bill {
  id: bigint;
  billNumber: bigint;
  billDate: bigint;
  customerId: bigint;
  paymentMode: PaymentMode | string;
  subtotal: bigint;
  totalDiscount: bigint;
  totalGST: bigint;
  grandTotal: bigint;
  items: BillItem[];
  invoiceNo?: string;
  invoiceNumber?: string;
  customerName?: string;
  customerAddress?: string;
  doctorName?: string;
  doctorAddress?: string;
  remark?: string;
}

export interface DashboardStats {
  totalBills: bigint;
  totalRevenue: number;
  totalMedicines: bigint;
  lowStockCount: bigint;
  todayBills: bigint;
  todayRevenue: number;
}

export interface Distributor {
  id: bigint;
  name: string;
  firmName?: string;
  contactPerson?: string;
  address: string;
  phone: string;
  email?: string;
  gstin?: string;
  gstNumber?: string;
  dlNo?: string;
  drugLicenseNumber?: string;
}

export interface PurchaseItem {
  medicineId: bigint;
  medicineName?: string;
  quantity?: bigint;
  qty?: bigint;
  freeQty?: bigint;
  purchaseRate: bigint;
  batchNumber?: string;
  batch?: string;
  expiryDate?: string;
  expiry?: string;
  hsnCode?: string;
  mrp?: bigint;
  gstPercent?: bigint;
  amount?: bigint;
  discountPercent?: bigint;
}

export interface Purchase {
  id: bigint;
  distributorId: bigint;
  distributorName?: string;
  purchaseDate: bigint;
  invoiceNo?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  items: PurchaseItem[];
  totalAmount?: bigint;
  subtotal?: bigint;
  totalGST?: bigint;
  grandTotal?: bigint;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ─── Medicine Pack Size (localStorage, frontend-only) ────────────────────────
const PACK_PREFIX = "medicine_pack_";

export function getMedicinePack(id: bigint | string): string {
  return localStorage.getItem(`${PACK_PREFIX}${String(id)}`) ?? "";
}

export function setMedicinePack(id: bigint | string, pack: string): void {
  if (pack.trim()) {
    localStorage.setItem(`${PACK_PREFIX}${String(id)}`, pack.trim());
  } else {
    localStorage.removeItem(`${PACK_PREFIX}${String(id)}`);
  }
}

export function useGetDashboardStats() {
  const { actor, isFetching } = useActor();
  const { isOnline } = useOnlineStatus();
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!isOnline) {
        const cached = getCache<DashboardStats>("bills");
        return {
          totalBills: BigInt(Array.isArray(cached) ? cached.length : 0),
          totalRevenue: 0,
          totalMedicines: BigInt(0),
          lowStockCount: BigInt(0),
          todayBills: BigInt(0),
          todayRevenue: 0,
          todayBillCount: BigInt(0),
          lowStockMedicinesCount: BigInt(0),
          todayTotalSales: BigInt(0),
          totalMedicinesInStock: BigInt(0),
        } as unknown as DashboardStats;
      }
      try {
        if (!actor) throw new Error("No actor");
        const result = await actor.getDashboardStats();
        return result as unknown as DashboardStats;
      } catch (err) {
        const cached = getCache<DashboardStats>("bills");
        if (cached) return cached;
        throw err;
      }
    },
    enabled: !isOnline || (!!actor && !isFetching),
  });
}

export function useGetMedicines() {
  const { actor, isFetching } = useActor();
  const { isOnline } = useOnlineStatus();
  return useQuery<Medicine[]>({
    queryKey: ["medicines"],
    queryFn: async () => {
      if (!isOnline) {
        return getCache<Medicine[]>("medicines") ?? [];
      }
      try {
        if (!actor) return getCache<Medicine[]>("medicines") ?? [];
        const result = await actor.getAllMedicines();
        setCache("medicines", result);
        return result;
      } catch {
        return getCache<Medicine[]>("medicines") ?? [];
      }
    },
    enabled: !isOnline || (!!actor && !isFetching),
  });
}

export function useGetCustomers() {
  const { actor, isFetching } = useActor();
  const { isOnline } = useOnlineStatus();
  return useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!isOnline) {
        return getCache<Customer[]>("customers") ?? [];
      }
      try {
        if (!actor) return getCache<Customer[]>("customers") ?? [];
        const result = await actor.getAllCustomers();
        // Only overwrite cache if backend returned real data.
        // If backend is empty (seeding may not have run yet), keep the
        // existing cache so previously-visible customers stay visible.
        if (Array.isArray(result) && result.length > 0) {
          setCache("customers", result);
        }
        return result as Customer[];
      } catch {
        return getCache<Customer[]>("customers") ?? [];
      }
    },
    enabled: !isOnline || (!!actor && !isFetching),
    // Re-fetch when window regains focus so seeded data appears after SeedBackendCustomers runs
    refetchOnWindowFocus: true,
  });
}

export function useGetBills() {
  const { actor, isFetching } = useActor();
  const { isOnline } = useOnlineStatus();
  return useQuery<Bill[]>({
    queryKey: ["bills"],
    queryFn: async () => {
      // Dedup by id first, then by billNumber — keep the entry with the highest
      // (real backend) id so a locally-cached bill with id=0n is replaced once
      // the backend assigns the real id.
      const dedup = (bills: Bill[]) => {
        // Step 1: dedup by id (remove exact id duplicates)
        const byId = bills.filter(
          (bill, idx, arr) =>
            arr.findIndex((b) => String(b.id) === String(bill.id)) === idx,
        );
        // Step 2: dedup by billNumber — if two entries share the same billNumber,
        // keep the one with the larger id (the backend-assigned real id)
        const byBillNo = new Map<string, Bill>();
        for (const bill of byId) {
          const key = String(bill.billNumber);
          const existing = byBillNo.get(key);
          if (!existing || bill.id > existing.id) {
            byBillNo.set(key, bill);
          }
        }
        return Array.from(byBillNo.values());
      };

      if (!isOnline) {
        const cached = getCache<Bill[]>("bills") ?? [];
        return dedup(applyBillOverrides(cached));
      }
      try {
        if (!actor) {
          const cached = getCache<Bill[]>("bills") ?? [];
          return dedup(applyBillOverrides(cached));
        }
        const result = (await actor.getAllBills()) as Bill[];
        // Apply local overrides before caching so edits/deletes persist
        const withOverrides = applyBillOverrides(result);
        const uniqueBills = dedup(withOverrides);
        setCache("bills", uniqueBills);
        return uniqueBills;
      } catch {
        const cached = getCache<Bill[]>("bills") ?? [];
        return dedup(applyBillOverrides(cached));
      }
    },
    enabled: !isOnline || (!!actor && !isFetching),
    // Show localStorage cache immediately while the server fetch is in-flight.
    // This prevents BillHistory from ever appearing empty right after a bill is saved.
    placeholderData: () => {
      const cached = getCache<Bill[]>("bills") ?? [];
      return applyBillOverrides(cached);
    },
  });
}

export function useGetDistributors() {
  const { actor, isFetching } = useActor();
  const { isOnline } = useOnlineStatus();
  return useQuery<Distributor[]>({
    queryKey: ["distributors"],
    queryFn: async () => {
      if (!isOnline) {
        return getCache<Distributor[]>("distributors") ?? [];
      }
      try {
        if (!actor) return getCache<Distributor[]>("distributors") ?? [];
        const result = await actor.getAllDistributors();
        setCache("distributors", result);
        return result;
      } catch {
        return getCache<Distributor[]>("distributors") ?? [];
      }
    },
    enabled: !isOnline || (!!actor && !isFetching),
  });
}

export function useGetPurchases() {
  const { actor, isFetching } = useActor();
  const { isOnline } = useOnlineStatus();
  return useQuery<Purchase[]>({
    queryKey: ["purchases"],
    queryFn: async () => {
      if (!isOnline) {
        return getCache<Purchase[]>("purchases") ?? [];
      }
      try {
        if (!actor) return getCache<Purchase[]>("purchases") ?? [];
        const result = await actor.getAllPurchases();
        setCache("purchases", result);
        return result;
      } catch {
        return getCache<Purchase[]>("purchases") ?? [];
      }
    },
    enabled: !isOnline || (!!actor && !isFetching),
  });
}

// ─── Validate Medicine before sending to backend ─────────────────────────────
function validateMedicine(med: Medicine): string | null {
  if (!med.name?.trim()) return "Medicine name is required";
  if (!med.batchNumber?.trim()) return "Batch number is required";
  if (!med.expiryDate?.trim()) return "Expiry date is required";
  if (!med.hsnCode?.trim()) return "HSN code is required";
  if (med.sellingPrice < 0n) return "Selling price cannot be negative";
  if (med.purchasePrice < 0n) return "Purchase price cannot be negative";
  return null;
}

export function useAddMedicine() {
  const { actor } = useActor();
  const { isOnline } = useOnlineStatus();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (med: Medicine) => {
      const validationError = validateMedicine(med);
      if (validationError) throw new Error(validationError);

      if (!isOnline) {
        addToPendingQueue({
          id: generateId(),
          type: "addMedicine",
          payload: med,
          timestamp: Date.now(),
        });
        const cached = getCache<Medicine[]>("medicines") ?? [];
        setCache("medicines", [...cached, med]);
        return;
      }
      if (!actor) throw new Error("No actor");
      try {
        return await actor.addMedicine(med);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[useAddMedicine] actor.addMedicine failed:", msg, e);
        throw new Error(msg);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });
}

export function useUpdateMedicine() {
  const { actor } = useActor();
  const { isOnline } = useOnlineStatus();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (med: Medicine) => {
      const validationError = validateMedicine(med);
      if (validationError) throw new Error(validationError);

      if (!isOnline) {
        addToPendingQueue({
          id: generateId(),
          type: "updateMedicine",
          payload: med,
          timestamp: Date.now(),
        });
        const cached = getCache<Medicine[]>("medicines") ?? [];
        setCache(
          "medicines",
          cached.map((m) => (m.id === med.id ? med : m)),
        );
        return;
      }
      if (!actor) throw new Error("No actor");
      try {
        return await actor.updateMedicine(med);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(
          "[useUpdateMedicine] actor.updateMedicine failed:",
          msg,
          e,
        );
        throw new Error(msg);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });
}

export function useDeleteMedicine() {
  const { actor } = useActor();
  const { isOnline } = useOnlineStatus();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!isOnline) {
        addToPendingQueue({
          id: generateId(),
          type: "deleteMedicine",
          payload: id,
          timestamp: Date.now(),
        });
        const cached = getCache<Medicine[]>("medicines") ?? [];
        setCache(
          "medicines",
          cached.filter((m) => m.id !== id),
        );
        return;
      }
      if (!actor) throw new Error("No actor");
      return actor.deleteMedicine(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });
}

export function useAddCustomer() {
  const { actor } = useActor();
  const { isOnline } = useOnlineStatus();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cust: Customer) => {
      if (!isOnline) {
        addToPendingQueue({
          id: generateId(),
          type: "addCustomer",
          payload: cust,
          timestamp: Date.now(),
        });
        const cached = getCache<Customer[]>("customers") ?? [];
        setCache("customers", [...cached, cust]);
        return;
      }
      if (!actor) throw new Error("No actor");
      return actor.addCustomer(cust);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor();
  const { isOnline } = useOnlineStatus();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cust: Customer) => {
      if (!isOnline) {
        addToPendingQueue({
          id: generateId(),
          type: "updateCustomer",
          payload: cust,
          timestamp: Date.now(),
        });
        const cached = getCache<Customer[]>("customers") ?? [];
        setCache(
          "customers",
          cached.map((c) => (c.id === cust.id ? cust : c)),
        );
        return;
      }
      if (!actor) throw new Error("No actor");
      return actor.updateCustomer(cust);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const { isOnline } = useOnlineStatus();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!isOnline) {
        addToPendingQueue({
          id: generateId(),
          type: "deleteCustomer",
          payload: id,
          timestamp: Date.now(),
        });
        const cached = getCache<Customer[]>("customers") ?? [];
        setCache(
          "customers",
          cached.filter((c) => c.id !== id),
        );
        return;
      }
      if (!actor) throw new Error("No actor");
      return actor.deleteCustomer(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useCreateBill() {
  const { actor } = useActor();
  const { isOnline } = useOnlineStatus();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bill: Bill) => {
      // 1. Always save to localStorage immediately — bill is never lost
      const cached = getCache<Bill[]>("bills") ?? [];
      // Dedup by billNumber: remove any existing entry with the same billNumber
      // (covers the case where a 0n-id placeholder was already saved)
      const deduped = cached.filter(
        (b) =>
          String(b.id) !== String(bill.id) &&
          String(b.billNumber) !== String(bill.billNumber),
      );
      const updated = [...deduped, bill];
      setCache("bills", updated);

      // 2. Immediately push to React Query cache so BillHistory shows it NOW
      qc.setQueryData<Bill[]>(["bills"], (old = []) => {
        const filtered = old.filter(
          (b) =>
            String(b.id) !== String(bill.id) &&
            String(b.billNumber) !== String(bill.billNumber),
        );
        return [...filtered, bill];
      });

      if (!isOnline || !actor) {
        addToPendingQueue({
          id: generateId(),
          type: "createBill",
          payload: bill,
          timestamp: Date.now(),
        });
        return;
      }

      try {
        // Bug 1 fix: capture the real backend-assigned ID
        const assignedId = await actor.createBill(
          bill as unknown as BackendBill,
        );
        const realId = BigInt(assignedId);

        // Update localStorage cache: replace the 0n placeholder with the real id
        const cachedNow = getCache<Bill[]>("bills") ?? [];
        const withRealId = cachedNow.map((b) =>
          String(b.billNumber) === String(bill.billNumber) && b.id === 0n
            ? { ...b, id: realId }
            : b,
        );
        setCache("bills", withRealId);

        // Update React Query cache with the real id
        qc.setQueryData<Bill[]>(["bills"], (old = []) =>
          old.map((b) =>
            String(b.billNumber) === String(bill.billNumber) && b.id === 0n
              ? { ...b, id: realId }
              : b,
          ),
        );
      } catch {
        addToPendingQueue({
          id: generateId(),
          type: "createBill",
          payload: bill,
          timestamp: Date.now(),
        });
      }
    },
    onSuccess: () => {
      // Force a full refetch so server state is reflected (e.g. real IDs assigned)
      qc.invalidateQueries({ queryKey: ["bills"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
      qc.invalidateQueries({ queryKey: ["medicines"] });
    },
  });
}

// ─── Update Bill ─────────────────────────────────────────────────────────────
export function useUpdateBill() {
  const { actor } = useActor();
  const { isOnline } = useOnlineStatus();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bill: Bill) => {
      // 1. Always persist the update locally so it survives server re-fetches
      setBillUpdate(String(bill.id), bill);

      // 2. Update the React Query cache immediately so UI reflects changes now
      qc.setQueryData<Bill[]>(["bills"], (old = []) =>
        old.map((b) => (String(b.id) === String(bill.id) ? bill : b)),
      );

      // 3. Update localStorage cache
      const cached = getCache<Bill[]>("bills") ?? [];
      const updated = cached.map((b) =>
        String(b.id) === String(bill.id) ? bill : b,
      );
      setCache("bills", updated);

      // 4. Send to backend — queue for later if offline
      if (!isOnline || !actor) {
        addToPendingQueue({
          id: generateId(),
          type: "updateBill",
          payload: bill,
          timestamp: Date.now(),
        });
        return;
      }
      try {
        await actor.updateBill(bill as unknown as BackendBill);
      } catch (e: unknown) {
        // If backend call fails, queue for retry when next online
        addToPendingQueue({
          id: generateId(),
          type: "updateBill",
          payload: bill,
          timestamp: Date.now(),
        });
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[useUpdateBill] actor.updateBill failed:", msg, e);
        // Don't rethrow — local save already succeeded; sync will retry
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
      qc.invalidateQueries({ queryKey: ["medicines"] });
    },
  });
}

// ─── Delete Bill ─────────────────────────────────────────────────────────────
export function useDeleteBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      // Persist the deletion as a local override
      addBillDeletion(String(id));
      // Also remove from cache immediately
      const cached = getCache<Bill[]>("bills") ?? [];
      setCache(
        "bills",
        cached.filter((b) => String(b.id) !== String(id)),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
      qc.invalidateQueries({ queryKey: ["medicines"] });
    },
  });
}

export function useAddDistributor() {
  const { actor } = useActor();
  const { isOnline } = useOnlineStatus();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dist: Distributor) => {
      if (!isOnline) {
        addToPendingQueue({
          id: generateId(),
          type: "addDistributor",
          payload: dist,
          timestamp: Date.now(),
        });
        const cached = getCache<Distributor[]>("distributors") ?? [];
        setCache("distributors", [...cached, dist]);
        return;
      }
      if (!actor) throw new Error("No actor");
      return actor.addDistributor(dist as unknown as BackendDistributor);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["distributors"] }),
  });
}

export function useUpdateDistributor() {
  const { actor } = useActor();
  const { isOnline } = useOnlineStatus();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dist: Distributor) => {
      if (!isOnline) {
        addToPendingQueue({
          id: generateId(),
          type: "updateDistributor",
          payload: dist,
          timestamp: Date.now(),
        });
        const cached = getCache<Distributor[]>("distributors") ?? [];
        setCache(
          "distributors",
          cached.map((d) => (d.id === dist.id ? dist : d)),
        );
        return;
      }
      if (!actor) throw new Error("No actor");
      return actor.updateDistributor(dist as unknown as BackendDistributor);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["distributors"] }),
  });
}

export function useDeleteDistributor() {
  const { actor } = useActor();
  const { isOnline } = useOnlineStatus();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!isOnline) {
        addToPendingQueue({
          id: generateId(),
          type: "deleteDistributor",
          payload: id,
          timestamp: Date.now(),
        });
        const cached = getCache<Distributor[]>("distributors") ?? [];
        setCache(
          "distributors",
          cached.filter((d) => d.id !== id),
        );
        return;
      }
      if (!actor) throw new Error("No actor");
      return actor.deleteDistributor(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["distributors"] }),
  });
}

export function useAddPurchase() {
  const { actor } = useActor();
  const { isOnline } = useOnlineStatus();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (purchase: Purchase) => {
      if (!isOnline) {
        addToPendingQueue({
          id: generateId(),
          type: "addPurchase",
          payload: purchase,
          timestamp: Date.now(),
        });
        const cached = getCache<Purchase[]>("purchases") ?? [];
        setCache("purchases", [...cached, purchase]);
        return;
      }
      if (!actor) throw new Error("No actor");
      return actor.addPurchase(purchase as unknown as BackendPurchase);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["medicines"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}
