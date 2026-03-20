import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import BackupRestore from "./pages/BackupRestore";
import BillHistory from "./pages/BillHistory";
import Customers from "./pages/Customers";
import Dashboard from "./pages/Dashboard";
import Distributors from "./pages/Distributors";
import Inventory from "./pages/Inventory";
import NewBill from "./pages/NewBill";
import PharmacyProfile from "./pages/PharmacyProfile";
import PurchaseEntry from "./pages/PurchaseEntry";
import PurchaseHistory from "./pages/PurchaseHistory";
import PurchaseReturn from "./pages/PurchaseReturn";
import Reports from "./pages/Reports";
import SalesReturn from "./pages/SalesReturn";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
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

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  inventoryRoute,
  customersRoute,
  newBillRoute,
  historyRoute,
  reportsRoute,
  salesReturnRoute,
  purchaseReturnRoute,
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
