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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Eye,
  History,
  Pencil,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useGetMedicines, useUpdateMedicine } from "../hooks/useQueries";
import {
  type PurchaseReturnRecord,
  type ReturnItem,
  deletePurchaseReturn,
  getPurchaseReturns,
  updatePurchaseReturn,
} from "../hooks/useReturnStore";
import {
  buildReturnInvoiceHtml,
  openReturnPrintWindow,
} from "../utils/printReturn";

function fmtDate(dateStr: string) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return d ? `${d}-${m}-${y}` : dateStr;
}

function EditReturnSheet({
  record,
  onClose,
  onSave,
}: {
  record: PurchaseReturnRecord;
  onClose: () => void;
  onSave: (r: PurchaseReturnRecord) => void;
}) {
  const { data: medicines = [] } = useGetMedicines();
  const [form, setForm] = useState<PurchaseReturnRecord>({
    ...record,
    items: record.items.map((i) => ({ ...i })),
  });
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

  const setField = (k: keyof PurchaseReturnRecord, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));
  const updateItem = (id: string, patch: Partial<ReturnItem>) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));

  const filteredMeds = (q: string) =>
    medicines
      .filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 8);

  const recalc = (items: ReturnItem[]) => {
    let subtotal = 0;
    let totalGST = 0;
    let grandTotal = 0;
    for (const item of items) {
      const amt = item.mrp * item.qty;
      const base = amt / (1 + item.gstPercent / 100);
      subtotal += base;
      totalGST += amt - base;
      grandTotal += amt;
    }
    return { subtotal, totalGST, grandTotal };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const totals = recalc(form.items);
      const updated = { ...form, ...totals };
      onSave(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
        data-ocid="purchase_return_history.edit.sheet"
      >
        <SheetHeader>
          <SheetTitle>Edit Purchase Return — {record.returnNo}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["returnNo", "Return No"],
                ["returnDate", "Return Date", "date"],
                ["distributorFirmName", "Firm Name"],
                ["distributorAddress", "Address"],
                ["distributorGST", "GST No."],
                ["distributorDLNo", "DL No."],
                ["remarks", "Remarks"],
              ] as [keyof PurchaseReturnRecord, string, string?][]
            ).map(([k, label, type]) => (
              <div key={k}>
                <Label className="text-xs">{label}</Label>
                <Input
                  type={type ?? "text"}
                  className="mt-1 h-8 text-sm"
                  value={String(form[k] ?? "")}
                  onChange={(e) => setField(k, e.target.value)}
                />
              </div>
            ))}
          </div>
          <div className="border rounded overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Medicine", "Batch", "Expiry", "Qty", "Price", ""].map(
                    (h) => (
                      <TableHead key={h} className="text-xs">
                        {h}
                      </TableHead>
                    ),
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div
                        className="relative"
                        ref={searchOpen === item.id ? searchRef : undefined}
                      >
                        <Input
                          className="h-7 text-xs w-36"
                          value={item.medicineName}
                          onChange={(e) => {
                            updateItem(item.id, {
                              medicineName: e.target.value,
                            });
                            setSearchQuery(e.target.value);
                            setSearchOpen(item.id);
                          }}
                          onFocus={() => {
                            setSearchOpen(item.id);
                            setSearchQuery(item.medicineName);
                          }}
                        />
                        {searchOpen === item.id && searchQuery.length > 0 && (
                          <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white border rounded shadow-xl max-h-40 overflow-y-auto">
                            {filteredMeds(searchQuery).map((m) => (
                              <button
                                key={String(m.id)}
                                type="button"
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent"
                                onMouseDown={() => {
                                  updateItem(item.id, {
                                    medicineName: m.name,
                                    medicineId: String(m.id),
                                    mrp: Number(m.purchasePrice),
                                  });
                                  setSearchOpen(null);
                                  setSearchQuery("");
                                }}
                              >
                                {m.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-7 text-xs w-20"
                        value={item.batchNo}
                        onChange={(e) =>
                          updateItem(item.id, { batchNo: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-7 text-xs w-24"
                        value={item.expiry}
                        onChange={(e) =>
                          updateItem(item.id, { expiry: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        className="h-7 text-xs w-14"
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(item.id, {
                            qty: Number(e.target.value) || 1,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        className="h-7 text-xs w-18"
                        value={item.mrp}
                        onChange={(e) =>
                          updateItem(item.id, {
                            mrp: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            items: f.items.filter((i) => i.id !== item.id),
                          }))
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <SheetFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="purchase_return_history.edit_cancel.button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            data-ocid="purchase_return_history.edit_save.button"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function PurchaseReturnHistory() {
  const { data: medicines = [] } = useGetMedicines();
  const updateMedicine = useUpdateMedicine();
  const [records, setRecords] = useState<PurchaseReturnRecord[]>([]);
  const [search, setSearch] = useState("");
  const [viewRecord, setViewRecord] = useState<PurchaseReturnRecord | null>(
    null,
  );
  const [editRecord, setEditRecord] = useState<PurchaseReturnRecord | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<PurchaseReturnRecord | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setRecords(
      [...getPurchaseReturns()].sort((a, b) => b.createdAt - a.createdAt),
    );
  }, []);

  const reload = () =>
    setRecords(
      [...getPurchaseReturns()].sort((a, b) => b.createdAt - a.createdAt),
    );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(
      (r) =>
        r.returnNo.toLowerCase().includes(q) ||
        r.distributorFirmName.toLowerCase().includes(q),
    );
  }, [records, search]);

  const handleEdit = (updated: PurchaseReturnRecord) => {
    updatePurchaseReturn(updated);
    reload();
    setEditRecord(null);
    toast.success("Return updated");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Reverse stock: purchase return decreased stock, so delete increases it
      for (const item of deleteTarget.items) {
        const med = medicines.find((m) => String(m.id) === item.medicineId);
        if (med) {
          await updateMedicine.mutateAsync({
            ...med,
            currentStock: med.currentStock + BigInt(item.qty),
          });
        }
      }
      deletePurchaseReturn(deleteTarget.id);
      reload();
      setDeleteTarget(null);
      toast.success("Return deleted and stock reversed");
    } catch {
      toast.error("Error deleting return");
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = (r: PurchaseReturnRecord) =>
    openReturnPrintWindow(r, "purchase");
  const handleDownload = (r: PurchaseReturnRecord) => {
    const html = buildReturnInvoiceHtml(r, "purchase");
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.returnNo}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5" data-ocid="purchase_return_history.page">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-100">
          <History className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Purchase Return History</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            View and manage all recorded purchase returns
          </p>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              {filtered.length} Return{filtered.length !== 1 ? "s" : ""}
            </CardTitle>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                data-ocid="purchase_return_history.search.input"
                className="h-8 pl-8 text-sm"
                placeholder="Search returns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="pl-5 text-xs font-semibold text-muted-foreground">
                  Return No
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Date
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Distributor
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  GST No
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">
                  Items
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                  Grand Total
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground pr-5 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground text-xs py-12"
                    data-ocid="purchase_return_history.list.empty_state"
                  >
                    No purchase returns found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r, idx) => (
                  <TableRow
                    key={r.id}
                    className="border-border"
                    data-ocid={`purchase_return_history.list.item.${idx + 1}`}
                  >
                    <TableCell className="pl-5 font-medium text-sm">
                      <Badge variant="outline" className="text-[11px]">
                        {r.returnNo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {fmtDate(r.returnDate)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {r.distributorFirmName || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {r.distributorGST || "—"}
                    </TableCell>
                    <TableCell className="text-xs">{r.items.length}</TableCell>
                    <TableCell className="text-right font-semibold text-sm">
                      ₹{r.grandTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setViewRecord(r)}
                          title="View"
                          data-ocid={`purchase_return_history.view_button.${idx + 1}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setEditRecord(r)}
                          title="Edit"
                          data-ocid={`purchase_return_history.edit_button.${idx + 1}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handlePrint(r)}
                          title="Print"
                          data-ocid={`purchase_return_history.print_button.${idx + 1}`}
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleDownload(r)}
                          title="Download"
                          data-ocid={`purchase_return_history.download_button.${idx + 1}`}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(r)}
                          title="Delete"
                          data-ocid={`purchase_return_history.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog
        open={!!viewRecord}
        onOpenChange={(o) => {
          if (!o) setViewRecord(null);
        }}
      >
        <DialogContent
          className="sm:max-w-2xl"
          data-ocid="purchase_return_history.view.dialog"
        >
          <DialogHeader>
            <DialogTitle>Purchase Return — {viewRecord?.returnNo}</DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Date:</span>{" "}
                    {fmtDate(viewRecord.returnDate)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Firm:</span>{" "}
                    {viewRecord.distributorFirmName}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Address:</span>{" "}
                    {viewRecord.distributorAddress}
                  </div>
                  <div>
                    <span className="text-muted-foreground">GST:</span>{" "}
                    {viewRecord.distributorGST}
                  </div>
                  <div>
                    <span className="text-muted-foreground">DL No:</span>{" "}
                    {viewRecord.distributorDLNo}
                  </div>
                  {viewRecord.remarks && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Remarks:</span>{" "}
                      {viewRecord.remarks}
                    </div>
                  )}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Medicine</TableHead>
                      <TableHead className="text-xs">Batch</TableHead>
                      <TableHead className="text-xs">Qty</TableHead>
                      <TableHead className="text-xs text-right">
                        Price
                      </TableHead>
                      <TableHead className="text-xs text-right">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewRecord.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs">
                          {item.medicineName}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.batchNo}
                        </TableCell>
                        <TableCell className="text-xs">{item.qty}</TableCell>
                        <TableCell className="text-xs text-right">
                          ₹{item.mrp.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          ₹{(item.mrp * item.qty).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="text-right space-y-1 text-sm border-t pt-2">
                  <div className="text-muted-foreground">
                    Sub Total:{" "}
                    <strong>₹{viewRecord.subtotal.toFixed(2)}</strong>
                  </div>
                  <div className="text-muted-foreground">
                    GST: <strong>₹{viewRecord.totalGST.toFixed(2)}</strong>
                  </div>
                  <div className="text-base font-bold">
                    Grand Total: ₹{viewRecord.grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Sheet */}
      {editRecord && (
        <EditReturnSheet
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSave={handleEdit}
        />
      )}

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent data-ocid="purchase_return_history.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Return?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete <strong>{deleteTarget?.returnNo}</strong> and
              reverse all stock changes (stock will increase). This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              data-ocid="purchase_return_history.delete_cancel.button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
              data-ocid="purchase_return_history.delete_confirm.button"
            >
              {deleting ? "Deleting..." : "Delete & Reverse Stock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
