import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeftRight, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useGetMedicines, useUpdateMedicine } from "../hooks/useQueries";

type Mode = "linked" | "independent";

interface ReturnRow {
  id: string;
  medicineName: string;
  medicineId: bigint | null;
  batchNo: string;
  expiry: string;
  currentStock: number;
  qty: number;
  purchasePrice: number;
  stockWarning: boolean;
}

const newRow = (): ReturnRow => ({
  id: crypto.randomUUID(),
  medicineName: "",
  medicineId: null,
  batchNo: "",
  expiry: "",
  currentStock: 0,
  qty: 1,
  purchasePrice: 0,
  stockWarning: false,
});

function today() {
  return new Date().toISOString().split("T")[0];
}

function genReturnNo() {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `PR-${n}`;
}

export default function PurchaseReturn() {
  const { data: medicines = [] } = useGetMedicines();
  const updateMedicine = useUpdateMedicine();

  const [mode, setMode] = useState<Mode>("linked");
  const [returnDate, setReturnDate] = useState(today());
  const [returnNo, setReturnNo] = useState(() => genReturnNo());
  const [supplierName, setSupplierName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [rows, setRows] = useState<ReturnRow[]>([newRow()]);
  const [saving, setSaving] = useState(false);
  const [searchOpen, setSearchOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(null);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const updateRow = (id: string, patch: Partial<ReturnRow>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...patch };
        if (mode === "linked" && ("qty" in patch || "medicineId" in patch)) {
          updated.stockWarning = updated.qty > updated.currentStock;
        }
        return updated;
      }),
    );
  };

  const selectMedicine = (rowId: string, medName: string) => {
    const med = medicines.find(
      (m) => m.name.toLowerCase() === medName.toLowerCase(),
    );
    const currentStock = Number(med?.currentStock ?? 0);
    const qty = rows.find((r) => r.id === rowId)?.qty ?? 1;
    updateRow(rowId, {
      medicineName: medName,
      medicineId: med?.id ?? null,
      batchNo: med?.batchNumber ?? "",
      expiry: med?.expiryDate ?? "",
      currentStock,
      purchasePrice: Number(med?.purchasePrice ?? 0),
      stockWarning: mode === "linked" ? qty > currentStock : false,
    });
    setSearchOpen(null);
    setSearchQuery("");
  };

  const filteredMeds = (q: string) =>
    medicines
      .filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 8);

  const grandTotal = rows.reduce((s, r) => s + r.purchasePrice * r.qty, 0);

  const resetForm = () => {
    setReturnNo(genReturnNo());
    setReturnDate(today());
    setSupplierName("");
    setRemarks("");
    setRows([newRow()]);
  };

  const handleSave = async () => {
    const validRows = rows.filter((r) => r.medicineName && r.qty > 0);
    if (validRows.length === 0) {
      toast.error("Add at least one medicine with qty > 0");
      return;
    }
    setSaving(true);
    try {
      for (const row of validRows) {
        if (mode === "linked") {
          const med = medicines.find((m) => m.id === row.medicineId);
          if (med) {
            const newStock = med.currentStock - BigInt(row.qty);
            await updateMedicine.mutateAsync({
              ...med,
              currentStock: newStock < 0n ? 0n : newStock,
            });
          }
        } else {
          // Independent mode: try to find by name
          const med = medicines.find(
            (m) => m.name.toLowerCase() === row.medicineName.toLowerCase(),
          );
          if (med) {
            const newStock = med.currentStock - BigInt(row.qty);
            await updateMedicine.mutateAsync({
              ...med,
              currentStock: newStock < 0n ? 0n : newStock,
            });
          }
        }
      }
      toast.success("Purchase Return saved. Stock updated.");
      resetForm();
    } catch (e: any) {
      toast.error(e?.message ?? "Error saving return");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5" data-ocid="purchase_return.page">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-100">
          <ArrowLeftRight className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Purchase Return</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Return medicines to supplier — stock will decrease
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div
        className="flex items-center gap-2"
        data-ocid="purchase_return.mode.toggle"
      >
        <button
          type="button"
          onClick={() => setMode("linked")}
          className={`px-4 py-1.5 rounded text-xs font-medium border transition-colors ${
            mode === "linked"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-muted-foreground hover:bg-accent"
          }`}
          data-ocid="purchase_return.linked.toggle"
        >
          Link to Stock Entry
        </button>
        <button
          type="button"
          onClick={() => setMode("independent")}
          className={`px-4 py-1.5 rounded text-xs font-medium border transition-colors ${
            mode === "independent"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-muted-foreground hover:bg-accent"
          }`}
          data-ocid="purchase_return.independent.toggle"
        >
          Independent Entry
        </button>
      </div>

      {/* Common Fields */}
      <Card className="shadow-card">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
            Return Details
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs">Return No</Label>
              <Input
                data-ocid="purchase_return.return_no.input"
                className="mt-1 h-8 text-sm"
                value={returnNo}
                onChange={(e) => setReturnNo(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Return Date</Label>
              <Input
                data-ocid="purchase_return.date.input"
                type="date"
                className="mt-1 h-8 text-sm"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Supplier Name</Label>
              <Input
                data-ocid="purchase_return.supplier.input"
                className="mt-1 h-8 text-sm"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Supplier / Distributor"
              />
            </div>
            <div>
              <Label className="text-xs">Remarks</Label>
              <Input
                data-ocid="purchase_return.remarks.input"
                className="mt-1 h-8 text-sm"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason for return"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medicine Rows */}
      <Card className="shadow-card">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              {mode === "linked"
                ? "Medicines (Linked to Stock)"
                : "Medicines (Independent Entry)"}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setRows((r) => [...r, newRow()])}
              data-ocid="purchase_return.add_row.button"
            >
              <Plus className="h-3 w-3" /> Add Row
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table data-ocid="purchase_return.table">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                {[
                  "#",
                  "Medicine Name",
                  "Batch No",
                  "Expiry",
                  mode === "linked" ? "Current Stock" : "",
                  "Qty",
                  "Purchase Price (₹)",
                  "Amount (₹)",
                  "",
                ]
                  .filter(Boolean)
                  .map((h) => (
                    <TableHead
                      key={h || "empty"}
                      className="text-[11px] font-semibold text-muted-foreground first:pl-5 last:pr-5 last:w-10"
                    >
                      {h}
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  className={`border-border ${row.stockWarning ? "bg-amber-50" : ""}`}
                  data-ocid={`purchase_return.item.${idx + 1}`}
                >
                  <TableCell className="pl-5 text-muted-foreground text-xs w-8">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="min-w-[180px]">
                    <div
                      className="relative"
                      ref={searchOpen === row.id ? searchRef : undefined}
                    >
                      <Input
                        className="h-7 text-xs"
                        value={row.medicineName}
                        placeholder={
                          mode === "linked"
                            ? "Search inventory..."
                            : "Medicine name"
                        }
                        onChange={(e) => {
                          updateRow(row.id, {
                            medicineName: e.target.value,
                            medicineId: null,
                          });
                          setSearchQuery(e.target.value);
                          setSearchOpen(row.id);
                        }}
                        onFocus={() => {
                          setSearchOpen(row.id);
                          setSearchQuery(row.medicineName);
                        }}
                      />
                      {searchOpen === row.id && searchQuery.length > 0 && (
                        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white border border-border rounded shadow-lg max-h-40 overflow-y-auto">
                          {filteredMeds(searchQuery).length === 0 ? (
                            <div className="text-xs text-muted-foreground p-2">
                              No medicines found
                            </div>
                          ) : (
                            filteredMeds(searchQuery).map((m) => (
                              <button
                                key={String(m.id)}
                                type="button"
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent"
                                onMouseDown={() =>
                                  selectMedicine(row.id, m.name)
                                }
                              >
                                <span>{m.name}</span>
                                {mode === "linked" && (
                                  <span className="ml-2 text-muted-foreground">
                                    Stock: {String(m.currentStock)}
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-7 text-xs w-24"
                      value={row.batchNo}
                      onChange={(e) =>
                        updateRow(row.id, { batchNo: e.target.value })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="month"
                      className="h-7 text-xs w-28"
                      value={row.expiry}
                      onChange={(e) =>
                        updateRow(row.id, { expiry: e.target.value })
                      }
                    />
                  </TableCell>
                  {mode === "linked" && (
                    <TableCell className="text-xs text-muted-foreground">
                      {row.currentStock}
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <Input
                        type="number"
                        min="1"
                        className={`h-7 text-xs w-16 ${row.stockWarning ? "border-amber-400" : ""}`}
                        value={row.qty}
                        onChange={(e) =>
                          updateRow(row.id, {
                            qty: Number(e.target.value) || 1,
                          })
                        }
                      />
                      {row.stockWarning && (
                        <p className="text-[10px] text-amber-600 mt-0.5">
                          Exceeds stock
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-7 text-xs w-24"
                      value={row.purchasePrice}
                      onChange={(e) =>
                        updateRow(row.id, {
                          purchasePrice: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    ₹{(row.purchasePrice * row.qty).toFixed(2)}
                  </TableCell>
                  <TableCell className="pr-5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() =>
                        setRows((r) => r.filter((x) => x.id !== row.id))
                      }
                      disabled={rows.length === 1}
                      data-ocid={`purchase_return.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="flex justify-end">
        <Card className="shadow-card w-56">
          <CardContent className="p-4">
            <div className="flex justify-between text-sm font-bold">
              <span>Grand Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
          data-ocid="purchase_return.submit_button"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowLeftRight className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Purchase Return"}
        </Button>
      </div>
    </div>
  );
}
