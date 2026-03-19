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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Loader2, Plus, Search, Trash2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Customer,
  useAddCustomer,
  useDeleteCustomer,
  useGetCustomers,
  useUpdateCustomer,
} from "../hooks/useQueries";

const EMPTY: Customer = { id: 0n, name: "", email: "", phone: "", address: "" };

export default function Customers() {
  const { data: customers = [], isLoading } = useGetCustomers();
  const addMut = useAddCustomer();
  const updateMut = useUpdateCustomer();
  const deleteMut = useDeleteCustomer();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<Customer>(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };
  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ ...c });
    setModalOpen(true);
  };
  const set = (field: keyof Customer, v: string) =>
    setForm((f) => ({ ...f, [field]: v }));

  const handleSave = async () => {
    try {
      if (editing) {
        await updateMut.mutateAsync(form);
        toast.success("Customer updated");
      } else {
        await addMut.mutateAsync(form);
        toast.success("Customer added");
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Error saving customer");
    }
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteMut.mutateAsync(deleteTarget);
      toast.success("Customer deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Error deleting");
    } finally {
      setDeleteTarget(null);
    }
  };

  const isPending = addMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-5" data-ocid="customers.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            {customers.length} customers registered
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="h-8 text-xs gap-1.5"
          data-ocid="customers.add.button"
        >
          <Plus className="h-3.5 w-3.5" /> Add Customer
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center gap-3">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <User className="h-3.5 w-3.5" /> Customer List
            </CardTitle>
            <div className="relative ml-auto w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                data-ocid="customers.search_input"
                className="pl-8 h-7 text-xs"
                placeholder="Search customer..."
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
            <Table data-ocid="customers.table">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  {["Name", "Phone", "Email", "Address", ""].map((h) => (
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
                      colSpan={5}
                      className="text-center text-muted-foreground text-xs py-10"
                      data-ocid="customers.empty_state"
                    >
                      {search
                        ? "No customers match your search"
                        : "No customers added yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c, idx) => (
                    <TableRow
                      key={String(c.id)}
                      className="border-border text-[13px]"
                      data-ocid={`customers.item.${idx + 1}`}
                    >
                      <TableCell className="pl-5 font-medium">
                        {c.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.phone || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.email || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {c.address || "—"}
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => openEdit(c)}
                            data-ocid={`customers.edit_button.${idx + 1}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(c.id)}
                            data-ocid={`customers.delete_button.${idx + 1}`}
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
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md" data-ocid="customers.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Customer" : "Add Customer"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Full Name *</Label>
              <Input
                data-ocid="customers.name.input"
                className="mt-1 h-8 text-sm"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Ramesh Kumar"
              />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input
                data-ocid="customers.phone.input"
                className="mt-1 h-8 text-sm"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                data-ocid="customers.email.input"
                type="email"
                className="mt-1 h-8 text-sm"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Address</Label>
              <Textarea
                data-ocid="customers.address.textarea"
                className="mt-1 text-sm"
                rows={2}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="customers.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending || !form.name}
              data-ocid="customers.save_button"
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
        <AlertDialogContent data-ocid="customers.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="customers.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="customers.delete.confirm_button"
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
