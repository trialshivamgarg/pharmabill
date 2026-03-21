export interface ReturnItem {
  id: string;
  medicineName: string;
  medicineId: string;
  batchNo: string;
  expiry: string;
  qty: number;
  mrp: number;
  gstPercent: number;
  pack: string;
}

export interface SalesReturnRecord {
  id: string;
  returnNo: string;
  returnDate: string;
  patientName: string;
  phone: string;
  doctorName: string;
  doctorRegNo: string;
  remarks: string;
  items: ReturnItem[];
  subtotal: number;
  totalGST: number;
  grandTotal: number;
  createdAt: number;
}

export interface PurchaseReturnRecord {
  id: string;
  returnNo: string;
  returnDate: string;
  distributorFirmName: string;
  distributorAddress: string;
  distributorGST: string;
  distributorDLNo: string;
  remarks: string;
  items: ReturnItem[];
  subtotal: number;
  totalGST: number;
  grandTotal: number;
  createdAt: number;
}

const SR_KEY = "pharma_sales_returns";
const PR_KEY = "pharma_purchase_returns";

export function getSalesReturns(): SalesReturnRecord[] {
  try {
    return JSON.parse(localStorage.getItem(SR_KEY) ?? "[]");
  } catch {
    return [];
  }
}
export function saveSalesReturns(records: SalesReturnRecord[]): void {
  localStorage.setItem(SR_KEY, JSON.stringify(records));
}
export function addSalesReturn(record: SalesReturnRecord): void {
  saveSalesReturns([...getSalesReturns(), record]);
}
export function updateSalesReturn(record: SalesReturnRecord): void {
  saveSalesReturns(
    getSalesReturns().map((r) => (r.id === record.id ? record : r)),
  );
}
export function deleteSalesReturn(id: string): void {
  saveSalesReturns(getSalesReturns().filter((r) => r.id !== id));
}

export function getPurchaseReturns(): PurchaseReturnRecord[] {
  try {
    return JSON.parse(localStorage.getItem(PR_KEY) ?? "[]");
  } catch {
    return [];
  }
}
export function savePurchaseReturns(records: PurchaseReturnRecord[]): void {
  localStorage.setItem(PR_KEY, JSON.stringify(records));
}
export function addPurchaseReturn(record: PurchaseReturnRecord): void {
  savePurchaseReturns([...getPurchaseReturns(), record]);
}
export function updatePurchaseReturn(record: PurchaseReturnRecord): void {
  savePurchaseReturns(
    getPurchaseReturns().map((r) => (r.id === record.id ? record : r)),
  );
}
export function deletePurchaseReturn(id: string): void {
  savePurchaseReturns(getPurchaseReturns().filter((r) => r.id !== id));
}
