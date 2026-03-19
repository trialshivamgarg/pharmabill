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
import { Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useGetMedicines, useUpdateMedicine } from "../hooks/useQueries";

interface ReturnRow {
  id: string;
  medicineName: string;
  medicineId: bigint | null;
  batchNo: string;
  expiry: string;
  qty: number;
  mrp: number;
  gstPercent: number;
}

const newRow = (): ReturnRow => ({
  id: crypto.randomUUID(),
  medicineName: "",
  medicineId: null,
  batchNo: "",
  expiry: "",
  qty: 1,
  mrp: 0,
  gstPercent: 12,
});

function today() {
  return new Date().toISOString().split("T")[0];
}

function genReturnNo(prefix: string) {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${n}`;
}

export default function SalesReturn() {
  const { data: medicines = [] } = useGetMedicines();
  const updateMedicine = useUpdateMedicine();

  const [returnDate, setReturnDate] = useState(today());
  const [returnNo, setReturnNo] = useState(() => genReturnNo("SR"));
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [doctorName, setDoctorName] = useState("");
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
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const selectMedicine = (rowId: string, medName: string) => {
    const med = medicines.find(
      (m) => m.name.toLowerCase() === medName.toLowerCase(),
    );
    updateRow(rowId, {
      medicineName: medName,
      medicineId: med?.id ?? null,
      batchNo: med?.batchNumber ?? "",
      expiry: med?.expiryDate ?? "",
      mrp: Number(med?.sellingPrice ?? 0),
      gstPercent: Number(med?.gstPercent ?? 12),
    });
    setSearchOpen(null);
    setSearchQuery("");
  };

  const filteredMeds = (q: string) =>
    medicines
      .filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 8);

  const subTotal = rows.reduce((s, r) => s + r.mrp * r.qty, 0);
  const gstTotal = rows.reduce(
    (s, r) => s + (r.mrp * r.qty * r.gstPercent) / 100,
    0,
  );
  const grandTotal = subTotal + gstTotal;

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
      toast.success("Sales Return saved. Stock updated.");
      setReturnNo(genReturnNo("SR"));
      setReturnDate(today());
      setPatientName("");
      setPhone("");
      setDoctorName("");
      setRemarks("");
      setRows([newRow()]);
    } catch (e: any) {
      toast.error(e?.message ?? "Error saving return");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5" data-ocid="sales_return.page">
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
          <Table data-ocid="sales_return.table">
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
                                {m.name}
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
                        updateRow(row.id, { qty: Number(e.target.value) || 1 })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-7 text-xs w-20"
                      value={row.mrp}
                      onChange={(e) =>
                        updateRow(row.id, { mrp: Number(e.target.value) || 0 })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="28"
                      className="h-7 text-xs w-16"
                      value={row.gstPercent}
                      onChange={(e) =>
                        updateRow(row.id, {
                          gstPercent: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    ₹
                    {(row.mrp * row.qty * (1 + row.gstPercent / 100)).toFixed(
                      2,
                    )}
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
                      data-ocid={`sales_return.delete_button.${idx + 1}`}
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
        <Card className="shadow-card w-64">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Sub Total</span>
              <span className="font-medium">₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">GST</span>
              <span className="font-medium">₹{gstTotal.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
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
          data-ocid="sales_return.submit_button"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Sales Return"}
        </Button>
      </div>
    </div>
  );
}
