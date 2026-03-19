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
    discountPercent: bigint;
    gstAmount: bigint;
    quantity: bigint;
    unitPrice: bigint;
    medicineId: bigint;
}
export interface PurchaseItem {
    mrp: bigint;
    qty: bigint;
    purchaseRate: bigint;
    gstPercent: bigint;
    freeQty: bigint;
    batch: string;
    expiry: string;
    medicineId: bigint;
    amount: bigint;
    medicineName: string;
}
export type Time = bigint;
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
export interface Bill {
    id: bigint;
    totalGST: bigint;
    grandTotal: bigint;
    billDate: Time;
    billNumber: bigint;
    paymentMode: PaymentMode;
    customerId: bigint;
    items: Array<BillItem>;
    totalDiscount: bigint;
    subtotal: bigint;
}
export interface DashboardStats {
    todayBillCount: bigint;
    lowStockMedicinesCount: bigint;
    todayTotalSales: bigint;
    totalMedicinesInStock: bigint;
}
export interface UserProfile {
    name: string;
    role: string;
}
export interface Customer {
    id: bigint;
    name: string;
    email: string;
    address: string;
    phone: string;
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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCustomer(cust: Customer): Promise<bigint>;
    addDistributor(dist: Distributor): Promise<bigint>;
    addMedicine(med: Medicine): Promise<bigint>;
    addPurchase(purchase: Purchase): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignRole(user: Principal, role: UserRole): Promise<void>;
    createBill(bill: Bill): Promise<bigint>;
    deleteCustomer(id: bigint): Promise<void>;
    deleteDistributor(id: bigint): Promise<void>;
    deleteMedicine(id: bigint): Promise<void>;
    getAllBills(): Promise<Array<Bill>>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllDistributors(): Promise<Array<Distributor>>;
    getAllMedicines(): Promise<Array<Medicine>>;
    getAllPurchases(): Promise<Array<Purchase>>;
    getBill(id: bigint): Promise<Bill>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(id: bigint): Promise<Customer>;
    getDashboardStats(): Promise<DashboardStats>;
    getDistributor(id: bigint): Promise<Distributor>;
    getMedicine(id: bigint): Promise<Medicine>;
    getPurchase(id: bigint): Promise<Purchase>;
    getPurchasesByDistributor(distributorId: bigint): Promise<Array<Purchase>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initialize(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCustomer(cust: Customer): Promise<void>;
    updateDistributor(dist: Distributor): Promise<void>;
    updateMedicine(med: Medicine): Promise<void>;
}
