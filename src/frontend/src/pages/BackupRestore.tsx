import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { getPharmacyProfile } from "../hooks/usePharmacyProfile";
import {
  useAddCustomer,
  useAddDistributor,
  useAddMedicine,
  useAddPurchase,
  useCreateBill,
  useGetBills,
  useGetCustomers,
  useGetDistributors,
  useGetMedicines,
  useGetPurchases,
} from "../hooks/useQueries";

// Safe bigint serializer
function replacer(_key: string, value: unknown) {
  if (typeof value === "bigint") return { __bigint: value.toString() };
  return value;
}
function reviver(_key: string, value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "__bigint" in (value as Record<string, unknown>)
  ) {
    return BigInt((value as Record<string, string>).__bigint);
  }
  return value;
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escapeCell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escapeCell(r[h])).join(",")),
  ];
  return lines.join("\n");
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function bigintSafeRows(arr: unknown[]): Record<string, unknown>[] {
  return arr.map((item) => {
    const obj = item as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (typeof v === "bigint") out[k] = v.toString();
      else if (Array.isArray(v)) out[k] = JSON.stringify(v, replacer);
      else if (v !== null && typeof v === "object")
        out[k] = JSON.stringify(v, replacer);
      else out[k] = v;
    }
    return out;
  });
}

export default function BackupRestorePage() {
  const { data: medicines = [] } = useGetMedicines();
  const { data: customers = [] } = useGetCustomers();
  const { data: bills = [] } = useGetBills();
  const { data: distributors = [] } = useGetDistributors();
  const { data: purchases = [] } = useGetPurchases();

  const addMedicine = useAddMedicine();
  const addCustomer = useAddCustomer();
  const createBill = useCreateBill();
  const addDistributor = useAddDistributor();
  const addPurchase = useAddPurchase();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);

  const dateStr = new Date().toISOString().slice(0, 10);

  function handleDownloadJSON() {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      pharmacyProfile: getPharmacyProfile(),
      medicines,
      customers,
      bills,
      distributors,
      purchases,
    };
    downloadFile(
      JSON.stringify(backup, replacer, 2),
      `pharma-backup-${dateStr}.json`,
      "application/json",
    );
    toast.success("JSON backup downloaded successfully.");
  }

  function handleDownloadCSV() {
    const sections: { name: string; rows: unknown[] }[] = [
      { name: "medicines", rows: medicines },
      { name: "customers", rows: customers },
      { name: "bills", rows: bills },
      { name: "distributors", rows: distributors },
      { name: "purchases", rows: purchases },
    ];
    let count = 0;
    for (const s of sections) {
      if (s.rows.length > 0) {
        const csv = toCSV(bigintSafeRows(s.rows));
        downloadFile(csv, `pharma-${s.name}-${dateStr}.csv`, "text/csv");
        count++;
      }
    }
    if (count === 0) {
      toast.info("No data to export.");
    } else {
      toast.success(`${count} CSV file(s) downloaded.`);
    }
  }

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      toast.error("Only JSON backup files can be restored.");
      return;
    }
    setRestoring(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text, reviver) as {
        version: number;
        pharmacyProfile?: unknown;
        medicines?: unknown[];
        customers?: unknown[];
        bills?: unknown[];
        distributors?: unknown[];
        purchases?: unknown[];
      };

      // Restore pharmacy profile
      if (backup.pharmacyProfile) {
        const { savePharmacyProfile } = await import(
          "../hooks/usePharmacyProfile"
        );
        savePharmacyProfile(
          backup.pharmacyProfile as Parameters<typeof savePharmacyProfile>[0],
        );
      }

      // Merge medicines (skip existing IDs)
      const existingMedIds = new Set(medicines.map((m) => String(m.id)));
      let medsAdded = 0;
      for (const med of backup.medicines ?? []) {
        const m = med as (typeof medicines)[0];
        if (!existingMedIds.has(String(m.id))) {
          await addMedicine.mutateAsync(m);
          medsAdded++;
        }
      }

      // Merge customers
      const existingCustIds = new Set(customers.map((c) => String(c.id)));
      let custsAdded = 0;
      for (const cust of backup.customers ?? []) {
        const c = cust as (typeof customers)[0];
        if (!existingCustIds.has(String(c.id))) {
          await addCustomer.mutateAsync(c);
          custsAdded++;
        }
      }

      // Merge distributors
      const existingDistIds = new Set(distributors.map((d) => String(d.id)));
      let distsAdded = 0;
      for (const dist of backup.distributors ?? []) {
        const d = dist as (typeof distributors)[0];
        if (!existingDistIds.has(String(d.id))) {
          await addDistributor.mutateAsync(d);
          distsAdded++;
        }
      }

      // Merge bills
      const existingBillIds = new Set(bills.map((b) => String(b.id)));
      let billsAdded = 0;
      for (const bill of backup.bills ?? []) {
        const b = bill as (typeof bills)[0];
        if (!existingBillIds.has(String(b.id))) {
          await createBill.mutateAsync(b);
          billsAdded++;
        }
      }

      // Merge purchases
      const existingPurchaseIds = new Set(purchases.map((p) => String(p.id)));
      let purchasesAdded = 0;
      for (const purchase of backup.purchases ?? []) {
        const p = purchase as (typeof purchases)[0];
        if (!existingPurchaseIds.has(String(p.id))) {
          await addPurchase.mutateAsync(p);
          purchasesAdded++;
        }
      }

      toast.success(
        `Restore complete: ${medsAdded} medicines, ${custsAdded} customers, ${distsAdded} distributors, ${billsAdded} bills, ${purchasesAdded} purchases merged.`,
      );
    } catch (err) {
      toast.error(
        "Restore failed. Please check the backup file and try again.",
      );
      console.error(err);
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const totalRecords =
    medicines.length +
    customers.length +
    bills.length +
    distributors.length +
    purchases.length;

  const STATS = [
    { label: "Medicines", count: medicines.length },
    { label: "Customers", count: customers.length },
    { label: "Bills", count: bills.length },
    { label: "Distributors", count: distributors.length },
    { label: "Purchases", count: purchases.length },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Backup & Restore</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Export all your pharmacy data or restore from a previous backup.
        </p>
      </div>

      {/* Summary */}
      <Card className="border-border">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Database className="h-4 w-4" /> Current Data Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-foreground">{s.count}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 text-center">
            Total: {totalRecords} records + pharmacy profile
          </p>
        </CardContent>
      </Card>

      {/* Backup */}
      <Card className="border-border">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Download className="h-4 w-4" /> Backup Data
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Download all your data (medicines, customers, bills, distributors,
            purchases, pharmacy profile) as a backup file.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownloadJSON}
              className="flex-1 gap-2"
              variant="default"
            >
              <FileJson className="h-4 w-4" />
              Download JSON Backup
            </Button>
            <Button
              onClick={handleDownloadCSV}
              className="flex-1 gap-2"
              variant="outline"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download CSV Files
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            <strong>JSON</strong> — Full backup, can be re-imported. &nbsp;
            <strong>CSV</strong> — Spreadsheet format for viewing in Excel.
            Multiple files, one per data type.
          </p>
        </CardContent>
      </Card>

      {/* Restore */}
      <Card className="border-border">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Upload className="h-4 w-4" /> Restore Data
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Restore from a JSON backup file. Existing records will be kept —
            only new records from the backup will be merged in.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleRestore}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={restoring}
            variant="outline"
            className="gap-2 w-full sm:w-auto"
          >
            <Upload className="h-4 w-4" />
            {restoring ? "Restoring..." : "Select JSON Backup to Restore"}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Only JSON backup files created by PharmaBill can be imported. CSV
            files cannot be restored.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
