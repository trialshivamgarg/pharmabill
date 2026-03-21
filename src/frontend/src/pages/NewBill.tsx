import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  PackagePlus,
  Plus,
  Printer,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { toast } from "sonner";
import { INDIAN_MEDICINES } from "../data/indianMedicines";
import {
  type Medicine,
  PaymentMode,
  Unit,
  useAddCustomer,
  useAddMedicine,
  useCreateBill,
  useGetBills,
  useGetCustomers,
  useGetMedicines,
} from "../hooks/useQueries";

interface BillRow {
  medicineId: bigint;
  medicineName: string;
  batch: string;
  expiry: string;
  qty: number;
  unitPrice: number;
  gstPct: number;
  rowKey: string;
  isNewMedicine?: boolean;
}

function calcRow(row: BillRow) {
  const total = row.qty * row.unitPrice;
  const baseAmt = total / (1 + row.gstPct / 100);
  const gstAmt = total - baseAmt;
  return { subtotal: baseAmt, gstAmt, total };
}

let rowCounter = 0;
function newRow(): BillRow {
  rowCounter += 1;
  return {
    medicineId: 0n,
    medicineName: "",
    batch: "",
    expiry: "",
    qty: 1,
    unitPrice: 0,
    gstPct: 12,
    rowKey: String(rowCounter),
    isNewMedicine: false,
  };
}

interface NewMedForm {
  name: string;
  genericName: string;
  batchNumber: string;
  expiryDate: string;
  hsnCode: string;
  unit: Unit;
  sellingPrice: string;
  purchasePrice: string;
  gstPercent: string;
  currentStock: string;
}

const defaultMedForm = (): NewMedForm => ({
  name: "",
  genericName: "",
  batchNumber: "",
  expiryDate: "",
  hsnCode: "",
  unit: Unit.strip,
  sellingPrice: "",
  purchasePrice: "",
  gstPercent: "12",
  currentStock: "",
});

function todayStr() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function NewBill() {
  const { data: customers = [] } = useGetCustomers();
  const { data: medicines = [] } = useGetMedicines();
  const { data: allBills = [] } = useGetBills();
  const createBill = useCreateBill();
  const addCustomer = useAddCustomer();
  const addMedicine = useAddMedicine();

  const nextBillNo = useMemo(() => {
    if (!allBills.length) return 1;
    return Math.max(...allBills.map((b) => Number(b.billNumber))) + 1;
  }, [allBills]);

  const defaultBillNoStr = useMemo(
    () => `INV-${String(nextBillNo).padStart(4, "0")}`,
    [nextBillNo],
  );

  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(todayStr());

  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [rows, setRows] = useState<BillRow[]>([]);
  const [payment, setPayment] = useState<PaymentMode>(PaymentMode.cash);
  const [medSearch, setMedSearch] = useState("");
  const [medDropOpen, setMedDropOpen] = useState<string | null>(null);

  // Portal dropdown position
  const [dropPos, setDropPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  // Map of rowKey -> input element ref
  const medInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const setMedInputRef = useCallback(
    (rowKey: string, el: HTMLInputElement | null) => {
      if (el) {
        medInputRefs.current.set(rowKey, el);
      } else {
        medInputRefs.current.delete(rowKey);
      }
    },
    [],
  );

  // Recompute dropdown position when medDropOpen changes
  useEffect(() => {
    if (!medDropOpen) {
      setDropPos(null);
      return;
    }
    const inputEl = medInputRefs.current.get(medDropOpen);
    if (!inputEl) {
      setDropPos(null);
      return;
    }
    const rect = inputEl.getBoundingClientRect();
    setDropPos({
      top: rect.bottom, // anchor below input for downward dropdown
      left: rect.left,
      width: Math.max(rect.width, 300),
    });
  }, [medDropOpen]);

  // New Customer Dialog state
  const [newCustOpen, setNewCustOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustDoctor, setNewCustDoctor] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [isSavingCust, setIsSavingCust] = useState(false);

  // New Medicine Dialog state
  const [newMedOpen, setNewMedOpen] = useState(false);
  const [newMedRowKey, setNewMedRowKey] = useState<string | null>(null);
  const [newMedForm, setNewMedForm] = useState<NewMedForm>(defaultMedForm());
  const [isSavingMed, setIsSavingMed] = useState(false);

  // Save customer prompt state
  const [saveCustomerPromptOpen, setSaveCustomerPromptOpen] = useState(false);
  const [saveMedPromptOpen, setSaveMedPromptOpen] = useState(false);
  const [isSavingBill, setIsSavingBill] = useState(false);

  const pendingRowsRef = useRef<BillRow[]>([]);
  const pendingPaymentRef = useRef<PaymentMode>(PaymentMode.cash);

  const effectiveInvoiceNo = invoiceNo.trim() || defaultBillNoStr;

  const filteredMeds = useMemo(() => {
    const lower = medSearch.toLowerCase();
    const backendNames = new Set(medicines.map((m) => m.name.toLowerCase()));
    const backendMatches = medicines
      .filter((m) => m.name.toLowerCase().includes(lower))
      .slice(0, 8);
    if (backendMatches.length >= 8 || !lower) return backendMatches;
    const catalogMatches = INDIAN_MEDICINES.filter(
      (m) =>
        m.name.toLowerCase().includes(lower) &&
        !backendNames.has(m.name.toLowerCase()),
    )
      .slice(0, 8 - backendMatches.length)
      .map(
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
    return [...backendMatches, ...catalogMatches];
  }, [medicines, medSearch]);

  const filteredCustomers = useMemo(
    () =>
      customers
        .filter((c) =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()),
        )
        .slice(0, 8),
    [customers, customerSearch],
  );

  const addRow = () => setRows((r) => [...r, newRow()]);
  const removeRow = (key: string) =>
    setRows((r) => r.filter((row) => row.rowKey !== key));
  const updateRow = (key: string, patch: Partial<BillRow>) =>
    setRows((r) =>
      r.map((row) => (row.rowKey === key ? { ...row, ...patch } : row)),
    );

  const selectMedicine = async (key: string, med: Medicine) => {
    let resolvedId = med.id;
    if (med.id === -1n) {
      try {
        const newId = await addMedicine.mutateAsync({ ...med, id: 0n });
        resolvedId = newId ?? 0n;
      } catch {
        resolvedId = 0n;
      }
    }
    updateRow(key, {
      medicineId: resolvedId,
      medicineName: med.name,
      batch: med.batchNumber,
      expiry: med.expiryDate,
      unitPrice: Number(med.sellingPrice),
      gstPct: Number(med.gstPercent),
      isNewMedicine: false,
    });
    setMedDropOpen(null);
    setMedSearch("");
  };

  const openAddMedicineDialog = (rowKey: string, prefillName: string) => {
    setNewMedRowKey(rowKey);
    setNewMedForm({ ...defaultMedForm(), name: prefillName });
    setNewMedOpen(true);
    setMedDropOpen(null);
  };

  const patchMed = (field: keyof NewMedForm, value: string) =>
    setNewMedForm((f) => ({ ...f, [field]: value }));

  const handleSaveNewMedicine = async () => {
    if (!newMedForm.name.trim()) {
      toast.error("Medicine name is required");
      return;
    }
    setIsSavingMed(true);
    try {
      const medPayload: Medicine = {
        id: 0n,
        name: newMedForm.name.trim(),
        genericName: newMedForm.genericName.trim(),
        batchNumber: newMedForm.batchNumber.trim(),
        expiryDate: newMedForm.expiryDate.trim(),
        hsnCode: newMedForm.hsnCode.trim(),
        unit: newMedForm.unit,
        sellingPrice: BigInt(Math.round(Number(newMedForm.sellingPrice) || 0)),
        purchasePrice: BigInt(
          Math.round(Number(newMedForm.purchasePrice) || 0),
        ),
        gstPercent: BigInt(Math.round(Number(newMedForm.gstPercent) || 0)),
        currentStock: BigInt(Math.round(Number(newMedForm.currentStock) || 0)),
        reorderLevel: 10n,
        manufacturer: "",
        rackLocation: "",
      };
      const newId = await addMedicine.mutateAsync(medPayload);
      const createdMed: Medicine = { ...medPayload, id: newId ?? 0n };
      if (newMedRowKey) {
        updateRow(newMedRowKey, {
          medicineId: createdMed.id,
          medicineName: createdMed.name,
          batch: createdMed.batchNumber,
          expiry: createdMed.expiryDate,
          unitPrice: Number(createdMed.sellingPrice),
          gstPct: Number(createdMed.gstPercent),
          isNewMedicine: false,
        });
      }
      setNewMedOpen(false);
      toast.success(`${newMedForm.name.trim()} added to inventory`);
    } catch {
      toast.error("Failed to add medicine. Please try again.");
    } finally {
      setIsSavingMed(false);
    }
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let totalGst = 0;
    let grand = 0;
    for (const row of rows) {
      const c = calcRow(row);
      subtotal += c.subtotal;
      totalGst += c.gstAmt;
      grand += c.total;
    }
    return { subtotal, totalGst, grand };
  }, [rows]);

  const openNewCustomerDialog = () => {
    setNewCustName(patientName);
    setNewCustPhone(patientPhone);
    setNewCustDoctor(doctorName);
    setNewCustAddress("");
    setNewCustOpen(true);
  };

  const handleSaveNewCustomer = async () => {
    if (!newCustName.trim()) {
      toast.error("Patient name is required");
      return;
    }
    setIsSavingCust(true);
    try {
      const newId = await addCustomer.mutateAsync({
        id: 0n,
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        email: newCustDoctor.trim(),
        address: newCustAddress.trim(),
      });
      setCustomerId(String(newId ?? 0n));
      setPatientName(newCustName.trim());
      setPatientPhone(newCustPhone.trim());
      setDoctorName(newCustDoctor.trim());
      setNewCustOpen(false);
      toast.success("Customer saved successfully");
    } catch {
      toast.error("Failed to save customer. Please try again.");
    } finally {
      setIsSavingCust(false);
    }
  };

  const executeSave = async (
    resolvedCustomerId: bigint,
    currentRows: BillRow[],
    currentPayment: PaymentMode,
  ) => {
    const sub = currentRows.reduce((s, r) => s + calcRow(r).subtotal, 0);
    const gst = currentRows.reduce((s, r) => s + calcRow(r).gstAmt, 0);
    const grand = currentRows.reduce((s, r) => s + calcRow(r).total, 0);

    await createBill.mutateAsync({
      id: 0n,
      billNumber: BigInt(nextBillNo),
      billDate: BigInt(Date.now() * 1_000_000),
      customerId: resolvedCustomerId,
      paymentMode: currentPayment,
      subtotal: BigInt(Math.round(sub)),
      totalDiscount: 0n,
      totalGST: BigInt(Math.round(gst)),
      grandTotal: BigInt(Math.round(grand)),
      items: currentRows.map((r) => ({
        medicineId: r.medicineId,
        quantity: BigInt(r.qty),
        unitPrice: BigInt(r.unitPrice),
        discountPercent: 0n,
        gstAmount: BigInt(Math.round(calcRow(r).gstAmt)),
      })),
    });

    toast.success(`Bill ${effectiveInvoiceNo} saved successfully`);
    setRows([]);
    setCustomerId("");
    setCustomerSearch("");
    setPatientName("");
    setPatientPhone("");
    setDoctorName("");
    setDoctorRegNo("");
    setInvoiceNo("");
    setInvoiceDate(todayStr());
    setPayment(PaymentMode.cash);
  };

  const handlePromptSaveCustomer = async () => {
    setIsSavingBill(true);
    try {
      const newId = await addCustomer.mutateAsync({
        id: 0n,
        name: patientName.trim(),
        phone: patientPhone.trim(),
        email: doctorName.trim(),
        address: doctorRegNo.trim(),
      });
      await executeSave(
        newId ?? 0n,
        pendingRowsRef.current,
        pendingPaymentRef.current,
      );
      setSaveCustomerPromptOpen(false);
    } catch {
      toast.error("Failed to save bill. Please try again.");
    } finally {
      setIsSavingBill(false);
    }
  };

  const handlePromptSkipCustomer = async () => {
    setIsSavingBill(true);
    try {
      const newId = await addCustomer.mutateAsync({
        id: 0n,
        name: patientName.trim(),
        phone: patientPhone.trim(),
        email: doctorName.trim(),
        address: doctorRegNo.trim(),
      });
      await executeSave(
        newId ?? 0n,
        pendingRowsRef.current,
        pendingPaymentRef.current,
      );
      setSaveCustomerPromptOpen(false);
    } catch {
      toast.error("Failed to save bill. Please try again.");
    } finally {
      setIsSavingBill(false);
    }
  };

  const handleSave = async () => {
    if (!patientName.trim()) return toast.error("Please enter patient name");
    if (rows.length === 0) return toast.error("Add at least one medicine");
    if (rows.some((r) => r.medicineId === 0n))
      return toast.error("Please select a medicine for all rows");

    if (customerId) {
      setIsSavingBill(true);
      try {
        await executeSave(BigInt(customerId), rows, payment);
      } catch {
        toast.error("Failed to save bill. Please try again.");
      } finally {
        setIsSavingBill(false);
      }
      return;
    }

    pendingRowsRef.current = rows;
    pendingPaymentRef.current = payment;
    setSaveCustomerPromptOpen(true);
  };

  const selectedCustomer = customers.find((c) => String(c.id) === customerId);
  const isSaving =
    isSavingBill || createBill.isPending || addCustomer.isPending;

  // Customer purchase history for sidebar
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

  const medNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const med of medicines) m[String(med.id)] = med.name;
    return m;
  }, [medicines]);

  // Portal dropdown content
  const activeRowKey = medDropOpen;
  const showAddMedOption = activeRowKey !== null && medSearch.length > 0;
  const showPortalDropdown =
    activeRowKey !== null &&
    dropPos !== null &&
    (filteredMeds.length > 0 || showAddMedOption);

  return (
    <div className="flex gap-4" data-ocid="billing.page">
      <div className="flex-1 min-w-0 space-y-5">
        <div>
          <h1 className="text-2xl font-bold">New Bill</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Create a new pharmacy bill
          </p>
        </div>

        {/* New Customer Dialog */}
        <Dialog open={newCustOpen} onOpenChange={setNewCustOpen}>
          <DialogContent
            className="sm:max-w-md"
            data-ocid="billing.new_customer.dialog"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Add New Customer
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="nc-name" className="text-sm font-medium">
                  Patient Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nc-name"
                  data-ocid="billing.new_customer_name.input"
                  className="mt-1"
                  placeholder="Enter patient name"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleSaveNewCustomer()
                  }
                />
              </div>
              <div>
                <Label htmlFor="nc-phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="nc-phone"
                  data-ocid="billing.new_customer_phone.input"
                  className="mt-1"
                  placeholder="Enter phone number"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nc-doctor" className="text-sm font-medium">
                  Doctor Name
                </Label>
                <Input
                  id="nc-doctor"
                  data-ocid="billing.new_customer_doctor.input"
                  className="mt-1"
                  placeholder="Referring doctor"
                  value={newCustDoctor}
                  onChange={(e) => setNewCustDoctor(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nc-address" className="text-sm font-medium">
                  Address
                </Label>
                <Input
                  id="nc-address"
                  data-ocid="billing.new_customer_address.input"
                  className="mt-1"
                  placeholder="Patient address (optional)"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setNewCustOpen(false)}
                data-ocid="billing.new_customer_cancel.button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNewCustomer}
                disabled={isSavingCust}
                data-ocid="billing.new_customer_save.button"
              >
                {isSavingCust ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>Save Customer</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add New Medicine Dialog */}
        <Dialog
          open={newMedOpen}
          onOpenChange={(o) => {
            if (!isSavingMed) setNewMedOpen(o);
          }}
        >
          <DialogContent
            className="sm:max-w-lg"
            data-ocid="billing.new_medicine.dialog"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-primary" />
                Add New Medicine
              </DialogTitle>
              <DialogDescription>
                Add this medicine to inventory and it will be auto-selected in
                the bill.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="col-span-2">
                <Label htmlFor="nm-name" className="text-sm font-medium">
                  Medicine Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nm-name"
                  data-ocid="billing.new_medicine_name.input"
                  className="mt-1"
                  placeholder="e.g. Paracetamol 500mg"
                  value={newMedForm.name}
                  onChange={(e) => patchMed("name", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="nm-generic" className="text-sm font-medium">
                  Generic Name
                </Label>
                <Input
                  id="nm-generic"
                  data-ocid="billing.new_medicine_generic.input"
                  className="mt-1"
                  placeholder="e.g. Acetaminophen"
                  value={newMedForm.genericName}
                  onChange={(e) => patchMed("genericName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nm-batch" className="text-sm font-medium">
                  Batch Number
                </Label>
                <Input
                  id="nm-batch"
                  data-ocid="billing.new_medicine_batch.input"
                  className="mt-1"
                  placeholder="e.g. BT-2024"
                  value={newMedForm.batchNumber}
                  onChange={(e) => patchMed("batchNumber", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nm-expiry" className="text-sm font-medium">
                  Expiry Date
                </Label>
                <Input
                  id="nm-expiry"
                  data-ocid="billing.new_medicine_expiry.input"
                  className="mt-1"
                  placeholder="MM/YY"
                  value={newMedForm.expiryDate}
                  onChange={(e) => patchMed("expiryDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nm-hsn" className="text-sm font-medium">
                  HSN Code
                </Label>
                <Input
                  id="nm-hsn"
                  data-ocid="billing.new_medicine_hsn.input"
                  className="mt-1"
                  placeholder="e.g. 3004"
                  value={newMedForm.hsnCode}
                  onChange={(e) => patchMed("hsnCode", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Unit</Label>
                <Select
                  value={newMedForm.unit}
                  onValueChange={(v) => patchMed("unit", v)}
                >
                  <SelectTrigger
                    className="mt-1 h-9"
                    data-ocid="billing.new_medicine_unit.select"
                  >
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Unit.strip}>Strip</SelectItem>
                    <SelectItem value={Unit.tablet}>Tablet</SelectItem>
                    <SelectItem value={Unit.bottle}>Bottle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nm-sell" className="text-sm font-medium">
                  Selling Price (₹)
                </Label>
                <Input
                  id="nm-sell"
                  type="number"
                  min="0"
                  data-ocid="billing.new_medicine_selling_price.input"
                  className="mt-1"
                  placeholder="0.00"
                  value={newMedForm.sellingPrice}
                  onChange={(e) => patchMed("sellingPrice", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nm-purchase" className="text-sm font-medium">
                  Purchase Price (₹)
                </Label>
                <Input
                  id="nm-purchase"
                  type="number"
                  min="0"
                  data-ocid="billing.new_medicine_purchase_price.input"
                  className="mt-1"
                  placeholder="0.00"
                  value={newMedForm.purchasePrice}
                  onChange={(e) => patchMed("purchasePrice", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nm-gst" className="text-sm font-medium">
                  GST %
                </Label>
                <Input
                  id="nm-gst"
                  type="number"
                  min="0"
                  data-ocid="billing.new_medicine_gst.input"
                  className="mt-1"
                  placeholder="12"
                  value={newMedForm.gstPercent}
                  onChange={(e) => patchMed("gstPercent", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nm-stock" className="text-sm font-medium">
                  Stock Qty
                </Label>
                <Input
                  id="nm-stock"
                  type="number"
                  min="0"
                  data-ocid="billing.new_medicine_stock.input"
                  className="mt-1"
                  placeholder="0"
                  value={newMedForm.currentStock}
                  onChange={(e) => patchMed("currentStock", e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setNewMedOpen(false)}
                disabled={isSavingMed}
                data-ocid="billing.new_medicine_cancel.button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNewMedicine}
                disabled={isSavingMed}
                data-ocid="billing.new_medicine_save.button"
              >
                {isSavingMed ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>Add Medicine</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Save Customer Prompt Dialog */}
        <Dialog
          open={saveCustomerPromptOpen}
          onOpenChange={(o) => {
            if (!isSavingBill) setSaveCustomerPromptOpen(o);
          }}
        >
          <DialogContent
            className="sm:max-w-sm"
            data-ocid="billing.save_customer_prompt.dialog"
          >
            <DialogHeader>
              <DialogTitle>Save patient details?</DialogTitle>
              <DialogDescription className="pt-1">
                Do you want to save{" "}
                <span className="font-semibold text-foreground">
                  {patientName}
                </span>
                's details for future billing?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handlePromptSkipCustomer}
                disabled={isSavingBill}
                data-ocid="billing.just_this_bill.button"
              >
                {isSavingBill ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Just this bill"
                )}
              </Button>
              <Button
                className="flex-1"
                onClick={handlePromptSaveCustomer}
                disabled={isSavingBill}
                data-ocid="billing.save_and_continue.button"
              >
                {isSavingBill ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save & Continue"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Save Medicine Prompt Dialog */}
        <Dialog
          open={saveMedPromptOpen}
          onOpenChange={(o) => {
            if (!isSavingMed) setSaveMedPromptOpen(o);
          }}
        >
          <DialogContent
            className="sm:max-w-sm"
            data-ocid="billing.save_medicine_prompt.dialog"
          >
            <DialogHeader>
              <DialogTitle>Save medicine to inventory?</DialogTitle>
              <DialogDescription className="pt-1">
                Do you want to save this medicine to your inventory for future
                use?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSaveMedPromptOpen(false)}
                data-ocid="billing.skip_save_medicine.button"
              >
                No, skip
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setNewMedOpen(true);
                  setSaveMedPromptOpen(false);
                }}
                data-ocid="billing.confirm_save_medicine.button"
              >
                Yes, save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Bill header */}
          <Card className="xl:col-span-3 shadow-card">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                <div>
                  <Label
                    className="text-xs text-muted-foreground"
                    htmlFor="invoice-no"
                  >
                    Invoice No
                  </Label>
                  <Input
                    id="invoice-no"
                    data-ocid="billing.invoice_no.input"
                    className="h-8 text-sm mt-0.5 font-medium"
                    placeholder={defaultBillNoStr}
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                  />
                </div>

                <div>
                  <Label
                    className="text-xs text-muted-foreground"
                    htmlFor="invoice-date"
                  >
                    Date
                  </Label>
                  <Input
                    id="invoice-date"
                    data-ocid="billing.invoice_date.input"
                    className="h-8 text-sm mt-0.5"
                    placeholder="DD/MM/YYYY"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label
                    className="text-xs text-muted-foreground"
                    htmlFor="patient-name"
                  >
                    Patient Name *
                  </Label>
                  <Input
                    id="patient-name"
                    data-ocid="billing.patient_name.input"
                    className="h-8 text-sm mt-0.5"
                    placeholder="Patient name..."
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </div>

                <div>
                  <Label
                    className="text-xs text-muted-foreground"
                    htmlFor="patient-phone"
                  >
                    Patient Phone
                  </Label>
                  <Input
                    id="patient-phone"
                    data-ocid="billing.patient_phone.input"
                    className="h-8 text-sm mt-0.5"
                    placeholder="Phone number..."
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                  />
                </div>

                <div>
                  <Label
                    className="text-xs text-muted-foreground"
                    htmlFor="doctor-name"
                  >
                    Doctor Name
                  </Label>
                  <Input
                    id="doctor-name"
                    data-ocid="billing.doctor_name.input"
                    className="h-8 text-sm mt-0.5"
                    placeholder="Doctor name..."
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                  />
                </div>

                <div>
                  <Label
                    className="text-xs text-muted-foreground"
                    htmlFor="doctor-reg-no"
                  >
                    Doctor Reg No
                  </Label>
                  <Input
                    id="doctor-reg-no"
                    data-ocid="billing.doctor_reg_no.input"
                    className="h-8 text-sm mt-0.5"
                    placeholder="e.g. MCI-12345"
                    value={doctorRegNo}
                    onChange={(e) => setDoctorRegNo(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Existing Customer
                  </Label>
                  <div className="relative mt-0.5 flex gap-1">
                    <div className="relative flex-1">
                      <Input
                        data-ocid="billing.customer.input"
                        className="h-8 text-sm"
                        placeholder="Search existing..."
                        value={
                          selectedCustomer
                            ? selectedCustomer.name
                            : customerSearch
                        }
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setCustomerId("");
                        }}
                        onFocus={(_e) => {
                          if (selectedCustomer)
                            setCustomerSearch(selectedCustomer.name);
                        }}
                      />
                      {!customerId &&
                        customerSearch &&
                        filteredCustomers.length > 0 && (
                          <div className="absolute z-20 left-0 right-0 bg-popover border border-border rounded shadow-lg overflow-hidden top-full mt-0.5">
                            {filteredCustomers.map((c) => (
                              <button
                                type="button"
                                key={String(c.id)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                                onClick={() => {
                                  setCustomerId(String(c.id));
                                  setCustomerSearch("");
                                  setPatientName(c.name);
                                  setPatientPhone(c.phone);
                                  setDoctorName(c.email);
                                }}
                                data-ocid="billing.customer.select"
                              >
                                <span className="font-medium">{c.name}</span>
                                <span className="text-muted-foreground text-xs ml-2">
                                  {c.phone}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 shrink-0 text-primary border-primary hover:bg-primary/10"
                      onClick={openNewCustomerDialog}
                      title="Add new customer"
                      data-ocid="billing.new_customer.open_modal_button"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {customerId && (
                    <p className="text-[10px] text-green-600 mt-0.5">
                      ✓ Customer linked
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items table */}
          <Card className="xl:col-span-3 shadow-card">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Bill Items
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={addRow}
                  data-ocid="billing.add_row.button"
                >
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 min-h-[420px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    {[
                      "Medicine",
                      "Batch",
                      "Expiry",
                      "Qty",
                      "Unit Price (₹)",
                      "GST %",
                      "GST Amt (₹)",
                      "Total (₹)",
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
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-muted-foreground text-xs py-8"
                        data-ocid="billing.items.empty_state"
                      >
                        Click &quot;Add Item&quot; to start adding medicines
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, idx) => {
                      const c = calcRow(row);
                      const currentSearch =
                        medDropOpen === row.rowKey
                          ? medSearch
                          : row.medicineName;
                      return (
                        <TableRow
                          key={row.rowKey}
                          className="border-border"
                          data-ocid={`billing.item.${idx + 1}`}
                        >
                          <TableCell className="pl-5 w-44">
                            <Input
                              ref={(el) => setMedInputRef(row.rowKey, el)}
                              className="h-7 text-xs"
                              placeholder="Search medicine..."
                              value={currentSearch}
                              onChange={(e) => {
                                setMedSearch(e.target.value);
                                setMedDropOpen(row.rowKey);
                                updateRow(row.rowKey, {
                                  medicineName: e.target.value,
                                  medicineId: 0n,
                                });
                              }}
                              onFocus={() => {
                                setMedDropOpen(row.rowKey);
                                setMedSearch(row.medicineName);
                              }}
                              onBlur={() => {
                                setTimeout(() => setMedDropOpen(null), 200);
                              }}
                              data-ocid="billing.medicine_search.input"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-7 text-xs w-24"
                              placeholder="Batch no."
                              value={row.batch}
                              onChange={(e) =>
                                updateRow(row.rowKey, { batch: e.target.value })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-7 text-xs w-20"
                              placeholder="MM/YY"
                              value={row.expiry}
                              onChange={(e) =>
                                updateRow(row.rowKey, {
                                  expiry: e.target.value,
                                })
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
                                updateRow(row.rowKey, {
                                  qty: Number.parseInt(e.target.value) || 1,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              className="h-7 text-xs w-20"
                              value={row.unitPrice}
                              onChange={(e) =>
                                updateRow(row.rowKey, {
                                  unitPrice:
                                    Number.parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {row.gstPct}%
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {c.gstAmt.toFixed(2)}
                          </TableCell>
                          <TableCell className="font-semibold text-xs">
                            {c.total.toFixed(2)}
                          </TableCell>
                          <TableCell className="pr-5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={() => removeRow(row.rowKey)}
                              data-ocid={`billing.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary + Payment */}
          <div className="xl:col-span-3 flex flex-col md:flex-row gap-5">
            {/* Payment mode */}
            <Card className="shadow-card flex-1">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Payment Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <RadioGroup
                  value={payment}
                  onValueChange={(v) => setPayment(v as PaymentMode)}
                  className="flex gap-6 mt-1"
                >
                  {(
                    [
                      PaymentMode.cash,
                      PaymentMode.card,
                      PaymentMode.UPI,
                    ] as PaymentMode[]
                  ).map((mode) => (
                    <div key={mode} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={mode}
                        id={`pm-${mode}`}
                        data-ocid={`billing.payment_${mode}.radio`}
                      />
                      <Label
                        htmlFor={`pm-${mode}`}
                        className="capitalize cursor-pointer font-medium"
                      >
                        {mode}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Bill summary */}
            <Card
              className="shadow-card w-full md:w-80"
              data-ocid="billing.summary.card"
            >
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Bill Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-4 space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Taxable Amt</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Total GST</span>
                  <span>₹{totals.totalGst.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Grand Total</span>
                  <span className="text-primary">
                    ₹{totals.grand.toFixed(2)}
                  </span>
                </div>
                <Button
                  className="w-full mt-2 gap-2"
                  onClick={handleSave}
                  disabled={isSaving}
                  data-ocid="billing.save.button"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Printer className="h-4 w-4" /> Save Bill
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* end flex-1 main content */}

      {/* Customer Purchase History Sidebar */}
      {patientName.length >= 2 && (
        <div
          className="w-72 flex-shrink-0"
          data-ocid="billing.customer_history.panel"
        >
          <div className="bg-white rounded-lg border border-border shadow-card sticky top-0">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Purchase History
                </span>
              </div>
              <p className="text-xs font-medium text-foreground mt-1 truncate">
                {patientName}
              </p>
            </div>
            <ScrollArea className="h-[calc(100vh-260px)]">
              <div className="p-2">
                {customerHistory.length === 0 ? (
                  <div
                    className="text-xs text-muted-foreground text-center py-8"
                    data-ocid="billing.customer_history.empty_state"
                  >
                    No previous purchase history
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerHistory.map((bill, bIdx) => {
                      const billDate = new Date(
                        Number(bill.billDate) / 1_000_000,
                      ).toLocaleDateString("en-IN");
                      const billNoStr = `INV-${String(Number(bill.billNumber)).padStart(4, "0")}`;
                      return (
                        <div
                          key={String(bill.id)}
                          className="p-2 rounded border border-border bg-muted/30 text-xs"
                          data-ocid={`billing.customer_history.item.${bIdx + 1}`}
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
                                  {medNameMap[String(item.medicineId)] ??
                                    "Unknown"}
                                </span>
                                <span className="text-muted-foreground ml-1">
                                  x{String(item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Portal-based medicine search dropdown — always floats above everything */}
      {showPortalDropdown &&
        dropPos &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "fixed",
              top: `${dropPos.top + 4}px`,
              left: `${dropPos.left}px`,
              width: `${dropPos.width}px`,
              minWidth: "300px",
              zIndex: 9999,
            }}
            className="bg-popover border border-border rounded-md shadow-xl overflow-hidden"
            data-ocid="billing.medicine_search.popover"
          >
            {/* Header hint */}
            <div className="px-3 py-1.5 bg-muted/50 border-b border-border flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                Select Medicine
              </span>
              {medSearch && (
                <span className="text-[10px] text-muted-foreground">
                  {filteredMeds.length} result
                  {filteredMeds.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="overflow-y-auto max-h-64">
              {filteredMeds.map((m) => (
                <button
                  type="button"
                  key={String(m.id) + m.name}
                  className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors border-b border-border/40 last:border-0"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    activeRowKey && selectMedicine(activeRowKey, m)
                  }
                >
                  <div className="font-medium text-sm leading-tight">
                    {m.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-muted-foreground text-xs">
                      {m.unit}
                    </span>
                    {Number(m.sellingPrice) > 0 && (
                      <span className="text-muted-foreground text-xs">
                        MRP ₹{String(m.sellingPrice)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {showAddMedOption && (
                <>
                  {filteredMeds.length > 0 && (
                    <div className="border-t border-border" />
                  )}
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-primary/10 text-primary font-medium flex items-center gap-2 transition-colors"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      activeRowKey &&
                      openAddMedicineDialog(activeRowKey, medSearch)
                    }
                    data-ocid="billing.add_new_medicine.button"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-sm">
                      Add &quot;{medSearch}&quot; as new medicine
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
