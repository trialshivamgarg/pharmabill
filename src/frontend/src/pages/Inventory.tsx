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
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit2, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { INDIAN_MEDICINES } from "../data/indianMedicines";
import {
  type Medicine,
  Unit,
  useAddMedicine,
  useDeleteMedicine,
  useGetMedicines,
  useUpdateMedicine,
} from "../hooks/useQueries";

const EMPTY_MED: Medicine = {
  id: 0n,
  name: "",
  genericName: "",
  manufacturer: "",
  batchNumber: "",
  expiryDate: "",
  currentStock: 0n,
  reorderLevel: 10n,
  sellingPrice: 0n,
  purchasePrice: 0n,
  gstPercent: 5n,
  unit: Unit.strip,
  hsnCode: "3004",
  rackLocation: "",
};

function StockBadge({ med }: { med: Medicine }) {
  if (med.currentStock === 0n)
    return (
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{
          background: "oklch(var(--danger-bg))",
          color: "oklch(var(--danger-text))",
        }}
      >
        Out of Stock
      </span>
    );
  if (med.currentStock <= med.reorderLevel)
    return (
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{
          background: "oklch(var(--warning-bg))",
          color: "oklch(var(--warning-text))",
        }}
      >
        Low Stock
      </span>
    );
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: "oklch(var(--success-bg))",
        color: "oklch(var(--success-text))",
      }}
    >
      In Stock
    </span>
  );
}

function CatalogBadge() {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
      Catalog
    </span>
  );
}

function MedicineForm({
  value,
  onChange,
}: { value: Medicine; onChange: (m: Medicine) => void }) {
  const set = (field: keyof Medicine, v: string | bigint | Unit) =>
    onChange({ ...value, [field]: v });
  const numField = (field: keyof Medicine, v: string) =>
    set(field, BigInt(v === "" ? 0 : Number.parseInt(v) || 0));

  return (
    <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
      <div className="col-span-2">
        <Label className="text-xs">Medicine Name *</Label>
        <Input
          data-ocid="inventory.name.input"
          className="mt-1 h-8 text-sm"
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Paracetamol 500mg"
        />
      </div>
      <div>
        <Label className="text-xs">Generic Name</Label>
        <Input
          data-ocid="inventory.generic.input"
          className="mt-1 h-8 text-sm"
          value={value.genericName}
          onChange={(e) => set("genericName", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Manufacturer</Label>
        <Input
          className="mt-1 h-8 text-sm"
          value={value.manufacturer}
          onChange={(e) => set("manufacturer", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Batch Number</Label>
        <Input
          className="mt-1 h-8 text-sm"
          value={value.batchNumber}
          onChange={(e) => set("batchNumber", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Expiry Date</Label>
        <Input
          type="month"
          className="mt-1 h-8 text-sm"
          value={value.expiryDate}
          onChange={(e) => set("expiryDate", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Stock Qty</Label>
        <Input
          data-ocid="inventory.stock.input"
          type="number"
          min="0"
          className="mt-1 h-8 text-sm"
          value={String(value.currentStock)}
          onChange={(e) => numField("currentStock", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Reorder Level</Label>
        <Input
          type="number"
          min="0"
          className="mt-1 h-8 text-sm"
          value={String(value.reorderLevel)}
          onChange={(e) => numField("reorderLevel", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Selling Price (₹)</Label>
        <Input
          data-ocid="inventory.price.input"
          type="number"
          min="0"
          className="mt-1 h-8 text-sm"
          value={String(value.sellingPrice)}
          onChange={(e) => numField("sellingPrice", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Purchase Price (₹)</Label>
        <Input
          type="number"
          min="0"
          className="mt-1 h-8 text-sm"
          value={String(value.purchasePrice)}
          onChange={(e) => numField("purchasePrice", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">GST %</Label>
        <Input
          type="number"
          min="0"
          max="28"
          className="mt-1 h-8 text-sm"
          value={String(value.gstPercent)}
          onChange={(e) => numField("gstPercent", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Unit</Label>
        <Select
          value={value.unit}
          onValueChange={(v) => set("unit", v as Unit)}
        >
          <SelectTrigger
            className="mt-1 h-8 text-sm"
            data-ocid="inventory.unit.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={Unit.strip}>Strip</SelectItem>
            <SelectItem value={Unit.tablet}>Tablet</SelectItem>
            <SelectItem value={Unit.bottle}>Bottle</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">HSN Code</Label>
        <Input
          className="mt-1 h-8 text-sm"
          value={value.hsnCode}
          onChange={(e) => set("hsnCode", e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Rack Location</Label>
        <Input
          className="mt-1 h-8 text-sm"
          value={value.rackLocation}
          onChange={(e) => set("rackLocation", e.target.value)}
        />
      </div>
    </div>
  );
}

export default function Inventory() {
  const { data: medicines = [], isLoading } = useGetMedicines();
  const addMut = useAddMedicine();
  const updateMut = useUpdateMedicine();
  const deleteMut = useDeleteMedicine();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [form, setForm] = useState<Medicine>(EMPTY_MED);
  const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);

  // Merge backend medicines with catalog (catalog-only = not yet saved to backend)
  const { allMedicines, catalogOnlyNames } = useMemo(() => {
    const backendNames = new Set(medicines.map((m) => m.name.toLowerCase()));
    const catalogOnly = INDIAN_MEDICINES.filter(
      (m) => !backendNames.has(m.name.toLowerCase()),
    ).map(
      (m) =>
        ({
          id: -1n,
          name: m.name,
          genericName: m.genericName,
          manufacturer: m.manufacturer,
          batchNumber: "",
          expiryDate: "",
          currentStock: 0n,
          reorderLevel: 10n,
          sellingPrice: 0n,
          purchasePrice: 0n,
          gstPercent: BigInt(m.gstPercent),
          unit: m.unit === "bottle" ? Unit.bottle : Unit.strip,
          hsnCode: m.hsnCode,
          rackLocation: "",
        }) as Medicine,
    );
    const names = new Set(catalogOnly.map((m) => m.name.toLowerCase()));
    return {
      allMedicines: [...medicines, ...catalogOnly],
      catalogOnlyNames: names,
    };
  }, [medicines]);

  const filtered = allMedicines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_MED);
    setModalOpen(true);
  };
  const openEdit = (m: Medicine) => {
    setEditing(m);
    setForm({ ...m });
    setModalOpen(true);
  };
  const openFromCatalog = (m: Medicine) => {
    setEditing(null);
    setForm({ ...m, id: 0n });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await updateMut.mutateAsync(form);
        toast.success("Medicine updated");
      } else {
        await addMut.mutateAsync(form);
        toast.success("Medicine added");
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Error saving medicine");
    }
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteMut.mutateAsync(deleteTarget);
      toast.success("Medicine deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Error deleting");
    } finally {
      setDeleteTarget(null);
    }
  };

  const isPending = addMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-5" data-ocid="inventory.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            {medicines.length} saved · {allMedicines.length} total in catalog
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={openAdd}
            className="h-8 text-xs gap-1.5"
            data-ocid="inventory.add.button"
          >
            <Plus className="h-3.5 w-3.5" /> Add Medicine
          </Button>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center gap-3">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Medicine List
            </CardTitle>
            <div className="relative ml-auto w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                data-ocid="inventory.search_input"
                className="pl-8 h-7 text-xs"
                placeholder="Search medicine..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {["a", "b", "c", "d", "e"].map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table data-ocid="inventory.table">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  {[
                    "Name",
                    "Generic",
                    "Batch",
                    "Expiry",
                    "Stock",
                    "Reorder",
                    "Price (₹)",
                    "GST%",
                    "Status",
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
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-muted-foreground text-xs py-10"
                      data-ocid="inventory.empty_state"
                    >
                      {search
                        ? "No medicines match your search"
                        : "No medicines added yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((med, idx) => {
                    const isCatalog = catalogOnlyNames.has(
                      med.name.toLowerCase(),
                    );
                    return (
                      <TableRow
                        key={isCatalog ? `cat-${med.name}` : String(med.id)}
                        className="border-border text-[13px]"
                        data-ocid={`inventory.item.${idx + 1}`}
                      >
                        <TableCell className="pl-5 font-medium">
                          {med.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {med.genericName || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {med.batchNumber || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {med.expiryDate || "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {isCatalog ? "—" : String(med.currentStock)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {isCatalog ? "—" : String(med.reorderLevel)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {isCatalog ? "—" : String(med.sellingPrice)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {String(med.gstPercent)}%
                        </TableCell>
                        <TableCell>
                          {isCatalog ? (
                            <CatalogBadge />
                          ) : (
                            <StockBadge med={med} />
                          )}
                        </TableCell>
                        <TableCell className="pr-5">
                          <div className="flex items-center gap-1 justify-end">
                            {isCatalog ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary"
                                onClick={() => openFromCatalog(med)}
                                data-ocid={`inventory.add.button.${idx + 1}`}
                                title="Add to inventory"
                              >
                                <Plus className="h-3.5 w-3.5" /> Add
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => openEdit(med)}
                                  data-ocid={`inventory.edit_button.${idx + 1}`}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteTarget(med.id)}
                                  data-ocid={`inventory.delete_button.${idx + 1}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg" data-ocid="inventory.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Medicine" : "Add Medicine"}
            </DialogTitle>
          </DialogHeader>
          <MedicineForm value={form} onChange={setForm} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="inventory.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !form.name}
              data-ocid="inventory.save_button"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="inventory.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medicine?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="inventory.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="inventory.delete.confirm_button"
            >
              {deleteMut.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
