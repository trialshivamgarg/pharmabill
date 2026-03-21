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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Printer, RotateCcw, Trash2, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useGetBills,
  useGetCustomers,
  useGetMedicines,
  useUpdateMedicine,
} from "../hooks/useQueries";
import {
  type SalesReturnRecord,
  addSalesReturn,
} from "../hooks/useReturnStore";
import { openReturnPrintWindow } from "../utils/printReturn";

interface ReturnRow {
  id: string;
  medicineName: string;
  medicineId: bigint | null;
  batchNo: string;
  expiry: string;
  qty: number;
  mrp: number;
  gstPercent: number;
  pack: string;
}

const newRow = (): ReturnRow => ({
  id: crypto.randomUUID(),
  medicineName: "",
  medicineId: null,
  batchNo: "",
  expiry: "",
  qty: 1,
  mrp: 0,
  gstPercent: 5,
  pack: "1x10",
});

function today() {
  return new Date().toISOString().split("T")[0];
}

function genReturnNo(prefix: string) {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${n}`;
}

function getPackStr(unit: string): string {
  if (unit === "strip") return "1*15";
  if (unit === "bottle") return "1*1";
  return "1x10";
}

export default function SalesReturn() {
  const { data: medicines = [] } = useGetMedicines();
  const { data: customers = [] } = useGetCustomers();
  const { data: allBills = [] } = useGetBills();
  const updateMedicine = useUpdateMedicine();

  const [returnDate, setReturnDate] = useState(today());
  const [returnNo, setReturnNo] = useState(() => genReturnNo("SR"));
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [rows, setRows] = useState<ReturnRow[]>([newRow()]);
  const [saving, setSaving] = useState(false);
  const [searchOpen, setSearchOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const [savedRecord, setSavedRecord] = useState<SalesReturnRecord | null>(
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
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const selectMedicine = (rowId: string, medName: string) => {
    const med = medicines.find(
      (m) => m.name.toLowerCase() === medName.toLowerCase(),
    );
    updateRow(rowId, {
      medicineName: medName,
      medicineId: med?.id ?? null,
      batchNo: (med as any)?.batchNumber ?? "",
      expiry: (med as any)?.expiryDate ?? "",
      mrp: Number(med?.sellingPrice ?? 0),
      gstPercent: Number(med?.gstPercent ?? 5),
      pack: getPackStr(med?.unit ?? "tablet"),
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
    const amt = r.mrp * r.qty;
    return s + amt / (1 + r.gstPercent / 100);
  }, 0);
  const gstTotal = rows.reduce((s, r) => {
    const amt = r.mrp * r.qty;
    const base = amt / (1 + r.gstPercent / 100);
    return s + (amt - base);
  }, 0);
  const grandTotal = rows.reduce((s, r) => s + r.mrp * r.qty, 0);

  // Customer purchase history
  const customerHistory = useMemo(() => {
    if (patientName.length < 2) return [];
    const lower = patientName.toLowerCase();
    const matchedCustomers = customers.filter((c) =>
      c.name.toLowerCase().includes(lower),
    );
    const matchedIds = new Set(matchedCustomers.map((c) => String(c.id)));
    return allBills
      .filter((b) => matchedIds.has(String(b.customerId)))
      .sort((a, b) => Number(b.billDate - a.billDate))
      .slice(0, 20);
  }, [patientName, customers, allBills]);

  const medMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const med of medicines) m[String(med.id)] = med.name;
    return m;
  }, [medicines]);

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
          await updateMedicine.mutateAsync({
            ...med,
            currentStock: med.currentStock + BigInt(row.qty),
          });
        }
      }

      const record: SalesReturnRecord = {
        id: crypto.randomUUID(),
        returnNo,
        returnDate,
        patientName,
        phone,
        doctorName,
        doctorRegNo,
        remarks,
        items: validRows.map((r) => ({
          id: r.id,
          medicineName: r.medicineName,
          medicineId: String(r.medicineId ?? ""),
          batchNo: r.batchNo,
          expiry: r.expiry,
          qty: r.qty,
          mrp: r.mrp,
          gstPercent: r.gstPercent,
          pack: r.pack,
        })),
        subtotal: subTotal,
        totalGST: gstTotal,
        grandTotal,
        createdAt: Date.now(),
      };

      addSalesReturn(record);
      setSavedRecord(record);
      setConfirmPrintOpen(true);
      toast.success("Sales Return saved. Stock updated.");

      setReturnNo(genReturnNo("SR"));
      setReturnDate(today());
      setPatientName("");
      setPhone("");
      setDoctorName("");
      setDoctorRegNo("");
      setRemarks("");
      setRows([newRow()]);
    } catch (e: any) {
      toast.error(e?.message ?? "Error saving return");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-4" data-ocid="sales_return.page">
      {/* Main form */}
      <div className="flex-1 space-y-5 min-w-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100">
            <RotateCcw className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sales Return</h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              Record medicine returns from customers — stock will increase
            </p>
          </div>
        </div>

        {/* Header Fields */}
        <Card className="shadow-card">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Return Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Return No</Label>
                <Input
                  data-ocid="sales_return.return_no.input"
                  className="mt-1 h-8 text-sm"
                  value={returnNo}
                  onChange={(e) => setReturnNo(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Return Date</Label>
                <Input
                  data-ocid="sales_return.date.input"
                  type="date"
                  className="mt-1 h-8 text-sm"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Patient Name</Label>
                <Input
                  data-ocid="sales_return.patient.input"
                  className="mt-1 h-8 text-sm"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Patient name"
                />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input
                  data-ocid="sales_return.phone.input"
                  className="mt-1 h-8 text-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label className="text-xs">Doctor Name</Label>
                <Input
                  data-ocid="sales_return.doctor.input"
                  className="mt-1 h-8 text-sm"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Doctor name"
                />
              </div>
              <div>
                <Label className="text-xs">Doctor Reg No.</Label>
                <Input
                  data-ocid="sales_return.doctor_reg_no.input"
                  className="mt-1 h-8 text-sm"
                  value={doctorRegNo}
                  onChange={(e) => setDoctorRegNo(e.target.value)}
                  placeholder="e.g. MCI-12345"
                />
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs">Remarks / Reason</Label>
                <Input
                  data-ocid="sales_return.remarks.input"
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
                Returned Medicines
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setRows((r) => [...r, newRow()])}
                data-ocid="sales_return.add_row.button"
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
                      "Qty",
                      "MRP (₹)",
                      "GST%",
                      "Amount (₹)",
                      "",
                    ].map((h) => (
                      <TableHead
                        key={h}
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
                      className="border-border"
                      data-ocid={`sales_return.item.${idx + 1}`}
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
                                    <span className="font-medium">
                                      {m.name}
                                    </span>
                                    <span className="text-muted-foreground ml-2">
                                      ₹{Number(m.sellingPrice).toFixed(2)}
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
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          className="h-7 text-xs w-16"
                          value={row.qty}
                          onChange={(e) =>
                            updateRow(row.id, {
                              qty: Number(e.target.value) || 1,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          className="h-7 text-xs w-20"
                          value={row.mrp}
                          onChange={(e) =>
                            updateRow(row.id, {
                              mrp: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {row.gstPercent}%
                      </TableCell>
                      <TableCell className="font-semibold text-xs">
                        {(row.mrp * row.qty).toFixed(2)}
                      </TableCell>
                      <TableCell className="pr-5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() =>
                            setRows((r) => r.filter((x) => x.id !== row.id))
                          }
                          data-ocid={`sales_return.delete_button.${idx + 1}`}
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
                    onClick={() => openReturnPrintWindow(savedRecord, "sales")}
                    data-ocid="sales_return.print.button"
                  >
                    <Printer className="h-4 w-4" /> Print Last
                  </Button>
                )}
                <Button
                  className="gap-2"
                  onClick={handleSave}
                  disabled={saving}
                  data-ocid="sales_return.submit_button"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Save Return"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer History Sidebar */}
      {patientName.length >= 2 && (
        <div
          className="w-72 flex-shrink-0"
          data-ocid="sales_return.customer_history.panel"
        >
          <Card className="shadow-card h-full">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Purchase History
              </CardTitle>
              <p className="text-xs text-foreground font-medium truncate">
                {patientName}
              </p>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              <ScrollArea className="h-[calc(100vh-260px)]">
                {customerHistory.length === 0 ? (
                  <div
                    className="text-xs text-muted-foreground text-center py-8 px-4"
                    data-ocid="sales_return.customer_history.empty_state"
                  >
                    No previous purchase history found
                  </div>
                ) : (
                  <div className="space-y-2 px-3">
                    {customerHistory.map((bill, bIdx) => {
                      const billDate = new Date(
                        Number(bill.billDate) / 1_000_000,
                      ).toLocaleDateString("en-IN");
                      const billNoStr = `INV-${String(Number(bill.billNumber)).padStart(4, "0")}`;
                      return (
                        <div
                          key={String(bill.id)}
                          className="p-2 rounded border border-border bg-muted/30 text-xs"
                          data-ocid={`sales_return.customer_history.item.${bIdx + 1}`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {billNoStr}
                            </Badge>
                            <span className="text-muted-foreground">
                              {billDate}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            {bill.items.map((item) => (
                              <div
                                key={String(item.medicineId)}
                                className="flex justify-between"
                              >
                                <span className="text-foreground truncate max-w-[140px]">
                                  {medMap[String(item.medicineId)] ?? "Unknown"}
                                </span>
                                <span className="text-muted-foreground ml-1">
                                  x{String(item.quantity)} @₹
                                  {String(item.unitPrice)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Print confirmation dialog */}
      <AlertDialog open={confirmPrintOpen} onOpenChange={setConfirmPrintOpen}>
        <AlertDialogContent data-ocid="sales_return.print_confirm.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Return Saved Successfully</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to print the return slip?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="sales_return.print_confirm_cancel.button">
              Not Now
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="sales_return.print_confirm_ok.button"
              onClick={() => {
                if (savedRecord) openReturnPrintWindow(savedRecord, "sales");
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
