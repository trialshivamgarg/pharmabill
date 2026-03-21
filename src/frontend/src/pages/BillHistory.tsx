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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
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
  Loader2,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { toast } from "sonner";
import { getCache, setCache } from "../hooks/useOfflineStore";
import { getPharmacyProfile } from "../hooks/usePharmacyProfile";
import {
  type Bill,
  type Customer,
  type Medicine,
  useDeleteBill,
  useGetBills,
  useGetCustomers,
  useGetMedicines,
  useUpdateBill,
} from "../hooks/useQueries";

// ─── helpers ────────────────────────────────────────────────────────────────

function billNo(n: bigint) {
  return `INV-${String(Number(n)).padStart(4, "0")}`;
}
function fmtDate(ns: bigint) {
  const d = new Date(Number(ns) / 1_000_000);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
function fmtCurrency(n: bigint) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertToWords(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100)
    return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
  if (n < 1000)
    return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ` and ${convertToWords(n % 100)}` : ""}`;
  if (n < 100000)
    return `${convertToWords(Math.floor(n / 1000))} Thousand${n % 1000 ? ` ${convertToWords(n % 1000)}` : ""}`;
  if (n < 10000000)
    return `${convertToWords(Math.floor(n / 100000))} Lakh${n % 100000 ? ` ${convertToWords(n % 100000)}` : ""}`;
  return `${convertToWords(Math.floor(n / 10000000))} Crore${n % 10000000 ? ` ${convertToWords(n % 10000000)}` : ""}`;
}

function numberToWords(num: number): string {
  if (num === 0) return "Rs. Zero only";
  return `Rs. ${convertToWords(Math.round(num))} only`;
}

function getPackStr(unit: string): string {
  if (unit === "strip") return "1*15";
  if (unit === "bottle") return "1*1";
  return "1x10";
}

function buildInvoiceHtml(
  bill: Bill,
  custMap: Record<string, Customer>,
  medMap: Record<string, Medicine>,
): string {
  const cust = custMap[String(bill.customerId)];
  const profile = getPharmacyProfile();
  const grandTotalNum = Math.round(Number(bill.grandTotal));
  const subtotalNum = Number(bill.subtotal);
  const totalGSTNum = Number(bill.totalGST);
  const sgst = totalGSTNum / 2;
  const cgst = totalGSTNum / 2;
  const roundoff = grandTotalNum - (subtotalNum + totalGSTNum);
  const amountInWords = numberToWords(grandTotalNum);

  const baseTaxable = subtotalNum;
  const gstSummary = `GST ${baseTaxable.toFixed(2)}*2.5+2.5%=${sgst.toFixed(2)}SGST+${cgst.toFixed(2)}CGST`;

  const patientName = cust?.name ?? "Walk-in Customer";
  const patientPhone = cust?.phone ?? "—";
  const doctorName = cust?.email ?? "—";
  const doctorRegNo = cust?.address ?? "—";

  const itemRows = bill.items
    .map((item, idx) => {
      const med = medMap[String(item.medicineId)];
      const qty = Number(item.quantity);
      const mrp = Number(item.unitPrice);
      const gstPct = Number(med?.gstPercent ?? 5);
      const halfGst = gstPct / 2;
      const amount = qty * mrp;
      const pack = getPackStr(med?.unit ?? "tablet");
      const batch = (med as any)?.batchNumber ?? "";
      const expiry = (med as any)?.expiryDate ?? "";
      return `
        <tr>
          <td style="text-align:center;padding:2px 3px;border-left:1px solid #bbb;border-right:1px solid #bbb">${idx + 1}.</td>
          <td style="padding:2px 5px;border-left:1px solid #bbb;border-right:1px solid #bbb">${med?.name ?? "Unknown"}</td>
          <td style="text-align:center;padding:2px 3px;border-left:1px solid #bbb;border-right:1px solid #bbb">${pack}</td>
          <td style="text-align:center;padding:2px 3px;border-left:1px solid #bbb;border-right:1px solid #bbb">${batch}</td>
          <td style="text-align:center;padding:2px 3px;border-left:1px solid #bbb;border-right:1px solid #bbb">${expiry}</td>
          <td style="text-align:center;padding:2px 3px;border-left:1px solid #bbb;border-right:1px solid #bbb">${qty}</td>
          <td style="text-align:right;padding:2px 5px;border-left:1px solid #bbb;border-right:1px solid #bbb">${mrp.toFixed(2)}</td>
          <td style="text-align:right;padding:2px 5px;border-left:1px solid #bbb;border-right:1px solid #bbb">${mrp.toFixed(2)}</td>
          <td style="text-align:center;padding:2px 3px;border-left:1px solid #bbb;border-right:1px solid #bbb">${halfGst.toFixed(2)}</td>
          <td style="text-align:center;padding:2px 3px;border-left:1px solid #bbb;border-right:1px solid #bbb">${halfGst.toFixed(2)}</td>
          <td style="text-align:right;padding:2px 5px;border-left:1px solid #bbb;border-right:1px solid #bbb">${amount.toFixed(2)}</td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>GST Invoice - ${billNo(bill.billNumber)}</title>
  <style>
    @media print {
      body { margin: 0; }
      @page { margin: 8mm; size: A4; }
      .no-print { display: none !important; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #000;
      background: #fff;
      margin: 10px;
      max-width: 210mm;
    }
    .outer-border { border: 3px solid #000; }
    table.items {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    table.items th {
      background: #c8e6c9;
      border: 1px solid #888;
      padding: 4px 3px;
      text-align: center;
      font-weight: bold;
      font-size: 9.5px;
      white-space: nowrap;
    }
    table.totals { border-collapse: collapse; width: 100%; }
    table.totals td { padding: 2px 8px; font-size: 11px; border-bottom: 1px solid #ddd; }
    table.totals tr.grand td {
      font-size: 12px; font-weight: bold;
      background: #e0e0e0; border-top: 2px solid #000; padding: 4px 8px;
    }
  </style>
</head>
<body>
<div class="outer-border">

  <table style="width:100%;border-collapse:collapse;border-bottom:2px solid #000">
    <tr>
      <td style="width:50%;padding:6px 10px;vertical-align:top">
        <div style="font-size:17px;font-weight:bold;color:#0a2a6e;text-transform:uppercase;letter-spacing:0.5px">${profile.name}</div>
        <div style="color:#0a2a6e;font-size:10px;margin-top:2px">${profile.address1}${profile.address2 ? `, ${profile.address2}` : ""}</div>
        <div style="color:#0a2a6e;font-size:10px;margin-top:2px">Phone : ${profile.phone}</div>
        <div style="color:#0a2a6e;font-size:10px;margin-top:2px">E-Mail : ${profile.email}</div>
      </td>
      <td style="width:50%;padding:6px 10px 6px 13%;vertical-align:top">
        <div style="font-size:11px;font-weight:bold;margin-bottom:3px"><strong>Patient Name : ${patientName}</strong></div>
        <div style="font-size:10.5px;margin-bottom:3px">Patient PH. NO &nbsp;${patientPhone}</div>
        <div style="font-size:10.5px;margin-bottom:3px">Dr Name : ${doctorName}</div>
        <div style="font-size:10.5px">Dr Reg No. ${doctorRegNo}</div>
      </td>
    </tr>
  </table>

  <table style="width:100%;border-collapse:collapse;border-bottom:2px solid #000">
    <tr>
      <td style="width:35%;padding:5px 10px;vertical-align:middle;border-right:2px solid #000">
        <div style="font-size:10px;color:#333">D.L.No. : <strong>${profile.dlNo1}/${profile.dlNo2}</strong></div>
        <div style="font-size:10px;color:#333">GSTIN : <strong>${profile.gstin}</strong></div>
      </td>
      <td style="width:30%;padding:5px 10px;vertical-align:middle;text-align:center;border-right:2px solid #000">
        <span style="font-size:22px;font-weight:900;letter-spacing:2px;color:#000">GST INVOICE</span>
      </td>
      <td style="width:35%;padding:5px 10px;vertical-align:middle;font-size:10.5px">
        <div style="margin-bottom:3px">BILL NO. &nbsp;: &nbsp;<strong>${billNo(bill.billNumber)}</strong></div>
        <div>Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: &nbsp;<strong>${fmtDate(bill.billDate)}</strong></div>
      </td>
    </tr>
  </table>

  <table class="items">
    <thead>
      <tr>
        <th style="width:26px">SN</th>
        <th style="min-width:140px;text-align:left;padding-left:5px">PRODUCT NAME</th>
        <th style="width:44px">PACK</th>
        <th style="width:72px">BATCH</th>
        <th style="width:46px">EXP.</th>
        <th style="width:32px">QTY</th>
        <th style="width:60px">MRP</th>
        <th style="width:60px">RATE</th>
        <th style="width:44px">SGST</th>
        <th style="width:44px">CGST</th>
        <th style="width:68px">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      ${Array.from({ length: Math.max(0, 12 - bill.items.length) }, () => `<tr>${Array(11).fill('<td style="border-left:1px solid #bbb;border-right:1px solid #bbb;height:18px"></td>').join("")}</tr>`).join("")}
    </tbody>
  </table>

  <div style="border-top:1px solid #888;border-bottom:1px solid #888;padding:3px 10px;font-size:9.5px;background:#f9f9f9">
    ${gstSummary}
  </div>

  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td style="width:55%;padding:8px 10px;vertical-align:top">
        <div style="font-size:10px">
          <strong><u>Terms &amp; Conditions</u></strong><br/>
          Goods once sold will not be taken back or exchanged.<br/>
          Bills not paid due date will attract 24% interest.<br/>
          All disputes subject to Jurisdication only.<br/>
          Prescribed Sales Tax declaration will be given.
        </div>
        <div style="margin-top:8px;font-size:10px"><strong>Remark :</strong></div>
        <div style="margin-top:16px;font-size:10.5px"><strong>${amountInWords}</strong></div>
      </td>
      <td style="width:20%;padding:8px 4px 8px 2px;vertical-align:bottom;text-align:center;border-right:1px solid #aaa">
        <div style="font-weight:bold;font-size:10.5px;margin-bottom:40px;white-space:nowrap">For ${profile.name}</div>
        <div style="border-top:1px solid #000;padding-top:4px;font-size:10px;font-weight:bold">Authorised Signatory</div>
      </td>
      <td style="width:25%;vertical-align:top;padding:0">
        <table class="totals">
          <tr>
            <td>Sub Total</td>
            <td style="text-align:right">${subtotalNum.toFixed(2)}</td>
          </tr>
          <tr>
            <td>SGST</td>
            <td style="text-align:right">${sgst.toFixed(2)}</td>
          </tr>
          <tr>
            <td>CGST</td>
            <td style="text-align:right">${cgst.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Roundoff</td>
            <td style="text-align:right">${roundoff >= 0 ? "+" : ""}${roundoff.toFixed(2)}</td>
          </tr>
          <tr class="grand">
            <td>GRAND TOTAL</td>
            <td style="text-align:right">${grandTotalNum.toLocaleString("en-IN")}.00</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <div style="text-align:center;font-weight:bold;font-size:12px;letter-spacing:2px;border-top:2px solid #000;padding:5px">
    *** Get Well Soon ***
  </div>

</div>
</body>
</html>`;
}

// ─── Medicine search dropdown ─────────────────────────────────────────────────

interface MedDropdownProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  medicines: Medicine[];
  onSelect: (med: Medicine) => void;
  onClose: () => void;
}

function MedDropdown({
  inputRef,
  query,
  medicines,
  onSelect,
  onClose,
}: MedDropdownProps) {
  const results = medicines
    .filter(
      (m) =>
        query.length >= 1 && m.name.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 10);

  const rect = inputRef.current?.getBoundingClientRect();

  if (!rect || results.length === 0) return null;

  const style: React.CSSProperties = {
    position: "fixed",
    top: rect.bottom + 4,
    left: rect.left,
    width: Math.max(rect.width, 300),
    zIndex: 9999,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    maxHeight: "220px",
    overflowY: "auto",
  };

  return ReactDOM.createPortal(
    <div style={style}>
      {results.map((m) => (
        <div
          key={String(m.id)}
          className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b last:border-b-0 border-gray-100"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(m);
            onClose();
          }}
        >
          <span className="font-medium">{m.name}</span>
          <span className="text-muted-foreground text-xs ml-2">
            {getPackStr(m.unit)} · ₹{Number(m.sellingPrice).toFixed(2)}
          </span>
        </div>
      ))}
    </div>,
    document.body,
  );
}

// ─── Edit row type ────────────────────────────────────────────────────────────

interface EditRow {
  rowKey: string;
  medicineId: string; // string to handle bigint
  medicineName: string;
  batch: string;
  expiry: string;
  qty: number;
  unitPrice: number;
  gstPct: number;
}

let rowKeyCounter = 1000;
function newEditRow(): EditRow {
  rowKeyCounter += 1;
  return {
    rowKey: String(rowKeyCounter),
    medicineId: "0",
    medicineName: "",
    batch: "",
    expiry: "",
    qty: 1,
    unitPrice: 0,
    gstPct: 5,
  };
}

// ─── Edit Bill Sheet ──────────────────────────────────────────────────────────

interface EditBillSheetProps {
  bill: Bill | null;
  open: boolean;
  onClose: () => void;
  custMap: Record<string, Customer>;
  medMap: Record<string, Medicine>;
  medicines: Medicine[];
}

function EditBillSheet({
  bill,
  open,
  onClose,
  custMap,
  medMap,
  medicines,
}: EditBillSheetProps) {
  const updateBill = useUpdateBill();

  // Patient / doctor fields
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  // Medicine rows
  const [rows, setRows] = useState<EditRow[]>([]);

  // Med search state per row
  const [activeRowKey, setActiveRowKey] = useState<string | null>(null);
  const [medQuery, setMedQuery] = useState("");
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Populate form when bill opens
  useEffect(() => {
    if (!bill) return;
    const cust = custMap[String(bill.customerId)];
    setPatientName(cust?.name ?? "");
    setPatientPhone(cust?.phone ?? "");
    setDoctorName(cust?.email ?? "");
    setDoctorRegNo(cust?.address ?? "");
    setInvoiceDate(fmtDate(bill.billDate));
    setRows(
      bill.items.map((item) => {
        const med = medMap[String(item.medicineId)];
        return {
          rowKey: `${String(item.medicineId)}_${Math.random()}`,
          medicineId: String(item.medicineId),
          medicineName: med?.name ?? "Unknown",
          batch: med?.batchNumber ?? "",
          expiry: med?.expiryDate ?? "",
          qty: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          gstPct: Number(med?.gstPercent ?? 5),
        };
      }),
    );
  }, [bill, custMap, medMap]);

  // Totals
  const grandTotal = rows.reduce((sum, r) => sum + r.qty * r.unitPrice, 0);
  const totalGST = rows.reduce((sum, r) => {
    const amount = r.qty * r.unitPrice;
    const base = amount / (1 + r.gstPct / 100);
    return sum + (amount - base);
  }, 0);
  const subtotal = grandTotal - totalGST;

  const updateRow = (key: string, patch: Partial<EditRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.rowKey === key ? { ...r, ...patch } : r)),
    );
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.rowKey !== key));
  };

  const handleSave = () => {
    if (!bill) return;

    // ── Stock adjustment ──────────────────────────────────────────────────────
    // Build maps: medicineId -> old qty, new qty
    const oldQtyMap: Record<string, number> = {};
    for (const item of bill.items) {
      const key = String(item.medicineId);
      oldQtyMap[key] = (oldQtyMap[key] ?? 0) + Number(item.quantity);
    }
    const newQtyMap: Record<string, number> = {};
    for (const row of rows) {
      if (row.medicineId !== "0") {
        newQtyMap[row.medicineId] = (newQtyMap[row.medicineId] ?? 0) + row.qty;
      }
    }

    // All medicine IDs involved
    const allMedIds = new Set([
      ...Object.keys(oldQtyMap),
      ...Object.keys(newQtyMap),
    ]);

    const cachedMeds = getCache<Medicine[]>("medicines") ?? [];
    const updatedMeds = cachedMeds.map((m) => {
      const id = String(m.id);
      if (!allMedIds.has(id)) return m;
      const oldQty = oldQtyMap[id] ?? 0;
      const newQty = newQtyMap[id] ?? 0;
      const diff = oldQty - newQty; // positive = returned to stock, negative = more taken
      return {
        ...m,
        currentStock: BigInt(Math.max(0, Number(m.currentStock) + diff)),
      };
    });
    setCache("medicines", updatedMeds);

    // ── Update customer record ────────────────────────────────────────────────
    const cachedCustomers = getCache<Customer[]>("customers") ?? [];
    const updatedCustomers = cachedCustomers.map((c) => {
      if (String(c.id) !== String(bill.customerId)) return c;
      return {
        ...c,
        name: patientName,
        phone: patientPhone,
        email: doctorName,
        address: doctorRegNo,
      };
    });
    setCache("customers", updatedCustomers);

    // ── Build updated bill ────────────────────────────────────────────────────
    const newItems = rows
      .filter((r) => r.medicineId !== "0")
      .map((r) => {
        const amount = r.qty * r.unitPrice;
        const base = amount / (1 + r.gstPct / 100);
        const gstAmt = amount - base;
        return {
          medicineId: BigInt(r.medicineId),
          quantity: BigInt(r.qty),
          unitPrice: BigInt(Math.round(r.unitPrice)),
          gstAmount: BigInt(Math.round(gstAmt)),
          discountPercent: 0n,
        };
      });

    const grandTotalInt = BigInt(Math.round(grandTotal));
    const totalGSTInt = BigInt(Math.round(totalGST));
    const subtotalInt = BigInt(Math.round(subtotal));

    const updatedBill: Bill = {
      ...bill,
      items: newItems,
      grandTotal: grandTotalInt,
      totalGST: totalGSTInt,
      subtotal: subtotalInt,
      totalDiscount: 0n,
    };

    updateBill.mutate(updatedBill, {
      onSuccess: () => {
        toast.success("Bill updated successfully");
        onClose();
      },
      onError: () => {
        toast.error("Failed to update bill");
      },
    });
  };

  if (!bill) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-4xl flex flex-col p-0"
        data-ocid="history.edit_sheet"
      >
        <SheetHeader
          className="px-6 pt-5 pb-4 border-b bg-[#1e3a5f]
 text-white"
        >
          <SheetTitle className="text-white text-base">
            Edit Bill — {billNo(bill.billNumber)}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-6">
            {/* Patient / Doctor */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Patient & Doctor Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Patient Name</Label>
                  <Input
                    data-ocid="history.edit_patient.input"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Patient Phone</Label>
                  <Input
                    data-ocid="history.edit_phone.input"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Doctor Name</Label>
                  <Input
                    data-ocid="history.edit_doctor.input"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Doctor Reg No.</Label>
                  <Input
                    data-ocid="history.edit_doctor_reg.input"
                    value={doctorRegNo}
                    onChange={(e) => setDoctorRegNo(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Invoice Date</Label>
                  <Input
                    data-ocid="history.edit_date.input"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Medicine rows */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Medicines
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => setRows((prev) => [...prev, newEditRow()])}
                  data-ocid="history.edit_add_medicine.button"
                >
                  <Plus className="h-3 w-3" /> Add Row
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2 font-semibold text-muted-foreground border border-border">
                        Medicine
                      </th>
                      <th className="p-2 font-semibold text-muted-foreground border border-border w-20">
                        Batch
                      </th>
                      <th className="p-2 font-semibold text-muted-foreground border border-border w-20">
                        Expiry
                      </th>
                      <th className="p-2 font-semibold text-muted-foreground border border-border w-14">
                        Qty
                      </th>
                      <th className="p-2 font-semibold text-muted-foreground border border-border w-20">
                        MRP (₹)
                      </th>
                      <th className="p-2 font-semibold text-muted-foreground border border-border w-16">
                        GST%
                      </th>
                      <th className="p-2 font-semibold text-muted-foreground border border-border w-20">
                        Amount
                      </th>
                      <th className="p-2 border border-border w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const amount = row.qty * row.unitPrice;
                      const isActive = activeRowKey === row.rowKey;
                      return (
                        <tr key={row.rowKey} className="hover:bg-muted/20">
                          <td className="p-1 border border-border relative">
                            <input
                              ref={(el) => {
                                inputRefs.current[row.rowKey] = el;
                              }}
                              className="w-full px-2 py-1 text-xs bg-transparent border-none outline-none focus:bg-blue-50 rounded"
                              placeholder="Type to search..."
                              value={isActive ? medQuery : row.medicineName}
                              onChange={(e) => {
                                setActiveRowKey(row.rowKey);
                                setMedQuery(e.target.value);
                              }}
                              onFocus={() => {
                                setActiveRowKey(row.rowKey);
                                setMedQuery("");
                              }}
                              onBlur={() => {
                                setTimeout(() => {
                                  setActiveRowKey(null);
                                  setMedQuery("");
                                }, 150);
                              }}
                            />
                            {isActive && (
                              <MedDropdown
                                inputRef={{
                                  current:
                                    inputRefs.current[row.rowKey] ?? null,
                                }}
                                query={medQuery}
                                medicines={medicines}
                                onSelect={(med) => {
                                  updateRow(row.rowKey, {
                                    medicineId: String(med.id),
                                    medicineName: med.name,
                                    batch: med.batchNumber,
                                    expiry: med.expiryDate,
                                    unitPrice: Number(med.sellingPrice),
                                    gstPct: Number(med.gstPercent),
                                  });
                                }}
                                onClose={() => {
                                  setActiveRowKey(null);
                                  setMedQuery("");
                                }}
                              />
                            )}
                          </td>
                          <td className="p-1 border border-border">
                            <input
                              className="w-full px-2 py-1 text-xs bg-transparent border-none outline-none focus:bg-blue-50 rounded"
                              value={row.batch}
                              onChange={(e) =>
                                updateRow(row.rowKey, { batch: e.target.value })
                              }
                            />
                          </td>
                          <td className="p-1 border border-border">
                            <input
                              className="w-full px-2 py-1 text-xs bg-transparent border-none outline-none focus:bg-blue-50 rounded"
                              value={row.expiry}
                              onChange={(e) =>
                                updateRow(row.rowKey, {
                                  expiry: e.target.value,
                                })
                              }
                            />
                          </td>
                          <td className="p-1 border border-border">
                            <input
                              type="number"
                              min="1"
                              className="w-full px-2 py-1 text-xs bg-transparent border-none outline-none focus:bg-blue-50 rounded text-center"
                              value={row.qty}
                              onChange={(e) =>
                                updateRow(row.rowKey, {
                                  qty: Math.max(
                                    1,
                                    Number.parseInt(e.target.value) || 1,
                                  ),
                                })
                              }
                            />
                          </td>
                          <td className="p-1 border border-border">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-full px-2 py-1 text-xs bg-transparent border-none outline-none focus:bg-blue-50 rounded text-right"
                              value={row.unitPrice}
                              onChange={(e) =>
                                updateRow(row.rowKey, {
                                  unitPrice:
                                    Number.parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </td>
                          <td className="p-1 border border-border">
                            <input
                              type="number"
                              min="0"
                              max="28"
                              className="w-full px-2 py-1 text-xs bg-transparent border-none outline-none focus:bg-blue-50 rounded text-center"
                              value={row.gstPct}
                              onChange={(e) =>
                                updateRow(row.rowKey, {
                                  gstPct:
                                    Number.parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </td>
                          <td className="p-1 border border-border text-right pr-2 font-medium">
                            ₹{amount.toFixed(2)}
                          </td>
                          <td className="p-1 border border-border text-center">
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-700 p-0.5 rounded"
                              onClick={() => removeRow(row.rowKey)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center text-muted-foreground text-xs py-6 border border-border"
                        >
                          No medicines — click "Add Row" to add one
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals summary */}
              <div className="mt-4 flex justify-end">
                <div className="text-xs space-y-1 min-w-48">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sub Total</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST (SGST + CGST)</span>
                    <span>₹{totalGST.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm border-t pt-1">
                    <span>Grand Total</span>
                    <span className="text-[#1e3a5f]">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t bg-muted/30 gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="history.edit_cancel.button"
          >
            Cancel
          </Button>
          <Button
            className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white gap-2"
            onClick={handleSave}
            disabled={updateBill.isPending || rows.length === 0}
            data-ocid="history.edit_save.button"
          >
            {updateBill.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main BillHistory component ───────────────────────────────────────────────

export default function BillHistory() {
  const { data: bills = [], isLoading } = useGetBills();
  const { data: customers = [] } = useGetCustomers();
  const { data: medicines = [] } = useGetMedicines();
  const deleteBill = useDeleteBill();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Bill | null>(null);
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);

  const custMap = Object.fromEntries(customers.map((c) => [String(c.id), c]));
  const medMap = Object.fromEntries(medicines.map((m) => [String(m.id), m]));

  const deduped = bills.filter(
    (bill, idx, arr) =>
      arr.findIndex((b) => String(b.id) === String(bill.id)) === idx,
  );
  const sorted = [...deduped].sort((a, b) => {
    const numDiff = Number(b.billNumber) - Number(a.billNumber);
    if (numDiff !== 0) return numDiff;
    return Number(b.billDate - a.billDate);
  });
  const filtered = sorted.filter((b) => {
    const custName = custMap[String(b.customerId)]?.name ?? "";
    const bn = billNo(b.billNumber);
    return (
      bn.toLowerCase().includes(search.toLowerCase()) ||
      custName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const openPrintWindow = (bill: Bill, autoprint = true) => {
    const html = buildInvoiceHtml(bill, custMap, medMap);
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      if (autoprint) {
        setTimeout(() => {
          w.print();
        }, 500);
      }
    }
  };

  const handleDownload = (bill: Bill) => {
    const html = buildInvoiceHtml(bill, custMap, medMap);
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => {
        w.print();
      }, 600);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingBill) return;

    // Restore stock for all medicines in this bill
    const cachedMeds = getCache<Medicine[]>("medicines") ?? [];
    const stockMap: Record<string, number> = {};
    for (const item of deletingBill.items) {
      const key = String(item.medicineId);
      stockMap[key] = (stockMap[key] ?? 0) + Number(item.quantity);
    }
    const updatedMeds = cachedMeds.map((m) => {
      const restore = stockMap[String(m.id)];
      if (!restore) return m;
      return {
        ...m,
        currentStock: BigInt(Number(m.currentStock) + restore),
      };
    });
    setCache("medicines", updatedMeds);

    deleteBill.mutate(deletingBill.id, {
      onSuccess: () => {
        toast.success("Bill deleted and stock restored");
        setDeletingBill(null);
      },
      onError: () => {
        toast.error("Failed to delete bill");
        setDeletingBill(null);
      },
    });
  };

  return (
    <div className="space-y-5" data-ocid="history.page">
      <div>
        <h1 className="text-2xl font-bold">Bill History</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          {bills.length} bills recorded
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center gap-3">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              All Bills
            </CardTitle>
            <div className="relative ml-auto w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                data-ocid="history.search_input"
                className="pl-8 h-7 text-xs"
                placeholder="Search bill or customer..."
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
            <Table data-ocid="history.table">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  {[
                    "Bill No",
                    "Date",
                    "Customer",
                    "Doctor",
                    "Doctor Reg No",
                    "Items",
                    "Total",
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
                      colSpan={8}
                      className="text-center text-muted-foreground text-xs py-10"
                      data-ocid="history.empty_state"
                    >
                      {search
                        ? "No bills match your search"
                        : "No bills recorded yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((bill, idx) => (
                    <TableRow
                      key={String(bill.id)}
                      className="border-border text-[13px]"
                      data-ocid={`history.item.${idx + 1}`}
                    >
                      <TableCell className="pl-5 font-medium">
                        {billNo(bill.billNumber)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {fmtDate(bill.billDate)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {custMap[String(bill.customerId)]?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {custMap[String(bill.customerId)]?.email ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">—</TableCell>
                      <TableCell className="text-muted-foreground">
                        {bill.items.length} item
                        {bill.items.length !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {fmtCurrency(bill.grandTotal)}
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setSelected(bill)}
                            title="View Bill"
                            data-ocid={`history.view_button.${idx + 1}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => setEditBill(bill)}
                            title="Edit Bill"
                            data-ocid={`history.edit_button.${idx + 1}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => openPrintWindow(bill)}
                            title="Print Invoice"
                            data-ocid={`history.print_button.${idx + 1}`}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                            onClick={() => handleDownload(bill)}
                            title="Download PDF"
                            data-ocid={`history.download_button.${idx + 1}`}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeletingBill(bill)}
                            title="Delete Bill"
                            data-ocid={`history.delete_button.${idx + 1}`}
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

      {/* Bill Detail Modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-4xl" data-ocid="history.dialog">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-bold">
                  Bill #{billNo(selected.billNumber)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Date</span>
                    <p className="font-medium">{fmtDate(selected.billDate)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Patient
                    </span>
                    <p className="font-medium">
                      {custMap[String(selected.customerId)]?.name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Phone</span>
                    <p className="font-medium">
                      {custMap[String(selected.customerId)]?.phone ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Doctor
                    </span>
                    <p className="font-medium">
                      {custMap[String(selected.customerId)]?.email ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Doctor Reg No
                    </span>
                    <p className="font-medium text-muted-foreground">—</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Address
                    </span>
                    <p className="font-medium">
                      {custMap[String(selected.customerId)]?.address || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Grand Total
                    </span>
                    <p className="font-bold text-primary text-base">
                      {fmtCurrency(selected.grandTotal)}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        {[
                          "#",
                          "Medicine",
                          "Pack",
                          "HSN",
                          "Batch",
                          "Exp",
                          "Qty",
                          "MRP",
                          "SGST%",
                          "CGST%",
                          "Amount",
                        ].map((h) => (
                          <TableHead
                            key={h}
                            className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap"
                          >
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.items.map((item, idx) => {
                        const med = medMap[String(item.medicineId)];
                        const qty = Number(item.quantity);
                        const mrp = Number(item.unitPrice);
                        const gstPct = Number(med?.gstPercent ?? 5);
                        const halfGst = gstPct / 2;
                        const amount = qty * mrp;
                        const pack = getPackStr(med?.unit ?? "tablet");
                        const hsn = (med as any)?.hsnCode ?? "";
                        const batch = (med as any)?.batchNumber ?? "";
                        const expiry = (med as any)?.expiryDate ?? "";
                        return (
                          <TableRow
                            key={String(item.medicineId)}
                            className="border-border"
                          >
                            <TableCell className="text-[11px] text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="text-[11px] font-medium whitespace-nowrap">
                              {med?.name ?? "Unknown"}
                            </TableCell>
                            <TableCell className="text-[11px] text-center">
                              {pack}
                            </TableCell>
                            <TableCell className="text-[11px] text-center">
                              {hsn}
                            </TableCell>
                            <TableCell className="text-[11px] text-center">
                              {batch}
                            </TableCell>
                            <TableCell className="text-[11px] text-center">
                              {expiry}
                            </TableCell>
                            <TableCell className="text-[11px] text-center">
                              {qty}
                            </TableCell>
                            <TableCell className="text-[11px] text-right">
                              ₹{mrp.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-[11px] text-center">
                              {halfGst.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-[11px] text-center">
                              {halfGst.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-[11px] text-right font-semibold">
                              ₹{amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <Separator />
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sub Total</span>
                    <span>{fmtCurrency(selected.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>SGST 2.5%</span>
                    <span>₹{(Number(selected.totalGST) / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>CGST 2.5%</span>
                    <span>₹{(Number(selected.totalGST) / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base">
                    <span>Grand Total</span>
                    <span className="text-primary">
                      {fmtCurrency(selected.grandTotal)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    className="flex-1 gap-2"
                    variant="outline"
                    onClick={() => openPrintWindow(selected)}
                    data-ocid="history.dialog_print.button"
                  >
                    <Printer className="h-4 w-4" /> Print Invoice
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    variant="outline"
                    onClick={() => handleDownload(selected)}
                    data-ocid="history.dialog_download.button"
                  >
                    <Download className="h-4 w-4" /> Download PDF
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Bill Sheet */}
      <EditBillSheet
        bill={editBill}
        open={!!editBill}
        onClose={() => setEditBill(null)}
        custMap={custMap}
        medMap={medMap}
        medicines={medicines}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingBill}
        onOpenChange={(o) => !o && setDeletingBill(null)}
      >
        <AlertDialogContent data-ocid="history.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Delete Bill?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-1">
              <span className="block">
                Are you sure you want to delete{" "}
                <strong>
                  {deletingBill ? billNo(deletingBill.billNumber) : ""}
                </strong>
                ?
              </span>
              <span className="block font-medium text-foreground">
                All stock changes from this bill will be reversed —{" "}
                {deletingBill?.items.length ?? 0} medicine item(s) will have
                their quantities restored to inventory.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="history.delete_cancel.button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmDelete}
              data-ocid="history.delete_confirm.button"
            >
              {deleteBill.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Yes, Delete & Restore Stock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
