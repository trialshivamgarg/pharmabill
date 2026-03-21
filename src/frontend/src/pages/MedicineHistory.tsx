import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { BookOpen, Package, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Medicine } from "../hooks/useQueries";
import {
  useGetBills,
  useGetCustomers,
  useGetMedicines,
} from "../hooks/useQueries";

function billNo(n: bigint) {
  return `INV-${String(Number(n)).padStart(4, "0")}`;
}
function fmtDate(ns: bigint) {
  return new Date(Number(ns) / 1_000_000).toLocaleDateString("en-IN");
}
function fmtCurrency(n: bigint | number) {
  return `\u20b9${Number(n).toLocaleString("en-IN")}`;
}

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
        data-ocid="medicine_history.dialog"
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
              data-ocid="medicine_history.empty_state"
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
                      className={`border-border ${
                        isLatest ? "bg-primary/5 font-medium" : ""
                      }`}
                      data-ocid={`medicine_history.item.${idx + 1}`}
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
                        {matchItem ? fmtCurrency(matchItem.unitPrice) : "—"}
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

export default function MedicineHistory() {
  const { data: medicines = [], isLoading } = useGetMedicines();
  const [search, setSearch] = useState("");
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return medicines;
    return medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.manufacturer?.toLowerCase().includes(q),
    );
  }, [medicines, search]);

  return (
    <div className="space-y-6" data-ocid="medicine_history.page">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Medicine History
        </h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Click any medicine to view its complete billing history
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
            All Medicines
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by medicine name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
              data-ocid="medicine_history.search_input"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {["a", "b", "c", "d", "e"].map((k) => (
                <Skeleton key={k} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-280px)]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold text-muted-foreground pl-5">
                      Medicine Name
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground">
                      Pack
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground">
                      Manufacturer
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground text-center">
                      Stock
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground text-right">
                      MRP
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground text-right pr-5">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground text-xs py-12"
                        data-ocid="medicine_history.list.empty_state"
                      >
                        {search
                          ? "No medicines found matching your search"
                          : "No medicines in inventory"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((med, idx) => (
                      <TableRow
                        key={String(med.id)}
                        className="border-border cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setSelectedMed(med)}
                        data-ocid={`medicine_history.item.${idx + 1}`}
                        title="Click to view billing history"
                      >
                        <TableCell className="pl-5 font-medium text-[13px]">
                          <div className="flex items-center gap-2">
                            <Package className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            {med.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-[12px] text-muted-foreground">
                          {med.unit || "—"}
                        </TableCell>
                        <TableCell className="text-[12px] text-muted-foreground">
                          {med.manufacturer || "—"}
                        </TableCell>
                        <TableCell className="text-center text-[12px]">
                          {String(med.currentStock)}
                        </TableCell>
                        <TableCell className="text-right text-[12px]">
                          {fmtCurrency(med.sellingPrice)}
                        </TableCell>
                        <TableCell className="text-right pr-5">
                          {med.currentStock === 0n ? (
                            <Badge
                              variant="destructive"
                              className="text-[10px]"
                            >
                              Out of Stock
                            </Badge>
                          ) : med.currentStock <= med.reorderLevel ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-amber-300 text-amber-700 bg-amber-50"
                            >
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50"
                            >
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {selectedMed && (
        <MedicineBillingHistoryDialog
          medicine={selectedMed}
          onClose={() => setSelectedMed(null)}
        />
      )}
    </div>
  );
}
