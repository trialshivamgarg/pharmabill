import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { ArrowLeftRight, Loader2, Plus, Printer, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useGetMedicines, useUpdateMedicine } from "../hooks/useQueries";
import {
  type PurchaseReturnRecord,
  addPurchaseReturn,
} from "../hooks/useReturnStore";
import { openReturnPrintWindow } from "../utils/printReturn";

interface ReturnRow {
  id: string;
  medicineName: string;
  medicineId: bigint | null;
  batchNo: string;
  expiry: string;
  currentStock: number;
  qty: number;
  purchasePrice: number;
  gstPercent: number;
  pack: string;
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
  gstPercent: 5,
  pack: "1x10",
  stockWarning: false,
});

function today() {
  return new Date().toISOString().split("T")[0];
}

function genReturnNo() {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `PR-${n}`;
}

function getPackStr(unit: string): string {
  if (unit === "strip") return "1*15";
  if (unit === "bottle") return "1*1";
  return "1x10";
}

export default function PurchaseReturn() {
  const { data: medicines = [] } = useGetMedicines();
  const updateMedicine = useUpdateMedicine();

  const [returnDate, setReturnDate] = useState(today());
  const [returnNo, setReturnNo] = useState(() => genReturnNo());
  // Distributor fields
  const [distributorFirmName, setDistributorFirmName] = useState("");
  const [distributorAddress, setDistributorAddress] = useState("");
  const [distributorGST, setDistributorGST] = useState("");
  const [distributorDLNo, setDistributorDLNo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [rows, setRows] = useState<ReturnRow[]>([newRow()]);
  const [saving, setSaving] = useState(false);
  const [searchOpen, setSearchOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const [savedRecord, setSavedRecord] = useState<PurchaseReturnRecord | null>(
    null,
  );
  const [confirmPrintOpen, setConfirmPrintOpen] = useState(false);

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
        if ("qty" in patch || "medicineId" in patch) {
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
      batchNo: (med as any)?.batchNumber ?? "",
      expiry: (med as any)?.expiryDate ?? "",
      currentStock,
      purchasePrice: Number(med?.purchasePrice ?? 0),
      gstPercent: Number(med?.gstPercent ?? 5),
      pack: getPackStr(med?.unit ?? "tablet"),
      stockWarning: qty > currentStock,
    });
    setSearchOpen(null);
    setSearchQuery("");
  };

  const filteredMeds = (q: string) =>
    medicines
      .filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 10);

  const subTotal = rows.reduce((s, r) => {
    const amt = r.purchasePrice * r.qty;
    return s + amt / (1 + r.gstPercent / 100);
  }, 0);
  const gstTotal = rows.reduce((s, r) => {
    const amt = r.purchasePrice * r.qty;
    const base = amt / (1 + r.gstPercent / 100);
    return s + (amt - base);
  }, 0);
  const grandTotal = rows.reduce((s, r) => s + r.purchasePrice * r.qty, 0);

  const handleSave = async () => {
    const validRows = rows.filter((r) => r.medicineName && r.qty > 0);
    if (validRows.length === 0) {
      toast.error("Add at least one medicine with qty > 0");
      return;
    }
    setSaving(true);
    try {
      for (const row of validRows) {
        const med = medicines.find((m) => m.id === row.medicineId);
        if (med) {
          const newStock = med.currentStock - BigInt(row.qty);
          await updateMedicine.mutateAsync({
            ...med,
            currentStock: newStock < 0n ? 0n : newStock,
          });
        }
      }

      const record: PurchaseReturnRecord = {
        id: crypto.randomUUID(),
        returnNo,
        returnDate,
        distributorFirmName,
        distributorAddress,
        distributorGST,
        distributorDLNo,
        remarks,
        items: validRows.map((r) => ({
          id: r.id,
          medicineName: r.medicineName,
          medicineId: String(r.medicineId ?? ""),
          batchNo: r.batchNo,
          expiry: r.expiry,
          qty: r.qty,
          mrp: r.purchasePrice,
          gstPercent: r.gstPercent,
          pack: r.pack,
        })),
        subtotal: subTotal,
        totalGST: gstTotal,
        grandTotal,
        createdAt: Date.now(),
      };

      addPurchaseReturn(record);
      setSavedRecord(record);
      setConfirmPrintOpen(true);
      toast.success("Purchase Return saved. Stock updated.");

      setReturnNo(genReturnNo());
      setReturnDate(today());
      setDistributorFirmName("");
      setDistributorAddress("");
      setDistributorGST("");
      setDistributorDLNo("");
      setRemarks("");
      setRows([newRow()]);
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
            Return medicines to distributor — stock will decrease
          </p>
        </div>
      </div>

      {/* Return + Distributor Details */}
      <Card className="shadow-card">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
            Return &amp; Distributor Details
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              <Label className="text-xs">Distributor Firm Name</Label>
              <Input
                data-ocid="purchase_return.firm_name.input"
                className="mt-1 h-8 text-sm"
                value={distributorFirmName}
                onChange={(e) => setDistributorFirmName(e.target.value)}
                placeholder="Firm / Company name"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Distributor Address</Label>
              <Input
                data-ocid="purchase_return.address.input"
                className="mt-1 h-8 text-sm"
                value={distributorAddress}
                onChange={(e) => setDistributorAddress(e.target.value)}
                placeholder="Address"
              />
            </div>
            <div>
              <Label className="text-xs">Distributor GST No.</Label>
              <Input
                data-ocid="purchase_return.gst_no.input"
                className="mt-1 h-8 text-sm"
                value={distributorGST}
                onChange={(e) => setDistributorGST(e.target.value)}
                placeholder="GST number"
              />
            </div>
            <div>
              <Label className="text-xs">Distributor DL No.</Label>
              <Input
                data-ocid="purchase_return.dl_no.input"
                className="mt-1 h-8 text-sm"
                value={distributorDLNo}
                onChange={(e) => setDistributorDLNo(e.target.value)}
                placeholder="Drug license number"
              />
            </div>
            <div>
              <Label className="text-xs">Remarks / Reason</Label>
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
              Return Items
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  {[
                    "#",
                    "Medicine Name",
                    "Batch No",
                    "Expiry",
                    "Stock",
                    "Qty",
                    "Price (₹)",
                    "GST%",
                    "Amount",
                    "",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="text-[11px] font-semibold text-muted-foreground first:pl-5 last:pr-5"
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
                    className="border-border"
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
                          placeholder="Search medicine..."
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
                          <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white border border-border rounded shadow-xl max-h-48 overflow-y-auto">
                            {filteredMeds(searchQuery).length === 0 ? (
                              <div className="text-xs text-muted-foreground p-3">
                                No medicines found
                              </div>
                            ) : (
                              filteredMeds(searchQuery).map((m) => (
                                <button
                                  key={String(m.id)}
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-accent border-b border-border/40 last:border-0"
                                  onMouseDown={() =>
                                    selectMedicine(row.id, m.name)
                                  }
                                >
                                  <span className="font-medium">{m.name}</span>
                                  <span className="text-muted-foreground ml-2">
                                    Stock: {String(m.currentStock)}
                                  </span>
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
                    <TableCell className="text-muted-foreground text-xs">
                      {row.currentStock}
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <Input
                          type="number"
                          min="1"
                          className={`h-7 text-xs w-16 ${row.stockWarning ? "border-destructive" : ""}`}
                          value={row.qty}
                          onChange={(e) =>
                            updateRow(row.id, {
                              qty: Number(e.target.value) || 1,
                            })
                          }
                        />
                        {row.stockWarning && (
                          <div className="text-[10px] text-destructive mt-0.5">
                            Exceeds stock
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        className="h-7 text-xs w-20"
                        value={row.purchasePrice}
                        onChange={(e) =>
                          updateRow(row.id, {
                            purchasePrice: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {row.gstPercent}%
                    </TableCell>
                    <TableCell className="font-semibold text-xs">
                      {(row.purchasePrice * row.qty).toFixed(2)}
                    </TableCell>
                    <TableCell className="pr-5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={() =>
                          setRows((r) => r.filter((x) => x.id !== row.id))
                        }
                        data-ocid={`purchase_return.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Totals + Save */}
      <Card className="shadow-card">
        <CardContent className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-sm">
              <div className="flex gap-8">
                <span className="text-muted-foreground">Sub Total:</span>
                <span>₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex gap-8">
                <span className="text-muted-foreground">GST:</span>
                <span>₹{gstTotal.toFixed(2)}</span>
              </div>
              <div className="flex gap-8 font-bold text-base">
                <span>Grand Total:</span>
                <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {savedRecord && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => openReturnPrintWindow(savedRecord, "purchase")}
                  data-ocid="purchase_return.print.button"
                >
                  <Printer className="h-4 w-4" /> Print Last
                </Button>
              )}
              <Button
                className="gap-2"
                onClick={handleSave}
                disabled={saving}
                data-ocid="purchase_return.submit_button"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowLeftRight className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save Return"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print confirmation */}
      <AlertDialog open={confirmPrintOpen} onOpenChange={setConfirmPrintOpen}>
        <AlertDialogContent data-ocid="purchase_return.print_confirm.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Return Saved Successfully</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to print the return slip?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="purchase_return.print_confirm_cancel.button">
              Not Now
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="purchase_return.print_confirm_ok.button"
              onClick={() => {
                if (savedRecord) openReturnPrintWindow(savedRecord, "purchase");
              }}
            >
              <Printer className="h-4 w-4 mr-2" /> Print
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
