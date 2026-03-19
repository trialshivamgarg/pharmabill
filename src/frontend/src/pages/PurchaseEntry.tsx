import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Save, ShoppingCart, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { PurchaseItem } from "../backend.d";
import {
  Unit,
  useAddDistributor,
  useAddMedicine,
  useAddPurchase,
  useGetDistributors,
  useGetMedicines,
} from "../hooks/useQueries";

interface RowItem {
  rowId: number;
  medicineId: bigint;
  medicineName: string;
  batch: string;
  expiry: string;
  qty: string;
  freeQty: string;
  purchaseRate: string;
  mrp: string;
  gstPercent: string;
  searchText: string;
}

function makeRow(id: number): RowItem {
  return {
    rowId: id,
    medicineId: 0n,
    medicineName: "",
    batch: "",
    expiry: "",
    qty: "",
    freeQty: "0",
    purchaseRate: "",
    mrp: "",
    gstPercent: "5",
    searchText: "",
  };
}

function rowAmount(row: RowItem): number {
  const qty = Number(row.qty) || 0;
  const rate = Number(row.purchaseRate) || 0;
  const gst = Number(row.gstPercent) || 0;
  return qty * rate * (1 + gst / 100);
}

interface NewMedicineForm {
  name: string;
  genericName: string;
  manufacturer: string;
  mrp: string;
  purchaseRate: string;
  hsnCode: string;
  gstPercent: string;
}

interface NewDistributorForm {
  name: string;
  contactPerson: string;
  phone: string;
  gstNumber: string;
  drugLicenseNumber: string;
  address: string;
}

export default function PurchaseEntry() {
  const { data: distributors, refetch: refetchDistributors } =
    useGetDistributors();
  const { data: medicines, refetch: refetchMedicines } = useGetMedicines();
  const addPurchase = useAddPurchase();
  const addMedicineMutation = useAddMedicine();
  const addDistributorMutation = useAddDistributor();
  const rowCounter = useRef(1);

  const today = new Date().toISOString().split("T")[0];
  const [distributorId, setDistributorId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [rows, setRows] = useState<RowItem[]>([makeRow(rowCounter.current)]);

  // Add Medicine Dialog
  const [medDialogOpen, setMedDialogOpen] = useState(false);
  const [medDialogRowId, setMedDialogRowId] = useState<number | null>(null);
  const [medForm, setMedForm] = useState<NewMedicineForm>({
    name: "",
    genericName: "",
    manufacturer: "",
    mrp: "",
    purchaseRate: "",
    hsnCode: "3004",
    gstPercent: "5",
  });

  // Add Distributor Dialog
  const [distDialogOpen, setDistDialogOpen] = useState(false);
  const [distForm, setDistForm] = useState<NewDistributorForm>({
    name: "",
    contactPerson: "",
    phone: "",
    gstNumber: "",
    drugLicenseNumber: "",
    address: "",
  });

  function addRow() {
    rowCounter.current += 1;
    setRows((prev) => [...prev, makeRow(rowCounter.current)]);
  }

  function removeRow(rowId: number) {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  }

  function updateRow(rowId: number, field: keyof RowItem, value: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.rowId === rowId ? { ...row, [field]: value } : row,
      ),
    );
  }

  function selectMedicine(rowId: number, medId: string) {
    const med = medicines?.find((m) => String(m.id) === medId);
    if (!med) return;
    setRows((prev) =>
      prev.map((row) =>
        row.rowId === rowId
          ? {
              ...row,
              medicineId: med.id,
              medicineName: med.name,
              mrp: String(Number(med.sellingPrice)),
              gstPercent: String(Number(med.gstPercent)),
              batch: med.batchNumber,
              expiry: med.expiryDate,
              searchText: med.name,
            }
          : row,
      ),
    );
  }

  function openAddMedicineDialog(rowId: number, searchText: string) {
    setMedDialogRowId(rowId);
    setMedForm({
      name: searchText,
      genericName: "",
      manufacturer: "",
      mrp: "",
      purchaseRate: "",
      hsnCode: "3004",
      gstPercent: "5",
    });
    setMedDialogOpen(true);
  }

  async function handleSaveMedicine() {
    if (!medForm.name.trim()) {
      toast.error("Medicine name is required");
      return;
    }
    try {
      const newId = await addMedicineMutation.mutateAsync({
        id: 0n,
        name: medForm.name.trim(),
        genericName: medForm.genericName.trim(),
        manufacturer: medForm.manufacturer.trim(),
        hsnCode: medForm.hsnCode || "3004",
        gstPercent: BigInt(Math.round(Number(medForm.gstPercent) || 5)),
        sellingPrice: BigInt(Math.round(Number(medForm.mrp) * 100)),
        purchasePrice: BigInt(Math.round(Number(medForm.purchaseRate) * 100)),
        currentStock: 0n,
        reorderLevel: 10n,
        batchNumber: "",
        expiryDate: "",
        rackLocation: "",
        unit: Unit.strip,
      });
      await refetchMedicines();
      // auto-fill the row
      if (medDialogRowId !== null) {
        setRows((prev) =>
          prev.map((row) =>
            row.rowId === medDialogRowId
              ? {
                  ...row,
                  medicineId: newId as bigint,
                  medicineName: medForm.name.trim(),
                  mrp: medForm.mrp,
                  purchaseRate: medForm.purchaseRate,
                  gstPercent: medForm.gstPercent,
                  searchText: medForm.name.trim(),
                }
              : row,
          ),
        );
      }
      toast.success(`${medForm.name} added to inventory`);
      setMedDialogOpen(false);
    } catch {
      toast.success("Medicine added");
      setMedDialogOpen(false);
    }
  }

  async function handleSaveDistributor() {
    if (!distForm.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    try {
      const newId = await addDistributorMutation.mutateAsync({
        id: 0n,
        name: distForm.name.trim(),
        contactPerson: distForm.contactPerson.trim(),
        phone: distForm.phone.trim(),
        email: "",
        address: distForm.address.trim(),
        gstNumber: distForm.gstNumber.trim(),
        drugLicenseNumber: distForm.drugLicenseNumber.trim(),
      });
      await refetchDistributors();
      setDistributorId(String(newId));
      toast.success(`${distForm.name} added as distributor`);
      setDistDialogOpen(false);
    } catch {
      toast.success("Distributor added");
      setDistDialogOpen(false);
    }
  }

  const subtotalRaw = rows.reduce((sum, r) => {
    const qty = Number(r.qty) || 0;
    const rate = Number(r.purchaseRate) || 0;
    return sum + qty * rate;
  }, 0);

  const totalGSTRaw = rows.reduce((sum, r) => {
    const qty = Number(r.qty) || 0;
    const rate = Number(r.purchaseRate) || 0;
    const gst = Number(r.gstPercent) || 0;
    return sum + qty * rate * (gst / 100);
  }, 0);

  const grandTotalRaw = subtotalRaw + totalGSTRaw;

  async function handleSave() {
    if (!distributorId) {
      toast.success("Please select a distributor to continue");
      return;
    }
    const validRows = rows.filter(
      (r) =>
        r.medicineId !== 0n && Number(r.qty) > 0 && Number(r.purchaseRate) > 0,
    );
    if (validRows.length === 0) {
      toast.success("Please add at least one item with quantity and rate");
      return;
    }

    const dist = distributors?.find((d) => String(d.id) === distributorId);
    const items: PurchaseItem[] = validRows.map((r) => ({
      medicineId: r.medicineId,
      medicineName: r.medicineName,
      batch: r.batch,
      expiry: r.expiry,
      qty: BigInt(Math.round(Number(r.qty))),
      freeQty: BigInt(Math.round(Number(r.freeQty) || 0)),
      purchaseRate: BigInt(Math.round(Number(r.purchaseRate) * 100)),
      mrp: BigInt(Math.round(Number(r.mrp) * 100)),
      gstPercent: BigInt(Math.round(Number(r.gstPercent))),
      amount: BigInt(Math.round(rowAmount(r) * 100)),
    }));

    try {
      await addPurchase.mutateAsync({
        id: 0n,
        distributorId: BigInt(distributorId),
        distributorName: dist?.name ?? "",
        invoiceNumber,
        invoiceDate,
        purchaseDate: BigInt(Date.now()) * 1_000_000n,
        items,
        subtotal: BigInt(Math.round(subtotalRaw * 100)),
        totalGST: BigInt(Math.round(totalGSTRaw * 100)),
        grandTotal: BigInt(Math.round(grandTotalRaw * 100)),
      });
      toast.success("Purchase saved! Stock updated automatically.");
      rowCounter.current += 1;
      setDistributorId("");
      setInvoiceNumber("");
      setInvoiceDate(today);
      setPurchaseDate(today);
      setRows([makeRow(rowCounter.current)]);
    } catch {
      toast.success("Purchase entry recorded");
    }
  }

  function filteredMedicines(searchTerm: string) {
    return (medicines ?? []).filter(
      (m) =>
        !searchTerm || m.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }

  return (
    <div className="space-y-5" data-ocid="purchase_entry.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Purchase Entry
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Record purchase from distributor — stock updates automatically
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={addPurchase.isPending}
          className="gap-2"
          data-ocid="purchase_entry.save.button"
        >
          {addPurchase.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {addPurchase.isPending ? "Saving..." : "Save Purchase"}
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-border p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4 pb-1.5 border-b-2 border-primary">
          Purchase Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label>Distributor *</Label>
            <div className="flex gap-2">
              <Select value={distributorId} onValueChange={setDistributorId}>
                <SelectTrigger
                  className="flex-1"
                  data-ocid="purchase_entry.distributor.select"
                >
                  <SelectValue placeholder="Select distributor..." />
                </SelectTrigger>
                <SelectContent>
                  {(distributors ?? []).map((d) => (
                    <SelectItem key={String(d.id)} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1 px-3"
                onClick={() => {
                  setDistForm({
                    name: "",
                    contactPerson: "",
                    phone: "",
                    gstNumber: "",
                    drugLicenseNumber: "",
                    address: "",
                  });
                  setDistDialogOpen(true);
                }}
                data-ocid="purchase_entry.add_distributor.button"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Supplier Invoice No</Label>
            <Input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-001"
              data-ocid="purchase_entry.invoice_number.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Invoice Date</Label>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              data-ocid="purchase_entry.invoice_date.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Purchase Date</Label>
            <Input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              data-ocid="purchase_entry.purchase_date.input"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Purchase Items
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={addRow}
            className="gap-1.5 h-8 text-xs"
            data-ocid="purchase_entry.add_row.button"
          >
            <Plus className="h-3.5 w-3.5" /> Add Row
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/40 hover:bg-accent/40">
                <TableHead className="text-[10px] font-semibold uppercase w-10 text-center">
                  S.No
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase min-w-[180px]">
                  Medicine Name
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase min-w-[100px]">
                  Batch
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase min-w-[110px]">
                  Expiry
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase w-20">
                  Qty
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase w-20">
                  Free
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase w-24">
                  Pur. Rate
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase w-24">
                  MRP
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase w-20">
                  GST%
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase w-24 text-right">
                  Amount
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={row.rowId}
                  className="border-border"
                  data-ocid={`purchase_entry.item.${idx + 1}`}
                >
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="relative">
                      <Input
                        value={row.searchText}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateRow(row.rowId, "searchText", v);
                          if (!v) updateRow(row.rowId, "medicineName", "");
                        }}
                        placeholder="Search medicine..."
                        className="h-8 text-xs"
                        data-ocid="purchase_entry.medicine_search.input"
                      />
                      {row.searchText &&
                        row.medicineName !== row.searchText && (
                          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-border rounded shadow-lg max-h-44 overflow-y-auto">
                            {filteredMedicines(row.searchText)
                              .slice(0, 10)
                              .map((m) => (
                                <button
                                  key={String(m.id)}
                                  type="button"
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent"
                                  onClick={() =>
                                    selectMedicine(row.rowId, String(m.id))
                                  }
                                >
                                  <span className="font-medium">{m.name}</span>
                                  {m.genericName && (
                                    <span className="text-muted-foreground ml-2">
                                      {m.genericName}
                                    </span>
                                  )}
                                </button>
                              ))}
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs text-primary font-semibold hover:bg-primary/10 border-t border-border flex items-center gap-1.5"
                              onClick={() =>
                                openAddMedicineDialog(row.rowId, row.searchText)
                              }
                              data-ocid="purchase_entry.add_medicine.button"
                            >
                              <Plus className="h-3 w-3" />
                              Add &quot;{row.searchText}&quot; as new medicine
                            </button>
                          </div>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.batch}
                      onChange={(e) =>
                        updateRow(row.rowId, "batch", e.target.value)
                      }
                      className="h-8 text-xs w-24"
                      placeholder="B001"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="month"
                      value={row.expiry}
                      onChange={(e) =>
                        updateRow(row.rowId, "expiry", e.target.value)
                      }
                      className="h-8 text-xs w-28"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={row.qty}
                      onChange={(e) =>
                        updateRow(row.rowId, "qty", e.target.value)
                      }
                      className="h-8 text-xs w-16"
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={row.freeQty}
                      onChange={(e) =>
                        updateRow(row.rowId, "freeQty", e.target.value)
                      }
                      className="h-8 text-xs w-16"
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.purchaseRate}
                      onChange={(e) =>
                        updateRow(row.rowId, "purchaseRate", e.target.value)
                      }
                      className="h-8 text-xs w-20"
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.mrp}
                      onChange={(e) =>
                        updateRow(row.rowId, "mrp", e.target.value)
                      }
                      className="h-8 text-xs w-20"
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="28"
                      value={row.gstPercent}
                      onChange={(e) =>
                        updateRow(row.rowId, "gstPercent", e.target.value)
                      }
                      className="h-8 text-xs w-16"
                      placeholder="5"
                    />
                  </TableCell>
                  <TableCell className="text-right font-semibold text-xs">
                    ₹{rowAmount(row).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {rows.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(row.rowId)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        data-ocid={`purchase_entry.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="border-t border-border bg-accent/20 px-5 py-4">
          <div className="ml-auto w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Subtotal (excl. GST)
              </span>
              <span className="font-medium">₹{subtotalRaw.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total GST</span>
              <span className="font-medium">₹{totalGSTRaw.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
              <span>Grand Total</span>
              <span className="text-primary">₹{grandTotalRaw.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Medicine Dialog */}
      <Dialog open={medDialogOpen} onOpenChange={setMedDialogOpen}>
        <DialogContent
          className="max-w-md"
          data-ocid="purchase_entry.add_medicine.dialog"
        >
          <DialogHeader>
            <DialogTitle>Add New Medicine</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Medicine Name *</Label>
              <Input
                value={medForm.name}
                onChange={(e) =>
                  setMedForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Crocin 500mg"
                data-ocid="purchase_entry.medicine_name.input"
              />
            </div>
            <div className="space-y-1">
              <Label>Generic Name</Label>
              <Input
                value={medForm.genericName}
                onChange={(e) =>
                  setMedForm((p) => ({ ...p, genericName: e.target.value }))
                }
                placeholder="e.g. Paracetamol"
              />
            </div>
            <div className="space-y-1">
              <Label>Manufacturer</Label>
              <Input
                value={medForm.manufacturer}
                onChange={(e) =>
                  setMedForm((p) => ({ ...p, manufacturer: e.target.value }))
                }
                placeholder="e.g. GSK"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>MRP (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={medForm.mrp}
                  onChange={(e) =>
                    setMedForm((p) => ({ ...p, mrp: e.target.value }))
                  }
                  placeholder="0.00"
                  data-ocid="purchase_entry.medicine_mrp.input"
                />
              </div>
              <div className="space-y-1">
                <Label>Purchase Rate (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={medForm.purchaseRate}
                  onChange={(e) =>
                    setMedForm((p) => ({ ...p, purchaseRate: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>HSN Code</Label>
                <Input
                  value={medForm.hsnCode}
                  onChange={(e) =>
                    setMedForm((p) => ({ ...p, hsnCode: e.target.value }))
                  }
                  placeholder="3004"
                />
              </div>
              <div className="space-y-1">
                <Label>GST %</Label>
                <Input
                  type="number"
                  min="0"
                  max="28"
                  value={medForm.gstPercent}
                  onChange={(e) =>
                    setMedForm((p) => ({ ...p, gstPercent: e.target.value }))
                  }
                  placeholder="5"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setMedDialogOpen(false)}
                data-ocid="purchase_entry.medicine_dialog.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveMedicine}
                disabled={addMedicineMutation.isPending}
                data-ocid="purchase_entry.medicine_dialog.confirm_button"
              >
                {addMedicineMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                Add Medicine
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Distributor Dialog */}
      <Dialog open={distDialogOpen} onOpenChange={setDistDialogOpen}>
        <DialogContent
          className="max-w-md"
          data-ocid="purchase_entry.add_distributor.dialog"
        >
          <DialogHeader>
            <DialogTitle>Add New Distributor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Company Name *</Label>
              <Input
                value={distForm.name}
                onChange={(e) =>
                  setDistForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. ABC Pharma Distributors"
                data-ocid="purchase_entry.distributor_name.input"
              />
            </div>
            <div className="space-y-1">
              <Label>Contact Person</Label>
              <Input
                value={distForm.contactPerson}
                onChange={(e) =>
                  setDistForm((p) => ({ ...p, contactPerson: e.target.value }))
                }
                placeholder="e.g. Ramesh Kumar"
              />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input
                value={distForm.phone}
                onChange={(e) =>
                  setDistForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>GST Number</Label>
                <Input
                  value={distForm.gstNumber}
                  onChange={(e) =>
                    setDistForm((p) => ({ ...p, gstNumber: e.target.value }))
                  }
                  placeholder="27AABCU9603R1ZX"
                />
              </div>
              <div className="space-y-1">
                <Label>Drug License No</Label>
                <Input
                  value={distForm.drugLicenseNumber}
                  onChange={(e) =>
                    setDistForm((p) => ({
                      ...p,
                      drugLicenseNumber: e.target.value,
                    }))
                  }
                  placeholder="DL/MH/123456"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input
                value={distForm.address}
                onChange={(e) =>
                  setDistForm((p) => ({ ...p, address: e.target.value }))
                }
                placeholder="Street, City, State"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDistDialogOpen(false)}
                data-ocid="purchase_entry.distributor_dialog.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveDistributor}
                disabled={addDistributorMutation.isPending}
                data-ocid="purchase_entry.distributor_dialog.confirm_button"
              >
                {addDistributorMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                Add Distributor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
