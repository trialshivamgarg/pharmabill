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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Eye, Printer, Search } from "lucide-react";
import { useState } from "react";
import { getPharmacyProfile } from "../hooks/usePharmacyProfile";
import {
  type Bill,
  useGetBills,
  useGetCustomers,
  useGetMedicines,
} from "../hooks/useQueries";

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
  custMap: Record<string, any>,
  medMap: Record<string, any>,
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

  const itemRows = bill.items
    .map((item, idx) => {
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
      return `
        <tr>
          <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">${idx + 1}</td>
          <td style="padding:3px 6px;border:1px solid #ccc">${med?.name ?? "Unknown"}</td>
          <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">${pack}</td>
          <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">${hsn}</td>
          <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">${batch}</td>
          <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">${expiry}</td>
          <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">${qty}</td>
          <td style="text-align:right;padding:3px 6px;border:1px solid #ccc">${mrp.toFixed(2)}</td>
          <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">${halfGst.toFixed(2)}</td>
          <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">${halfGst.toFixed(2)}</td>
          <td style="text-align:right;padding:3px 6px;border:1px solid #ccc"><strong>${amount.toFixed(2)}</strong></td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice - ${billNo(bill.billNumber)}</title>
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
    .outer-border { border: 2px solid #000; padding: 0; }
    .header-section { padding: 4px 12px 3px; text-align: center; border-bottom: 1px solid #000; }
    .company-name {
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 1px;
    }
    .company-sub { font-size: 9.5px; line-height: 1.3; }
    .invoice-title {
      text-align: center;
      font-size: 13px;
      font-weight: bold;
      letter-spacing: 3px;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 2px;
      background: #f0f0f0;
    }
    .bill-meta {
      display: flex;
      justify-content: space-between;
      padding: 3px 12px;
      border-bottom: 1px solid #000;
      font-size: 10px;
      line-height: 1.5;
    }
    .lbl { color: #444; }
    table.items {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    table.items th {
      background: #e0e0e0;
      border: 1px solid #888;
      padding: 4px 3px;
      text-align: center;
      font-weight: bold;
      font-size: 9.5px;
      white-space: nowrap;
    }
    table.totals {
      border-collapse: collapse;
      min-width: 280px;
    }
    table.totals td {
      padding: 3px 8px;
      font-size: 11px;
      border-bottom: 1px solid #eee;
    }
    table.totals tr.grand td {
      font-size: 13px;
      font-weight: bold;
      background: #e0e0e0;
      border-top: 2px solid #000;
      padding: 5px 8px;
    }
    }
    .bottom-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 8px 12px;
      border-top: 1px solid #000;
      font-size: 10px;
    }
    .terms-side {
      flex: 1 1 55%;
      max-width: 55%;
      line-height: 1.8;
    }
    .remark-line {
      margin-top: 8px;
      font-size: 10px;
    }
    .sign-center {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      min-width: 160px;
      padding: 0 12px;
    }
    .totals-side { min-width: 280px; }
    .grand-total-words-bar {
      border-top: 1px solid #ccc;
      border-bottom: 1px solid #ccc;
      padding: 5px 12px;
      font-size: 10.5px;
      background: #fafafa;
      text-align: right;
    }
    .get-well {
      text-align: center;
      font-weight: bold;
      font-size: 12px;
      letter-spacing: 2px;
      border-top: 1px solid #000;
      padding: 6px;
    }
  </style>
</head>
<body>
<div class="outer-border">

  <div class="header-section">
    <div class="company-name">${profile.name}</div>
    <div class="company-sub">
      ${profile.address1}${profile.address2 ? `, ${profile.address2}` : ""}<br/>
      Ph: ${profile.phone} &nbsp;|&nbsp; Email: ${profile.email}<br/>
      GSTIN: ${profile.gstin} &nbsp;|&nbsp; D.L.No.: ${profile.dlNo1} / ${profile.dlNo2}
    </div>
  </div>

  <div class="invoice-title">GST INVOICE</div>

  <div class="bill-meta">
    <div class="bill-meta-left">
      <div><span class="lbl">Patient Name : </span><strong>${cust?.name ?? "Walk-in Customer"}</strong></div>
      <div><span class="lbl">Ph. No &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: </span>${cust?.phone ?? "—"}</div>
      <div><span class="lbl">Doctor Name &nbsp;: </span><strong>${cust?.email ?? "—"}</strong></div>
      <div><span class="lbl">Doctor Reg No: </span>${cust?.address ?? "—"}</div>
    </div>
    <div class="bill-meta-right" style="text-align:right">
      <div><span class="lbl">Invoice No : </span><strong>${billNo(bill.billNumber)}</strong></div>
      <div><span class="lbl">Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: </span><strong>${fmtDate(bill.billDate)}</strong></div>
    </div>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th style="width:28px">S.No</th>
        <th style="width:160px">Product Name</th>
        <th style="width:44px">Pack</th>
        <th style="width:50px">HSN</th>
        <th style="width:70px">Batch</th>
        <th style="width:50px">Expiry</th>
        <th style="width:30px">Qty</th>
        <th style="width:62px">MRP</th>
        <th style="width:44px">SGST%</th>
        <th style="width:44px">CGST%</th>
        <th style="width:68px">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>


  <div class="bottom-section">
    <div class="terms-side">
      <div>
        <strong>Terms &amp; Conditions:</strong><br/>
        1. Goods once sold will not be taken back or exchanged.<br/>
        2. Bills not paid due date will attract 24% interest.<br/>
        3. All disputes subject to Jurisdication only.<br/>
        4. Prescribed Sales Tax declaration will be given.
      </div>
      <div class="remark-line">
        <strong>Remark :</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      </div>
    </div>
    <div class="sign-center">
      <div style="text-align:center">
        <div style="font-weight:bold;font-size:11px;margin-bottom:40px">For ${profile.name}</div>
        <div style="border-top:1px solid #000;padding-top:4px;font-size:10px;font-weight:bold">Authorised Signatory</div>
      </div>
    </div>
    <div class="totals-side">
      <table class="totals">
        <tr>
          <td>Sub Total</td>
          <td style="text-align:right">₹${subtotalNum.toFixed(2)}</td>
        </tr>
        <tr>
          <td>SGST 2.5%</td>
          <td style="text-align:right">₹${sgst.toFixed(2)}</td>
        </tr>
        <tr>
          <td>CGST 2.5%</td>
          <td style="text-align:right">₹${cgst.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Roundoff</td>
          <td style="text-align:right">${roundoff >= 0 ? "+" : ""}${roundoff.toFixed(2)}</td>
        </tr>
        <tr class="grand">
          <td>Grand Total</td>
          <td style="text-align:right">₹${grandTotalNum.toLocaleString("en-IN")}.00</td>
        </tr>
      </table>
    </div>
  </div>

  <div class="grand-total-words-bar">
    <strong>Grand Total in Words:</strong> ${amountInWords}
  </div>

  <div class="get-well">*** Get Well Soon ***</div>

</div>
</body>
</html>`;
}

export default function BillHistory() {
  const { data: bills = [], isLoading } = useGetBills();
  const { data: customers = [] } = useGetCustomers();
  const { data: medicines = [] } = useGetMedicines();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Bill | null>(null);

  const custMap = Object.fromEntries(customers.map((c) => [String(c.id), c]));
  const medMap = Object.fromEntries(medicines.map((m) => [String(m.id), m]));

  const sorted = [...bills].sort((a, b) => Number(b.billDate - a.billDate));
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
                            data-ocid={`history.view_button.${idx + 1}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
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
    </div>
  );
}
