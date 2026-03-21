import { getPharmacyProfile } from "../hooks/usePharmacyProfile";
import type {
  PurchaseReturnRecord,
  SalesReturnRecord,
} from "../hooks/useReturnStore";

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

export function buildReturnInvoiceHtml(
  record: SalesReturnRecord | PurchaseReturnRecord,
  type: "sales" | "purchase",
): string {
  const profile = getPharmacyProfile();
  const grandTotalNum = Math.round(record.grandTotal);
  const subtotalNum = record.subtotal;
  const totalGSTNum = record.totalGST;
  const sgst = totalGSTNum / 2;
  const cgst = totalGSTNum / 2;
  const roundoff = grandTotalNum - (subtotalNum + totalGSTNum);
  const amountInWords = numberToWords(grandTotalNum);
  const title = type === "sales" ? "SALES RETURN" : "PURCHASE RETURN";
  const baseTaxable = subtotalNum;
  const gstSummary = `GST ${baseTaxable.toFixed(2)}*2.5+2.5%=${sgst.toFixed(2)}SGST+${cgst.toFixed(2)}CGST`;

  let rightHeaderHtml = "";
  if (type === "sales") {
    const sr = record as SalesReturnRecord;
    rightHeaderHtml = `
      <div style="font-size:11px;font-weight:bold;margin-bottom:3px"><strong>Patient Name : ${sr.patientName || "—"}</strong></div>
      <div style="font-size:10.5px;margin-bottom:3px">Patient PH. NO &nbsp;${sr.phone || "—"}</div>
      <div style="font-size:10.5px;margin-bottom:3px">Dr Name : ${sr.doctorName || "—"}</div>
      <div style="font-size:10.5px">Dr Reg No. ${sr.doctorRegNo || "—"}</div>`;
  } else {
    const pr = record as PurchaseReturnRecord;
    rightHeaderHtml = `
      <div style="font-size:11px;font-weight:bold;margin-bottom:3px"><strong>Firm Name : ${pr.distributorFirmName || "—"}</strong></div>
      <div style="font-size:10.5px;margin-bottom:3px">Address : ${pr.distributorAddress || "—"}</div>
      <div style="font-size:10.5px;margin-bottom:3px">GST No. : ${pr.distributorGST || "—"}</div>
      <div style="font-size:10.5px">DL No. : ${pr.distributorDLNo || "—"}</div>`;
  }

  const itemRows = record.items
    .map((item, idx) => {
      const qty = item.qty;
      const mrp = item.mrp;
      const gstPct = item.gstPercent;
      const halfGst = gstPct / 2;
      const amount = qty * mrp;
      return `
        <tr>
          <td style="text-align:center;padding:2px 3px;border-left:1px solid #bbb;border-right:1px solid #bbb">${idx + 1}.</td>
          <td style="padding:2px 5px;border-left:1px solid #bbb;border-right:1px solid #bbb">${item.medicineName}</td>
          <td style="text-align:center;padding:2px 3px;border-left:1px solid #bbb;border-right:1px solid #bbb">${item.pack || "1x10"}</td>
          <td style="text-align:center;padding:2px 3px;border-left:1px solid #bbb;border-right:1px solid #bbb">${item.batchNo}</td>
          <td style="text-align:center;padding:2px 3px;border-left:1px solid #bbb;border-right:1px solid #bbb">${item.expiry}</td>
          <td style="text-align:center;padding:2px 3px;border-left:1px solid #bbb;border-right:1px solid #bbb">${qty}</td>
          <td style="text-align:right;padding:2px 5px;border-left:1px solid #bbb;border-right:1px solid #bbb">${mrp.toFixed(2)}</td>
          <td style="text-align:right;padding:2px 5px;border-left:1px solid #bbb;border-right:1px solid #bbb">${mrp.toFixed(2)}</td>
          <td style="text-align:center;padding:2px 3px;border-left:1px solid #bbb;border-right:1px solid #bbb">${halfGst.toFixed(2)}</td>
          <td style="text-align:center;padding:2px 3px;border-left:1px solid #bbb;border-right:1px solid #bbb">${halfGst.toFixed(2)}</td>
          <td style="text-align:right;padding:2px 5px;border-left:1px solid #bbb;border-right:1px solid #bbb">${amount.toFixed(2)}</td>
        </tr>`;
    })
    .join("");

  const emptyRows = Array.from(
    { length: Math.max(0, 12 - record.items.length) },
    () =>
      `<tr>${Array(11)
        .fill(
          '<td style="border-left:1px solid #bbb;border-right:1px solid #bbb;height:18px"></td>',
        )
        .join("")}</tr>`,
  ).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title} - ${record.returnNo}</title>
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
    table.items { width: 100%; border-collapse: collapse; font-size: 10px; }
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
    .no-print-btn {
      display: block; margin: 10px auto; padding: 8px 24px;
      background: #1e3a5f; color: white; border: none;
      border-radius: 4px; font-size: 14px; cursor: pointer;
    }
  </style>
</head>
<body>
<div class="no-print" style="text-align:center;margin-bottom:8px">
  <button class="no-print-btn" onclick="window.print()">&#128438; Print</button>
</div>
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
        ${rightHeaderHtml}
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
        <span style="font-size:20px;font-weight:900;letter-spacing:2px;color:#000">${title}</span>
      </td>
      <td style="width:35%;padding:5px 10px;vertical-align:middle;font-size:10.5px">
        <div style="margin-bottom:3px">RETURN NO. &nbsp;: &nbsp;<strong>${record.returnNo}</strong></div>
        <div>Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: &nbsp;<strong>${record.returnDate}</strong></div>
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
      ${emptyRows}
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
        <div style="margin-top:8px;font-size:10px"><strong>Remark :</strong> ${record.remarks || ""}</div>
        <div style="margin-top:16px;font-size:10.5px"><strong>${amountInWords}</strong></div>
      </td>
      <td style="width:20%;padding:8px 4px 8px 2px;vertical-align:bottom;text-align:center;border-right:1px solid #aaa">
        <div style="font-weight:bold;font-size:10.5px;margin-bottom:40px;white-space:nowrap">For ${profile.name}</div>
        <div style="border-top:1px solid #000;padding-top:4px;font-size:10px;font-weight:bold">Authorised Signatory</div>
      </td>
      <td style="width:25%;vertical-align:top;padding:0">
        <table class="totals">
          <tr><td>Sub Total</td><td style="text-align:right">${subtotalNum.toFixed(2)}</td></tr>
          <tr><td>SGST</td><td style="text-align:right">${sgst.toFixed(2)}</td></tr>
          <tr><td>CGST</td><td style="text-align:right">${cgst.toFixed(2)}</td></tr>
          <tr><td>Roundoff</td><td style="text-align:right">${roundoff >= 0 ? "+" : ""}${roundoff.toFixed(2)}</td></tr>
          <tr class="grand"><td>GRAND TOTAL</td><td style="text-align:right">${grandTotalNum.toLocaleString("en-IN")}.00</td></tr>
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

export function openReturnPrintWindow(
  record: SalesReturnRecord | PurchaseReturnRecord,
  type: "sales" | "purchase",
): void {
  const html = buildReturnInvoiceHtml(record, type);
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
