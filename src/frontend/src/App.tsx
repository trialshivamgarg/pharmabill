import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import Layout from "./components/Layout";
import { useActor } from "./hooks/useActor";
import { useSyncPending } from "./hooks/useSyncPending";
import BackupRestore from "./pages/BackupRestore";
import BillHistory from "./pages/BillHistory";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import Distributors from "./pages/Distributors";
import Inventory from "./pages/Inventory";
import MedicineHistory from "./pages/MedicineHistory";
import NewBill from "./pages/NewBill";
import PharmacyProfile from "./pages/PharmacyProfile";
import PurchaseEntry from "./pages/PurchaseEntry";
import PurchaseHistory from "./pages/PurchaseHistory";
import PurchaseReturn from "./pages/PurchaseReturn";
import PurchaseReturnHistory from "./pages/PurchaseReturnHistory";
import Reports from "./pages/Reports";
import SalesReturn from "./pages/SalesReturn";
import SalesReturnHistory from "./pages/SalesReturnHistory";

/** Customers from imported PDFs that must exist in the backend canister. */
const SEED_CUSTOMERS = [
  {
    id: 0n,
    name: "MR VIKAS BABU VARSHNEY",
    phone: "8285995452",
    address: "",
    email: "",
  },
  {
    id: 0n,
    name: "SARASWATI VEERWATI",
    phone: "8285995452",
    address: "",
    email: "",
  },
  {
    id: 0n,
    name: "RADHEY MEDICOS",
    phone: "9971012696",
    address: "",
    email: "",
  },
  { id: 0n, name: "CASH CUSTOMER", phone: "", address: "", email: "" },
];

/**
 * Silently seeds the required customers directly into the backend canister on
 * every app load. Checks the canister first — only adds missing customers.
 * No localStorage flag used: always verifies against live backend state so
 * the seed reliably works on every device including the installed PWA.
 */
function SeedBackendCustomers() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    // Reset guard whenever actor becomes unavailable so we retry on reconnect
    if (isFetching || !actor) {
      hasRun.current = false;
      return;
    }
    if (hasRun.current) return;
    hasRun.current = true;

    (async () => {
      try {
        const existing = await actor.getAllCustomers();
        const existingNames = new Set(
          existing.map((c: { name: string }) => c.name.trim().toUpperCase()),
        );

        let addedAny = false;
        for (const cust of SEED_CUSTOMERS) {
          if (!existingNames.has(cust.name.trim().toUpperCase())) {
            try {
              await actor.addCustomer(cust);
              addedAny = true;
            } catch (err) {
              console.error(
                "[SeedBackendCustomers] Failed to add customer:",
                cust.name,
                err,
              );
            }
          }
        }

        // Always invalidate so the UI fetches the latest list from the backend
        // This ensures newly seeded customers (or pre-existing ones) all appear
        await queryClient.invalidateQueries({ queryKey: ["customers"] });

        if (addedAny) {
          console.log(
            "[SeedBackendCustomers] Seeded missing customers to backend canister.",
          );
        }
      } catch (err) {
        console.error(
          "[SeedBackendCustomers] Failed to read existing customers:",
          err,
        );
        // Reset so we retry on next render cycle when actor is ready
        hasRun.current = false;
      }
    })();
  }, [actor, isFetching, queryClient]);

  return null;
}

/** Mounts useSyncPending at the app root so offline-queued mutations always
 *  sync to the backend as soon as internet is restored. */
function SyncPendingBills() {
  useSyncPending();
  return null;
}

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <SeedBackendCustomers />
      <SyncPendingBills />
      <Outlet />
      <Toaster richColors position="top-right" />
    </Layout>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});
const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inventory",
  component: Inventory,
});
const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers",
  component: Customers,
});
const newBillRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/new-bill",
  component: NewBill,
});
const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: BillHistory,
});
const medicineHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/medicine-history",
  component: MedicineHistory,
});
const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: Reports,
});
const salesReturnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sales-return",
  component: SalesReturn,
});
const purchaseReturnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/purchase-return",
  component: PurchaseReturn,
});
const distributorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/distributors",
  component: Distributors,
});
const purchaseEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/purchase-entry",
  component: PurchaseEntry,
});
const pharmacyProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pharmacy-profile",
  component: PharmacyProfile,
});
const purchaseHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/purchase-history",
  component: PurchaseHistory,
});
const backupRestoreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/backup-restore",
  component: BackupRestore,
});
const salesReturnHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sales-return-history",
  component: SalesReturnHistory,
});
const purchaseReturnHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/purchase-return-history",
  component: PurchaseReturnHistory,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  inventoryRoute,
  customersRoute,
  newBillRoute,
  historyRoute,
  medicineHistoryRoute,
  reportsRoute,
  salesReturnRoute,
  salesReturnHistoryRoute,
  purchaseReturnRoute,
  purchaseReturnHistoryRoute,
  distributorsRoute,
  purchaseEntryRoute,
  purchaseHistoryRoute,
  pharmacyProfileRoute,
  backupRestoreRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
