import { getCache, setCache } from "../hooks/useOfflineStore";

const SEED_FLAG = "pharmabill_pdf_import_v1";

interface SeedMedicine {
  id: bigint;
  name: string;
  genericName: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  hsnCode: string;
  unit: string;
  purchasePrice: bigint;
  sellingPrice: bigint;
  gstPercent: bigint;
  currentStock: bigint;
  reorderLevel: bigint;
  rackLocation: string;
}

interface SeedCustomer {
  id: bigint;
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface SeedBillItem {
  medicineId: bigint;
  quantity: bigint;
  unitPrice: bigint;
  gstAmount: bigint;
  discountPercent: bigint;
  hsnCode?: string;
}

interface SeedBill {
  id: bigint;
  billNumber: bigint;
  billDate: bigint;
  customerId: bigint;
  paymentMode: string;
  subtotal: bigint;
  totalDiscount: bigint;
  totalGST: bigint;
  grandTotal: bigint;
  items: SeedBillItem[];
  invoiceNo?: string;
}

// Medicine IDs (negative to avoid server conflicts)
const MED = {
  ALBUREL: -100n,
  F5_TABLETS: -101n,
  CILACAR: -102n,
  CYBLEX: -103n,
  GABAPIN: -104n,
  HUMALOG: -105n,
  METOSARTAN: -106n,
  MINIPRESS: -107n,
  TAYO: -108n,
  ECOSPRIN: -109n,
  METPURE: -110n,
  ZORYL: -111n,
  XILINGIO: -112n,
  VOLIBO: -113n,
  CREMAFFIN: -114n,
  ISABGOL: -115n,
};

// Customer IDs (negative)
const CUST = {
  VIKAS: -200n,
  SARASWATI: -201n,
  RADHEY: -202n,
};

const MEDICINES: SeedMedicine[] = [
  {
    id: MED.ALBUREL,
    name: "ALBUREL 20%",
    genericName: "Human Albumin 20%",
    manufacturer: "",
    batchNumber: "AN20G25133",
    expiryDate: "10/28",
    hsnCode: "30049099",
    unit: "bottle",
    sellingPrice: 974900n,
    purchasePrice: 390476n,
    gstPercent: 5n,
    currentStock: 1n,
    reorderLevel: 2n,
    rackLocation: "",
  },
  {
    id: MED.F5_TABLETS,
    name: "F-5 TABLETS 5MG",
    genericName: "Folic Acid 5mg",
    manufacturer: "",
    batchNumber: "",
    expiryDate: "",
    hsnCode: "3004",
    unit: "strip",
    sellingPrice: 720n,
    purchasePrice: 720n,
    gstPercent: 5n,
    currentStock: 21n,
    reorderLevel: 5n,
    rackLocation: "",
  },
  {
    id: MED.CILACAR,
    name: "CILACAR 10MG",
    genericName: "Cilnidipine 10mg",
    manufacturer: "",
    batchNumber: "AC925027",
    expiryDate: "7/28",
    hsnCode: "3004",
    unit: "strip",
    sellingPrice: 21945n,
    purchasePrice: 21945n,
    gstPercent: 5n,
    currentStock: 2n,
    reorderLevel: 3n,
    rackLocation: "",
  },
  {
    id: MED.CYBLEX,
    name: "CYBLEX MV 80.3 TAB",
    genericName: "Telmisartan/Metoprolol/Chlorthalidone",
    manufacturer: "",
    batchNumber: "GCVG25010",
    expiryDate: "5/28",
    hsnCode: "3004",
    unit: "strip",
    sellingPrice: 26259n,
    purchasePrice: 26259n,
    gstPercent: 5n,
    currentStock: 4n,
    reorderLevel: 3n,
    rackLocation: "",
  },
  {
    id: MED.GABAPIN,
    name: "GABAPIN NT 100",
    genericName: "Gabapentin + Nortriptyline",
    manufacturer: "",
    batchNumber: "N2503112",
    expiryDate: "8/27",
    hsnCode: "3004",
    unit: "strip",
    sellingPrice: 21797n,
    purchasePrice: 21797n,
    gstPercent: 5n,
    currentStock: 2n,
    reorderLevel: 3n,
    rackLocation: "",
  },
  {
    id: MED.HUMALOG,
    name: "HUMALOG MIX 25 CART",
    genericName: "Insulin Lispro Mix 25",
    manufacturer: "",
    batchNumber: "D813655E",
    expiryDate: "5/27",
    hsnCode: "3004",
    unit: "bottle",
    sellingPrice: 108900n,
    purchasePrice: 108900n,
    gstPercent: 5n,
    currentStock: 10n,
    reorderLevel: 5n,
    rackLocation: "",
  },
  {
    id: MED.METOSARTAN,
    name: "METOSARTAN-50 TAB",
    genericName: "Metoprolol + Telmisartan 50mg",
    manufacturer: "",
    batchNumber: "SIG0901A",
    expiryDate: "11/26",
    hsnCode: "3004",
    unit: "strip",
    sellingPrice: 20813n,
    purchasePrice: 20813n,
    gstPercent: 5n,
    currentStock: 6n,
    reorderLevel: 3n,
    rackLocation: "",
  },
  {
    id: MED.MINIPRESS,
    name: "MINIPRESS XL 5MG",
    genericName: "Prazosin 5mg XL",
    manufacturer: "",
    batchNumber: "MR2988",
    expiryDate: "8/28",
    hsnCode: "3004",
    unit: "strip",
    sellingPrice: 64550n,
    purchasePrice: 64550n,
    gstPercent: 5n,
    currentStock: 2n,
    reorderLevel: 2n,
    rackLocation: "",
  },
  {
    id: MED.TAYO,
    name: "TAYO TOTAL",
    genericName: "Vitamin D3 + Calcium + Zinc",
    manufacturer: "",
    batchNumber: "ATYU25003",
    expiryDate: "12/26",
    hsnCode: "3004",
    unit: "strip",
    sellingPrice: 23181n,
    purchasePrice: 23181n,
    gstPercent: 5n,
    currentStock: 2n,
    reorderLevel: 3n,
    rackLocation: "",
  },
  {
    id: MED.ECOSPRIN,
    name: "ECOSPRIN AV 75/10",
    genericName: "Aspirin 75mg + Atorvastatin 10mg",
    manufacturer: "",
    batchNumber: "28026553",
    expiryDate: "9/26",
    hsnCode: "3004",
    unit: "strip",
    sellingPrice: 6084n,
    purchasePrice: 6084n,
    gstPercent: 5n,
    currentStock: 2n,
    reorderLevel: 3n,
    rackLocation: "",
  },
  {
    id: MED.METPURE,
    name: "METPURE XL 50",
    genericName: "Metoprolol Succinate 50mg XL",
    manufacturer: "",
    batchNumber: "EM250325",
    expiryDate: "1/28",
    hsnCode: "3004",
    unit: "strip",
    sellingPrice: 19680n,
    purchasePrice: 19680n,
    gstPercent: 5n,
    currentStock: 3n,
    reorderLevel: 3n,
    rackLocation: "",
  },
  {
    id: MED.ZORYL,
    name: "ZORYL M 2 FORTE TAB",
    genericName: "Glimepiride + Metformin 2mg Forte",
    manufacturer: "",
    batchNumber: "N2502525",
    expiryDate: "1/27",
    hsnCode: "3004",
    unit: "strip",
    sellingPrice: 26625n,
    purchasePrice: 26625n,
    gstPercent: 5n,
    currentStock: 4n,
    reorderLevel: 3n,
    rackLocation: "",
  },
  {
    id: MED.XILINGIO,
    name: "XILINGIO 10/5",
    genericName: "Xigduo / Dapagliflozin + Saxagliptin",
    manufacturer: "",
    batchNumber: "2ST6M020",
    expiryDate: "6/27",
    hsnCode: "3004",
    unit: "strip",
    sellingPrice: 14905n,
    purchasePrice: 14905n,
    gstPercent: 5n,
    currentStock: 3n,
    reorderLevel: 3n,
    rackLocation: "",
  },
  {
    id: MED.VOLIBO,
    name: "VOLIBO 0.3 TAB",
    genericName: "Voglibose 0.3mg",
    manufacturer: "",
    batchNumber: "GTF0526A",
    expiryDate: "7/26",
    hsnCode: "3004",
    unit: "strip",
    sellingPrice: 23062n,
    purchasePrice: 23062n,
    gstPercent: 5n,
    currentStock: 4n,
    reorderLevel: 3n,
    rackLocation: "",
  },
  {
    id: MED.CREMAFFIN,
    name: "CREMAFFIN PLUS SYP",
    genericName: "Liquid Paraffin + Milk of Magnesia Syrup",
    manufacturer: "",
    batchNumber: "80257407",
    expiryDate: "7/28",
    hsnCode: "30049032",
    unit: "bottle",
    sellingPrice: 33780n,
    purchasePrice: 33780n,
    gstPercent: 5n,
    currentStock: 1n,
    reorderLevel: 2n,
    rackLocation: "",
  },
  {
    id: MED.ISABGOL,
    name: "SAT ISABGOL 200GM",
    genericName: "Psyllium Husk 200g",
    manufacturer: "",
    batchNumber: "SFP00452",
    expiryDate: "3/26",
    hsnCode: "30021290",
    unit: "bottle",
    sellingPrice: 37500n,
    purchasePrice: 37500n,
    gstPercent: 5n,
    currentStock: 1n,
    reorderLevel: 1n,
    rackLocation: "",
  },
];

const CUSTOMERS: SeedCustomer[] = [
  {
    id: CUST.VIKAS,
    name: "MR VIKAS BABU VARSHNEY",
    phone: "8285995452",
    email: "",
    address: "",
  },
  {
    id: CUST.SARASWATI,
    name: "SARASWATI VEERWATI",
    phone: "8285995452",
    email: "DR DIPTI GUPTA",
    address: "DMC 9321",
  },
  {
    id: CUST.RADHEY,
    name: "RADHEY MEDICOS",
    phone: "9971012696",
    email: "",
    address: "",
  },
];

function dateToNs(dateStr: string): bigint {
  return BigInt(new Date(dateStr).getTime()) * 1_000_000n;
}

// Compute GST-inclusive subtotal, totalGST for bill items
function calcBillTotals(items: SeedBillItem[]): {
  subtotal: bigint;
  totalGST: bigint;
} {
  let subtotal = 0;
  let totalGST = 0;
  for (const item of items) {
    const amount = Number(item.quantity) * Number(item.unitPrice);
    totalGST += Number(item.gstAmount);
    subtotal += amount - Number(item.gstAmount);
  }
  return {
    subtotal: BigInt(Math.round(subtotal)),
    totalGST: BigInt(Math.round(totalGST)),
  };
}

function makeItem(
  medId: bigint,
  qty: number,
  unitPrice: number,
  gstPct: number,
  hsnCode: string,
): SeedBillItem {
  const amount = qty * unitPrice;
  const gstAmount = amount - amount / (1 + gstPct / 100);
  return {
    medicineId: medId,
    quantity: BigInt(qty),
    unitPrice: BigInt(unitPrice),
    gstAmount: BigInt(Math.round(gstAmount)),
    discountPercent: 0n,
    hsnCode,
  };
}

const BILLS: SeedBill[] = [
  // Bill 1 — DN00001, no patient (walk-in)
  {
    id: -1n,
    billNumber: -1n,
    billDate: dateToNs("2026-03-10"),
    customerId: -999n,
    paymentMode: "cash",
    subtotal: 390476n,
    totalDiscount: 0n,
    totalGST: 19524n,
    grandTotal: 410000n,
    invoiceNo: "DN00001",
    items: [makeItem(MED.ALBUREL, 1, 974900, 5, "30049099")],
  },
  // Bill 2 — DN00001 (RADHEY MEDICOS)
  {
    id: -2n,
    billNumber: -2n,
    billDate: dateToNs("2026-03-10"),
    customerId: CUST.RADHEY,
    paymentMode: "cash",
    subtotal: 390476n,
    totalDiscount: 0n,
    totalGST: 19524n,
    grandTotal: 410000n,
    invoiceNo: "DN00001-D",
    items: [makeItem(MED.ALBUREL, 1, 974900, 5, "30049099")],
  },
  // Bill 3 — Challan 0750, VIKAS BABU
  {
    id: -3n,
    billNumber: -3n,
    billDate: dateToNs("2026-01-08"),
    customerId: CUST.VIKAS,
    paymentMode: "cash",
    subtotal: 14572n,
    totalDiscount: 0n,
    totalGST: 728n,
    grandTotal: 15300n,
    invoiceNo: "0750",
    items: [makeItem(MED.F5_TABLETS, 21, 720, 5, "3004")],
  },
  // Bill 4 — Challan 01388, SARASWATI VEERWATI
  {
    id: -4n,
    billNumber: -4n,
    billDate: dateToNs("2026-01-08"),
    customerId: CUST.SARASWATI,
    paymentMode: "cash",
    ...(() => {
      const items = [
        makeItem(MED.CILACAR, 2, 21945, 5, "3004"),
        makeItem(MED.CYBLEX, 4, 26259, 5, "3004"),
        makeItem(MED.GABAPIN, 2, 21797, 5, "3004"),
        makeItem(MED.HUMALOG, 10, 108900, 5, "3004"),
        makeItem(MED.METOSARTAN, 6, 20813, 5, "3004"),
        makeItem(MED.MINIPRESS, 2, 64550, 5, "3004"),
        makeItem(MED.TAYO, 2, 23181, 5, "3004"),
      ];
      const totals = calcBillTotals(items);
      return {
        subtotal: totals.subtotal,
        totalDiscount: 0n,
        totalGST: totals.totalGST,
        grandTotal: totals.subtotal + totals.totalGST,
        items,
      };
    })(),
    invoiceNo: "01388",
  },
  // Bill 5 — Challan 01389, VIKAS BABU
  {
    id: -5n,
    billNumber: -5n,
    billDate: dateToNs("2026-01-08"),
    customerId: CUST.VIKAS,
    paymentMode: "cash",
    ...(() => {
      const items = [
        makeItem(MED.ECOSPRIN, 2, 6084, 5, "3004"),
        makeItem(MED.METPURE, 3, 19680, 5, "3004"),
        makeItem(MED.ZORYL, 4, 26625, 5, "3004"),
        makeItem(MED.XILINGIO, 3, 14905, 5, "3004"),
        makeItem(MED.VOLIBO, 4, 23062, 5, "3004"),
        makeItem(MED.CREMAFFIN, 1, 33780, 5, "30049032"),
        makeItem(MED.ISABGOL, 1, 37500, 5, "30021290"),
      ];
      const totals = calcBillTotals(items);
      return {
        subtotal: totals.subtotal,
        totalDiscount: 0n,
        totalGST: totals.totalGST,
        grandTotal: totals.subtotal + totals.totalGST,
        items,
      };
    })(),
    invoiceNo: "01389",
  },
];

// Walk-in cash customer for bill 1
const WALK_IN_CUSTOMER: SeedCustomer = {
  id: -999n,
  name: "CASH CUSTOMER",
  phone: "",
  email: "",
  address: "",
};

export function seedImportedData(): void {
  try {
    if (localStorage.getItem(SEED_FLAG)) return;

    // Seed medicines — merge with existing, skip if same ID already present
    const existingMeds = getCache<SeedMedicine[]>("medicines") ?? [];
    const existingMedIds = new Set(existingMeds.map((m) => String(m.id)));
    const newMeds = MEDICINES.filter((m) => !existingMedIds.has(String(m.id)));
    if (newMeds.length > 0) {
      setCache("medicines", [...existingMeds, ...newMeds]);
    }

    // Seed customers — merge
    const existingCustomers = getCache<SeedCustomer[]>("customers") ?? [];
    const existingCustIds = new Set(existingCustomers.map((c) => String(c.id)));
    const allSeedCustomers = [...CUSTOMERS, WALK_IN_CUSTOMER];
    const newCustomers = allSeedCustomers.filter(
      (c) => !existingCustIds.has(String(c.id)),
    );
    if (newCustomers.length > 0) {
      setCache("customers", [...existingCustomers, ...newCustomers]);
    }

    // Seed bills — merge, skip if same ID already present
    const existingBills = getCache<SeedBill[]>("bills") ?? [];
    const existingBillIds = new Set(existingBills.map((b) => String(b.id)));
    const newBills = BILLS.filter((b) => !existingBillIds.has(String(b.id)));
    if (newBills.length > 0) {
      setCache("bills", [...existingBills, ...newBills]);
    }

    localStorage.setItem(SEED_FLAG, "1");
  } catch {
    // Silently ignore seed errors — never block app load
  }
}

// Customer seeding to the backend canister is handled by the SeedBackendCustomers
// component in App.tsx, which calls actor.addCustomer() directly so data persists
// across all devices including the installed PWA.
