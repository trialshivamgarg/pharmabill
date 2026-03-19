import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Plus, Trash2, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Distributor } from "../backend.d";
import {
  useAddDistributor,
  useDeleteDistributor,
  useGetDistributors,
  useUpdateDistributor,
} from "../hooks/useQueries";

const EMPTY: Omit<Distributor, "id"> = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  gstNumber: "",
  drugLicenseNumber: "",
};

export default function Distributors() {
  const { data: distributors, isLoading } = useGetDistributors();
  const addDist = useAddDistributor();
  const updateDist = useUpdateDistributor();
  const deleteDist = useDeleteDistributor();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Distributor | null>(null);
  const [form, setForm] = useState<Omit<Distributor, "id">>(EMPTY);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  }

  function openEdit(dist: Distributor) {
    setEditing(dist);
    setForm({
      name: dist.name,
      contactPerson: dist.contactPerson,
      phone: dist.phone,
      email: dist.email,
      address: dist.address,
      gstNumber: dist.gstNumber,
      drugLicenseNumber: dist.drugLicenseNumber,
    });
    setDialogOpen(true);
  }

  function handleField(k: keyof Omit<Distributor, "id">, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSave() {
    try {
      if (editing) {
        await updateDist.mutateAsync({ ...form, id: editing.id });
      } else {
        await addDist.mutateAsync({ ...form, id: 0n });
      }
      toast.success(editing ? "Distributor updated" : "Distributor added");
      setDialogOpen(false);
    } catch {
      setDialogOpen(false);
    }
  }

  async function handleDelete(id: bigint) {
    try {
      await deleteDist.mutateAsync(id);
      toast.success("Distributor deleted");
    } catch {
      // silently handle
    }
  }

  const saving = addDist.isPending || updateDist.isPending;

  return (
    <div className="space-y-5" data-ocid="distributors.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Distributors
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Manage your medicine suppliers and distributors
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="gap-2"
          data-ocid="distributors.add.button"
        >
          <Plus className="h-4 w-4" /> Add Distributor
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <Table data-ocid="distributors.table">
          <TableHeader>
            <TableRow className="bg-accent/60 hover:bg-accent/60">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide">
                Name
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide">
                Contact Person
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide">
                Phone
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide">
                GST No
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide">
                Drug License No
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3].map((k) => (
                <TableRow key={k}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : !distributors || distributors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground text-sm py-12"
                  data-ocid="distributors.empty_state"
                >
                  No distributors yet. Click "Add Distributor" to get started.
                </TableCell>
              </TableRow>
            ) : (
              distributors.map((dist, idx) => (
                <TableRow
                  key={String(dist.id)}
                  className="border-border"
                  data-ocid={`distributors.item.${idx + 1}`}
                >
                  <TableCell className="font-semibold text-[13px]">
                    {dist.name}
                  </TableCell>
                  <TableCell className="text-[13px]">
                    {dist.contactPerson}
                  </TableCell>
                  <TableCell className="text-[13px]">{dist.phone}</TableCell>
                  <TableCell className="text-[13px] font-mono text-xs">
                    {dist.gstNumber || "—"}
                  </TableCell>
                  <TableCell className="text-[13px] font-mono text-xs">
                    {dist.drugLicenseNumber || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(dist)}
                        className="h-7 w-7 p-0"
                        data-ocid={`distributors.edit_button.${idx + 1}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            data-ocid={`distributors.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-ocid="distributors.dialog">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Distributor
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete{" "}
                              <strong>{dist.name}</strong>? This action cannot
                              be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="distributors.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(dist.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              data-ocid="distributors.confirm_button"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" data-ocid="distributors.modal">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Distributor" : "Add New Distributor"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="dist-name">Company Name *</Label>
              <Input
                id="dist-name"
                value={form.name}
                onChange={(e) => handleField("name", e.target.value)}
                placeholder="ABC Pharma Distributors"
                data-ocid="distributors.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dist-contact">Contact Person</Label>
              <Input
                id="dist-contact"
                value={form.contactPerson}
                onChange={(e) => handleField("contactPerson", e.target.value)}
                placeholder="Rajesh Kumar"
                data-ocid="distributors.contact_person.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dist-phone">Phone</Label>
              <Input
                id="dist-phone"
                value={form.phone}
                onChange={(e) => handleField("phone", e.target.value)}
                placeholder="9876543210"
                data-ocid="distributors.phone.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dist-email">Email</Label>
              <Input
                id="dist-email"
                type="email"
                value={form.email}
                onChange={(e) => handleField("email", e.target.value)}
                placeholder="info@abcpharma.com"
                data-ocid="distributors.email.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dist-gst">GST Number</Label>
              <Input
                id="dist-gst"
                value={form.gstNumber}
                onChange={(e) =>
                  handleField("gstNumber", e.target.value.toUpperCase())
                }
                placeholder="27AAAAA0000A1Z5"
                data-ocid="distributors.gst.input"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="dist-drug">Drug License Number</Label>
              <Input
                id="dist-drug"
                value={form.drugLicenseNumber}
                onChange={(e) =>
                  handleField("drugLicenseNumber", e.target.value)
                }
                placeholder="MH/DL/2024/12345"
                data-ocid="distributors.drug_license.input"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="dist-address">Address</Label>
              <Input
                id="dist-address"
                value={form.address}
                onChange={(e) => handleField("address", e.target.value)}
                placeholder="123, Industrial Area, Mumbai"
                data-ocid="distributors.address.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="distributors.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              data-ocid="distributors.save.button"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {saving ? "Saving..." : editing ? "Update" : "Add Distributor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
