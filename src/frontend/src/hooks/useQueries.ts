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

export { PaymentMode, Unit };
export type { Medicine, Customer, Bill, DashboardStats, Distributor, Purchase };

export function useGetDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMedicines() {
  const { actor, isFetching } = useActor();
  return useQuery<Medicine[]>({
    queryKey: ["medicines"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMedicines();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetBills() {
  const { actor, isFetching } = useActor();
  return useQuery<Bill[]>({
    queryKey: ["bills"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBills();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDistributors() {
  const { actor, isFetching } = useActor();
  return useQuery<Distributor[]>({
    queryKey: ["distributors"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDistributors();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPurchases() {
  const { actor, isFetching } = useActor();
  return useQuery<Purchase[]>({
    queryKey: ["purchases"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPurchases();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMedicine() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (med: Medicine) => {
      if (!actor) throw new Error("No actor");
      return actor.addMedicine(med);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });
}

export function useUpdateMedicine() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (med: Medicine) => {
      if (!actor) throw new Error("No actor");
      return actor.updateMedicine(med);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });
}

export function useDeleteMedicine() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteMedicine(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });
}

export function useAddCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cust: Customer) => {
      if (!actor) throw new Error("No actor");
      return actor.addCustomer(cust);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cust: Customer) => {
      if (!actor) throw new Error("No actor");
      return actor.updateCustomer(cust);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteCustomer(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useCreateBill() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bill: Bill) => {
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dist: Distributor) => {
      if (!actor) throw new Error("No actor");
      return actor.addDistributor(dist);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["distributors"] }),
  });
}

export function useUpdateDistributor() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dist: Distributor) => {
      if (!actor) throw new Error("No actor");
      return actor.updateDistributor(dist);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["distributors"] }),
  });
}

export function useDeleteDistributor() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteDistributor(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["distributors"] }),
  });
}

export function useAddPurchase() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (purchase: Purchase) => {
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
