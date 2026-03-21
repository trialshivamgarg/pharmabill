import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeftRight,
  Clock,
  Database,
  FileText,
  IndianRupee,
  Package,
  RotateCcw,
  ShoppingCart,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Medicine } from "../hooks/useQueries";
import {
  useGetBills,
  useGetCustomers,
  useGetDashboardStats,
  useGetMedicines,
} from "../hooks/useQueries";

function fmt(n: bigint | undefined) {
  return n !== undefined ? Number(n).toLocaleString("en-IN") : "0";
}
function fmtCurrency(n: bigint | undefined) {
  return `\u20b9${fmt(n)}`;
}
function fmtDate(ns: bigint) {
  return new Date(Number(ns) / 1_000_000).toLocaleDateString("en-IN");
}
function billNo(n: bigint) {
  return `INV-${String(Number(n)).padStart(4, "0")}`;
}

const KPI_CARDS = [
  {
    key: "todayTotalSales",
    label: "Today's Sales",
    icon: IndianRupee,
    currency: true,
    color: "text-primary",
  },
  {
    key: "todayBillCount",
    label: "Today's Bills",
    icon: FileText,
    currency: false,
    color: "text-blue-600",
  },
  {
    key: "totalMedicinesInStock",
    label: "Total Stock Items",
    icon: Package,
    currency: false,
    color: "text-emerald-600",
  },
  {
    key: "lowStockMedicinesCount",
    label: "Low Stock Alerts",
    icon: AlertTriangle,
    currency: false,
    color: "text-amber-600",
  },
];

const QUICK_ACTIONS = [
  {
    label: "New Bill",
    description: "Create a new patient invoice",
    icon: FileText,
    to: "/new-bill",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100 hover:border-blue-300",
  },
  {
    label: "New Purchase",
    description: "Record stock from distributor",
    icon: ShoppingCart,
    to: "/purchase-entry",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100 hover:border-indigo-300",
  },
  {
    label: "Add Medicine",
    description: "Add or update inventory stock",
    icon: Package,
    to: "/inventory",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100 hover:border-emerald-300",
  },
  {
    label: "Sales Return",
    description: "Record customer medicine returns",
    icon: RotateCcw,
    to: "/sales-return",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100 hover:border-amber-300",
  },
  {
    label: "Purchase Return",
    description: "Return medicines to supplier",
    icon: ArrowLeftRight,
    to: "/purchase-return",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100 hover:border-purple-300",
  },
  {
    label: "Backup Data",
    description: "Export all pharmacy data",
    icon: Database,
    to: "/backup-restore",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100 hover:border-teal-300",
  },
  {
    label: "Restore Data",
    description: "Import from a backup file",
    icon: Upload,
    to: "/backup-restore",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100 hover:border-rose-300",
  },
];

function MedicineBillingHistoryDialog({
  medicine,
  onClose,
}: {
  medicine: Medicine;
  onClose: () => void;
}) {
  const { data: bills = [] } = useGetBills();
  const { data: customers = [] } = useGetCustomers();

  const custMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of customers) m[String(c.id)] = c.name;
    return m;
  }, [customers]);

  const relevantBills = useMemo(() => {
    return bills
      .filter((b) =>
        b.items.some((item) => String(item.medicineId) === String(medicine.id)),
      )
      .sort((a, b) => Number(b.billDate - a.billDate));
  }, [bills, medicine.id]);

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-2xl"
        data-ocid="dashboard.medicine_history.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            {medicine.name} — Billing History
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          {relevantBills.length === 0 ? (
            <div
              className="text-center text-muted-foreground text-sm py-10"
              data-ocid="dashboard.medicine_history.empty_state"
            >
              This medicine has not been billed yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Invoice No
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">
                    Patient
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-center">
                    Qty
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                    Rate (MRP)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relevantBills.map((bill, idx) => {
                  const matchItem = bill.items.find(
                    (item) => String(item.medicineId) === String(medicine.id),
                  );
                  const isLatest = idx === 0;
                  return (
                    <TableRow
                      key={String(bill.id)}
                      className={`border-border ${isLatest ? "bg-primary/5 font-medium" : ""}`}
                      data-ocid={`dashboard.medicine_history.item.${idx + 1}`}
                    >
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isLatest ? "default" : "outline"}
                            className="text-[10px]"
                          >
                            {billNo(bill.billNumber)}
                          </Badge>
                          {isLatest && (
                            <span className="text-[10px] text-primary font-semibold">
                              Latest
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDate(bill.billDate)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {custMap[String(bill.customerId)] ?? "Walk-in"}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {matchItem ? String(matchItem.quantity) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {matchItem
                          ? `\u20b9${String(matchItem.unitPrice)}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: bills, isLoading: billsLoading } = useGetBills();
  const { data: medicines, isLoading: medsLoading } = useGetMedicines();
  const navigate = useNavigate();
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);

  const recentBills = [...(bills ?? [])]
    .sort((a, b) => Number(b.billDate - a.billDate))
    .slice(0, 6);
  const lowStockMeds = (medicines ?? [])
    .filter((m) => m.currentStock <= m.reorderLevel && m.currentStock > 0n)
    .slice(0, 6);
  const outOfStockMeds = (medicines ?? []).filter((m) => m.currentStock === 0n);

  return (
    <div className="space-y-6" data-ocid="dashboard.page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Welcome back — here's your pharmacy overview
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => {
          const val = stats?.[kpi.key as keyof typeof stats] as
            | bigint
            | undefined;
          return (
            <Card
              key={kpi.key}
              className="shadow-card border-border"
              data-ocid={`dashboard.${kpi.key}.card`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {kpi.label}
                    </p>
                    {statsLoading ? (
                      <Skeleton className="h-7 w-20 mt-2" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {kpi.currency ? fmtCurrency(val) : fmt(val)}
                      </p>
                    )}
                  </div>
                  <div className={`p-2 rounded-lg bg-accent ${kpi.color}`}>
                    <kpi.icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div data-ocid="dashboard.quick_actions.section">
        <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => navigate({ to: action.to })}
              className={`flex items-center gap-3 p-4 rounded-lg border bg-white transition-all hover:shadow-md cursor-pointer text-left ${action.border}`}
              data-ocid={`dashboard.${action.label.toLowerCase().replace(/ /g, "_")}.button`}
            >
              <div className={`p-2 rounded-lg ${action.bg} flex-shrink-0`}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {action.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="shadow-card" data-ocid="dashboard.recent_bills.card">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> Recent Bills
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {billsLoading ? (
              <div className="p-4 space-y-2">
                {["a", "b", "c", "d"].map((k) => (
                  <Skeleton key={k} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold text-muted-foreground pl-5">
                      Bill No
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground">
                      Date
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground">
                      Payment
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground text-right pr-5">
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBills.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground text-xs py-8"
                        data-ocid="dashboard.recent_bills.empty_state"
                      >
                        No bills yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentBills.map((bill, idx) => (
                      <TableRow
                        key={String(bill.id)}
                        className="border-border"
                        data-ocid={`dashboard.recent_bills.item.${idx + 1}`}
                      >
                        <TableCell className="pl-5 font-medium text-[13px]">
                          {billNo(bill.billNumber)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[12px]">
                          {fmtDate(bill.billDate)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[10px] capitalize"
                          >
                            {bill.paymentMode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-5 font-semibold">
                          {fmtCurrency(bill.grandTotal)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card" data-ocid="dashboard.low_stock.card">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Low Stock
              / Out of Stock
              {outOfStockMeds.length > 0 && (
                <Badge className="ml-auto bg-destructive/10 text-destructive text-[10px]">
                  {outOfStockMeds.length} out of stock
                </Badge>
              )}
            </CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Click a medicine to see its billing history
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {medsLoading ? (
              <div className="p-4 space-y-2">
                {["a", "b", "c", "d"].map((k) => (
                  <Skeleton key={k} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold text-muted-foreground pl-5">
                      Medicine
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground">
                      Stock
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground">
                      Reorder
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground text-right pr-5">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockMeds.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground text-xs py-8"
                        data-ocid="dashboard.low_stock.empty_state"
                      >
                        All medicines adequately stocked
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStockMeds.map((med, idx) => (
                      <TableRow
                        key={String(med.id)}
                        className="border-border cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setSelectedMed(med)}
                        data-ocid={`dashboard.low_stock.item.${idx + 1}`}
                        title="Click to view billing history"
                      >
                        <TableCell className="pl-5 font-medium text-[13px]">
                          {med.name}
                        </TableCell>
                        <TableCell className="text-[12px]">
                          {String(med.currentStock)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[12px]">
                          {String(med.reorderLevel)}
                        </TableCell>
                        <TableCell className="text-right pr-5">
                          {med.currentStock === 0n ? (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                background: "oklch(var(--danger-bg))",
                                color: "oklch(var(--danger-text))",
                              }}
                            >
                              Out of Stock
                            </span>
                          ) : (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                background: "oklch(var(--warning-bg))",
                                color: "oklch(var(--warning-text))",
                              }}
                            >
                              Low Stock
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedMed && (
        <MedicineBillingHistoryDialog
          medicine={selectedMed}
          onClose={() => setSelectedMed(null)}
        />
      )}
    </div>
  );
}
