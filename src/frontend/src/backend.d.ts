import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BillItem {
    cgst: bigint;
    pack: string;
    sgst: bigint;
    hsnCode: string;
    discountPercent: bigint;
    gstAmount: bigint;
    quantity: bigint;
    batch: string;
    expiry: string;
    unitPrice: bigint;
    medicineId: bigint;
    medicineName: string;
}
export interface PurchaseItem {
    mrp: bigint;
    qty: bigint;
    purchaseRate: bigint;
    pack: string;
    gstPercent: bigint;
    hsnCode: string;
    freeQty: bigint;
    batch: string;
    expiry: string;
    medicineId: bigint;
    amount: bigint;
    medicineName: string;
}
export type Time = bigint;
export interface PharmacyProfile {
    drugLicenseNumber: string;
    gstNumber: string;
    name: string;
    email: string;
    address: string;
    phone: string;
}
export interface Distributor {
    id: bigint;
    drugLicenseNumber: string;
    gstNumber: string;
    name: string;
    contactPerson: string;
    email: string;
    address: string;
    phone: string;
}
export interface DashboardStats {
    todayBillCount: bigint;
    lowStockMedicinesCount: bigint;
    todayTotalSales: bigint;
    totalMedicinesInStock: bigint;
}
export interface SalesReturnItem {
    cgst: bigint;
    pack: string;
    sgst: bigint;
    hsnCode: string;
    gstAmount: bigint;
    quantity: bigint;
    batch: string;
    expiry: string;
    unitPrice: bigint;
    medicineId: bigint;
    amount: bigint;
    medicineName: string;
}
export interface Customer {
    id: bigint;
    name: string;
    email: string;
    address: string;
    phone: string;
}
export interface SalesReturn {
    id: bigint;
    remark: string;
    customerName: string;
    doctorAddress: string;
    totalGST: bigint;
    grandTotal: bigint;
    customerAddress: string;
    customerId: bigint;
    items: Array<SalesReturnItem>;
    doctorName: string;
    returnNumber: bigint;
    returnDate: Time;
    subtotal: bigint;
}
export interface PurchaseReturn {
    id: bigint;
    remark: string;
    distributorGst: string;
    distributorDlNo: string;
    distributorName: string;
    distributorId: bigint;
    totalGST: bigint;
    grandTotal: bigint;
    distributorAddress: string;
    items: Array<PurchaseReturnItem>;
    returnNumber: bigint;
    returnDate: Time;
    subtotal: bigint;
}
export interface Bill {
    id: bigint;
    remark: string;
    customerName: string;
    doctorAddress: string;
    totalGST: bigint;
    grandTotal: bigint;
    billDate: Time;
    invoiceNumber: string;
    customerAddress: string;
    billNumber: bigint;
    paymentMode: PaymentMode;
    customerId: bigint;
    items: Array<BillItem>;
    doctorName: string;
    totalDiscount: bigint;
    subtotal: bigint;
}
export interface Medicine {
    id: bigint;
    manufacturer: string;
    purchasePrice: bigint;
    expiryDate: string;
    name: string;
    unit: Unit;
    gstPercent: bigint;
    sellingPrice: bigint;
    rackLocation: string;
    hsnCode: string;
    batchNumber: string;
    genericName: string;
    reorderLevel: bigint;
    currentStock: bigint;
}
export interface Purchase {
    id: bigint;
    purchaseDate: Time;
    distributorName: string;
    distributorId: bigint;
    totalGST: bigint;
    grandTotal: bigint;
    invoiceDate: string;
    invoiceNumber: string;
    items: Array<PurchaseItem>;
    subtotal: bigint;
}
export interface UserProfile {
    name: string;
    role: string;
}
export interface PurchaseReturnItem {
    cgst: bigint;
    pack: string;
    sgst: bigint;
    hsnCode: string;
    gstAmount: bigint;
    quantity: bigint;
    batch: string;
    expiry: string;
    unitPrice: bigint;
    medicineId: bigint;
    amount: bigint;
    medicineName: string;
}
export enum PaymentMode {
    UPI = "UPI",
    card = "card",
    cash = "cash"
}
export enum Unit {
    bottle = "bottle",
    tablet = "tablet",
    strip = "strip"
}
export interface backendInterface {
    addCustomer(cust: Customer): Promise<bigint>;
    addDistributor(dist: Distributor): Promise<bigint>;
    addMedicine(med: Medicine): Promise<bigint>;
    addPurchase(purchase: Purchase): Promise<bigint>;
    createBill(bill: Bill): Promise<bigint>;
    createPurchaseReturn(ret: PurchaseReturn): Promise<bigint>;
    createSalesReturn(ret: SalesReturn): Promise<bigint>;
    deleteBill(id: bigint): Promise<void>;
    deleteCustomer(id: bigint): Promise<void>;
    deleteDistributor(id: bigint): Promise<void>;
    deleteMedicine(id: bigint): Promise<void>;
    deletePurchaseReturn(id: bigint): Promise<void>;
    deleteSalesReturn(id: bigint): Promise<void>;
    getAllBills(): Promise<Array<Bill>>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllDistributors(): Promise<Array<Distributor>>;
    getAllMedicines(): Promise<Array<Medicine>>;
    getAllPurchaseReturns(): Promise<Array<PurchaseReturn>>;
    getAllPurchases(): Promise<Array<Purchase>>;
    getAllSalesReturns(): Promise<Array<SalesReturn>>;
    getBill(id: bigint): Promise<Bill>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCustomer(id: bigint): Promise<Customer>;
    getDashboardStats(): Promise<DashboardStats>;
    getDataCounts(): Promise<{
        salesReturns: bigint;
        purchases: bigint;
        bills: bigint;
        distributors: bigint;
        medicines: bigint;
        customers: bigint;
        purchaseReturns: bigint;
    }>;
    getDistributor(id: bigint): Promise<Distributor>;
    getMedicine(id: bigint): Promise<Medicine>;
    getPharmacyProfile(): Promise<PharmacyProfile>;
    getPurchase(id: bigint): Promise<Purchase>;
    getPurchaseReturn(id: bigint): Promise<PurchaseReturn>;
    getPurchasesByDistributor(distributorId: bigint): Promise<Array<Purchase>>;
    getSalesReturn(id: bigint): Promise<SalesReturn>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initialize(): Promise<void>;
    reinitializeIfEmpty(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateBill(bill: Bill): Promise<void>;
    updateCustomer(cust: Customer): Promise<void>;
    updateDistributor(dist: Distributor): Promise<void>;
    updateMedicine(med: Medicine): Promise<void>;
    updatePharmacyProfile(profile: PharmacyProfile): Promise<void>;
    updatePurchaseReturn(ret: PurchaseReturn): Promise<void>;
    updateSalesReturn(ret: SalesReturn): Promise<void>;
}
