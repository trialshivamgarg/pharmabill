import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Bill,
  Customer,
  DashboardStats,
  Distributor,
  Medicine,
  Purchase,
} from "../backend.d";
import { PaymentMode, Unit } from "../backend.d";
import { useActor } from "./useActor";
import { addToPendingQueue, getCache, setCache } from "./useOfflineStore";
import { useOnlineStatus } from "./useOnlineStatus";

export { PaymentMode, Unit };
export type { Medicine, Customer, Bill, DashboardStats, Distributor, Purchase };

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useGetDashboardStats() {
  const { actor, isFetching } = useActor();
  const { isOnline } = useOnlineStatus();
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!isOnline) {
        const cached = getCache<DashboardStats>("bills");
        // Build a minimal stats object from cached bills if available
        return {
          totalBills: BigInt(Array.isArray(cached) ? cached.length : 0),
          totalRevenue: 0,
          totalMedicines: BigInt(0),
          lowStockCount: BigInt(0),
          todayBills: BigInt(0),
          todayRevenue: 0,
        } as unknown as DashboardStats;
      }
      try {
        if (!actor) throw new Error("No actor");
        const result = await actor.getDashboardStats();
        return result;
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
        setCache("customers", result);
        return result;
      } catch {
        return getCache<Customer[]>("customers") ?? [];
      }
    },
    enabled: !isOnline || (!!actor && !isFetching),
  });
}

export function useGetBills() {
  const { actor, isFetching } = useActor();
  const { isOnline } = useOnlineStatus();
  return useQuery<Bill[]>({
    queryKey: ["bills"],
    queryFn: async () => {
      if (!isOnline) {
        return getCache<Bill[]>("bills") ?? [];
      }
      try {
        if (!actor) return getCache<Bill[]>("bills") ?? [];
        const result = await actor.getAllBills();
        setCache("bills", result);
        return result;
      } catch {
        return getCache<Bill[]>("bills") ?? [];
      }
    },
    enabled: !isOnline || (!!actor && !isFetching),
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

export function useAddMedicine() {
  const { actor } = useActor();
  const { isOnline } = useOnlineStatus();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (med: Medicine) => {
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
      return actor.addMedicine(med);
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
      return actor.updateMedicine(med);
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
      if (!isOnline) {
        addToPendingQueue({
          id: generateId(),
          type: "createBill",
          payload: bill,
          timestamp: Date.now(),
        });
        const cached = getCache<Bill[]>("bills") ?? [];
        setCache("bills", [...cached, bill]);
        return;
      }
      if (!actor) throw new Error("No actor");
      return actor.createBill(bill);
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
      return actor.addDistributor(dist);
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
      return actor.updateDistributor(dist);
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
      return actor.addPurchase(purchase);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["medicines"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}
