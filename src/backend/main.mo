import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Time "mo:core/Time";



actor {
  public type UserProfile = { name : Text; role : Text };
  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  public type Unit = {
    #tablet;
    #strip;
    #bottle;
  };

  public type PaymentMode = {
    #cash;
    #card;
    #UPI;
  };

  public type Medicine = {
    id : Nat;
    name : Text;
    genericName : Text;
    manufacturer : Text;
    batchNumber : Text;
    expiryDate : Text;
    hsnCode : Text;
    unit : Unit;
    purchasePrice : Nat;
    sellingPrice : Nat;
    gstPercent : Nat;
    currentStock : Nat;
    reorderLevel : Nat;
    rackLocation : Text;
  };

  public type Customer = {
    id : Nat;
    name : Text;
    phone : Text;
    address : Text;
    email : Text;
  };

  public type BillItem = {
    medicineId : Nat;
    medicineName : Text;
    pack : Text;
    batch : Text;
    expiry : Text;
    hsnCode : Text;
    quantity : Nat;
    unitPrice : Nat;
    discountPercent : Nat;
    gstAmount : Nat;
    sgst : Nat;
    cgst : Nat;
  };

  public type Bill = {
    id : Nat;
    customerId : Nat;
    customerName : Text;
    customerAddress : Text;
    doctorName : Text;
    doctorAddress : Text;
    items : [BillItem];
    subtotal : Nat;
    totalDiscount : Nat;
    totalGST : Nat;
    grandTotal : Nat;
    paymentMode : PaymentMode;
    billDate : Time.Time;
    billNumber : Nat;
    invoiceNumber : Text;
    remark : Text;
  };

  public type DashboardStats = {
    todayTotalSales : Nat;
    todayBillCount : Nat;
    totalMedicinesInStock : Nat;
    lowStockMedicinesCount : Nat;
  };

  public type Distributor = {
    id : Nat;
    name : Text;
    contactPerson : Text;
    phone : Text;
    email : Text;
    address : Text;
    gstNumber : Text;
    drugLicenseNumber : Text;
  };

  public type PurchaseItem = {
    medicineId : Nat;
    medicineName : Text;
    pack : Text;
    batch : Text;
    expiry : Text;
    hsnCode : Text;
    qty : Nat;
    freeQty : Nat;
    purchaseRate : Nat;
    mrp : Nat;
    gstPercent : Nat;
    amount : Nat;
  };

  public type Purchase = {
    id : Nat;
    distributorId : Nat;
    distributorName : Text;
    invoiceNumber : Text;
    invoiceDate : Text;
    items : [PurchaseItem];
    subtotal : Nat;
    totalGST : Nat;
    grandTotal : Nat;
    purchaseDate : Time.Time;
  };

  public type SalesReturnItem = {
    medicineId : Nat;
    medicineName : Text;
    pack : Text;
    batch : Text;
    expiry : Text;
    hsnCode : Text;
    quantity : Nat;
    unitPrice : Nat;
    gstAmount : Nat;
    sgst : Nat;
    cgst : Nat;
    amount : Nat;
  };

  public type SalesReturn = {
    id : Nat;
    returnNumber : Nat;
    customerId : Nat;
    customerName : Text;
    customerAddress : Text;
    doctorName : Text;
    doctorAddress : Text;
    items : [SalesReturnItem];
    subtotal : Nat;
    totalGST : Nat;
    grandTotal : Nat;
    returnDate : Time.Time;
    remark : Text;
  };

  public type PurchaseReturnItem = {
    medicineId : Nat;
    medicineName : Text;
    pack : Text;
    batch : Text;
    expiry : Text;
    hsnCode : Text;
    quantity : Nat;
    unitPrice : Nat;
    gstAmount : Nat;
    sgst : Nat;
    cgst : Nat;
    amount : Nat;
  };

  public type PurchaseReturn = {
    id : Nat;
    returnNumber : Nat;
    distributorId : Nat;
    distributorName : Text;
    distributorAddress : Text;
    distributorGst : Text;
    distributorDlNo : Text;
    items : [PurchaseReturnItem];
    subtotal : Nat;
    totalGST : Nat;
    grandTotal : Nat;
    returnDate : Time.Time;
    remark : Text;
  };

  public type PharmacyProfile = {
    name : Text;
    address : Text;
    phone : Text;
    email : Text;
    gstNumber : Text;
    drugLicenseNumber : Text;
  };

  // In-memory working Maps (persisted via enhanced orthogonal persistence)
  let medicines = Map.empty<Nat, Medicine>();
  let customers = Map.empty<Nat, Customer>();
  let bills = Map.empty<Nat, Bill>();
  let distributors = Map.empty<Nat, Distributor>();
  let purchases = Map.empty<Nat, Purchase>();
  let salesReturns = Map.empty<Nat, SalesReturn>();
  let purchaseReturns = Map.empty<Nat, PurchaseReturn>();

  var nextMedicineId : Nat = 1;
  var nextCustomerId : Nat = 1;
  var nextBillId : Nat = 1;
  var nextBillNumber : Nat = 1;
  var nextDistributorId : Nat = 1;
  var nextPurchaseId : Nat = 1;
  var nextSalesReturnId : Nat = 1;
  var nextSalesReturnNumber : Nat = 1;
  var nextPurchaseReturnId : Nat = 1;
  var nextPurchaseReturnNumber : Nat = 1;
  var initialized : Bool = false;

  var pharmacyProfile : PharmacyProfile = {
    name = "Ambicure Healthcare and Pharmacy";
    address = "";
    phone = "";
    email = "";
    gstNumber = "";
    drugLicenseNumber = "";
  };

  private func initializeSampleData() : () {
    if (initialized) { return };
    initialized := true;

    // Only seed customers if none exist (guards against double-seeding after reinstall)
    if (customers.size() == 0) {
      let sampleCustomers : [Customer] = [
        { id = 1; name = "MR VIKAS BABU VARSHNEY"; phone = "8285995452"; address = ""; email = "" },
        { id = 2; name = "SARASWATI VEERWATI"; phone = "8285995452"; address = ""; email = "" },
        { id = 3; name = "RADHEY MEDICOS"; phone = "9971012696"; address = ""; email = "" },
        { id = 4; name = "CASH CUSTOMER"; phone = ""; address = ""; email = "" },
      ];
      for (cust in sampleCustomers.vals()) {
        customers.add(cust.id, cust);
      };
      nextCustomerId := 5;
    };

    // Seed medicines with exact batch, expiry, pack, MRP and purchase price from PDF data
    // purchasePrice and sellingPrice stored as integer rupees; MRP used as sellingPrice
    // Only seed if no medicines exist
    if (medicines.size() == 0) {
      let sampleMedicines : [Medicine] = [
      { id = 1; name = "ALBUREL 20%"; genericName = "Albumin"; manufacturer = ""; batchNumber = "ABL001"; expiryDate = "06/2026"; hsnCode = "3004"; unit = #bottle; purchasePrice = 2200; sellingPrice = 2500; gstPercent = 5; currentStock = 10; reorderLevel = 5; rackLocation = "" },
      { id = 2; name = "F-5 TABLETS 5MG"; genericName = "Folic Acid"; manufacturer = ""; batchNumber = "F5001"; expiryDate = "03/2027"; hsnCode = "3004"; unit = #strip; purchasePrice = 38; sellingPrice = 45; gstPercent = 5; currentStock = 50; reorderLevel = 5; rackLocation = "" },
      { id = 3; name = "CILACAR 10MG"; genericName = "Cilnidipine"; manufacturer = ""; batchNumber = "CIL001"; expiryDate = "06/2027"; hsnCode = "3004"; unit = #strip; purchasePrice = 95; sellingPrice = 120; gstPercent = 5; currentStock = 30; reorderLevel = 5; rackLocation = "" },
      { id = 4; name = "CYBLEX MV 80.3 TAB"; genericName = "Telmisartan+Amlodipine"; manufacturer = ""; batchNumber = "CYB001"; expiryDate = "12/2026"; hsnCode = "3004"; unit = #strip; purchasePrice = 150; sellingPrice = 185; gstPercent = 5; currentStock = 20; reorderLevel = 5; rackLocation = "" },
      { id = 5; name = "GABAPIN NT 100"; genericName = "Gabapentin+Nortriptyline"; manufacturer = ""; batchNumber = "GAB001"; expiryDate = "01/2027"; hsnCode = "3004"; unit = #strip; purchasePrice = 78; sellingPrice = 95; gstPercent = 5; currentStock = 40; reorderLevel = 5; rackLocation = "" },
      { id = 6; name = "HUMALOG MIX 25 CART"; genericName = "Insulin Lispro"; manufacturer = ""; batchNumber = "HUM001"; expiryDate = "09/2026"; hsnCode = "3004"; unit = #bottle; purchasePrice = 1100; sellingPrice = 1250; gstPercent = 5; currentStock = 5; reorderLevel = 3; rackLocation = "" },
      { id = 7; name = "METOSARTAN-50 TAB"; genericName = "Metoprolol+Losartan"; manufacturer = ""; batchNumber = "MET001"; expiryDate = "04/2027"; hsnCode = "3004"; unit = #strip; purchasePrice = 68; sellingPrice = 85; gstPercent = 5; currentStock = 25; reorderLevel = 5; rackLocation = "" },
      { id = 8; name = "MINIPRESS XL 5MG"; genericName = "Prazosin"; manufacturer = ""; batchNumber = "MIN001"; expiryDate = "02/2027"; hsnCode = "3004"; unit = #strip; purchasePrice = 88; sellingPrice = 110; gstPercent = 5; currentStock = 35; reorderLevel = 5; rackLocation = "" },
      { id = 9; name = "TAYO TOTAL"; genericName = "Cholecalciferol"; manufacturer = ""; batchNumber = "TAY001"; expiryDate = "06/2027"; hsnCode = "3004"; unit = #strip; purchasePrice = 75; sellingPrice = 95; gstPercent = 5; currentStock = 20; reorderLevel = 5; rackLocation = "" },
      { id = 10; name = "ECOSPRIN AV 75/10"; genericName = "Aspirin+Atorvastatin"; manufacturer = ""; batchNumber = "ECO001"; expiryDate = "05/2027"; hsnCode = "3004"; unit = #strip; purchasePrice = 42; sellingPrice = 55; gstPercent = 5; currentStock = 60; reorderLevel = 5; rackLocation = "" },
      { id = 11; name = "METPURE XL 50"; genericName = "Metoprolol"; manufacturer = ""; batchNumber = "METP001"; expiryDate = "03/2027"; hsnCode = "3004"; unit = #strip; purchasePrice = 58; sellingPrice = 75; gstPercent = 5; currentStock = 30; reorderLevel = 5; rackLocation = "" },
      { id = 12; name = "ZORYL M 2 FORTE TAB"; genericName = "Glimepiride+Metformin"; manufacturer = ""; batchNumber = "ZOR001"; expiryDate = "11/2026"; hsnCode = "3004"; unit = #strip; purchasePrice = 115; sellingPrice = 145; gstPercent = 5; currentStock = 15; reorderLevel = 5; rackLocation = "" },
      { id = 13; name = "XILINGIO 10/5"; genericName = "Dapagliflozin+Saxagliptin"; manufacturer = ""; batchNumber = "XIL001"; expiryDate = "02/2027"; hsnCode = "3004"; unit = #strip; purchasePrice = 185; sellingPrice = 225; gstPercent = 5; currentStock = 20; reorderLevel = 5; rackLocation = "" },
      { id = 14; name = "VOLIBO 0.3 TAB"; genericName = "Voglibose"; manufacturer = ""; batchNumber = "VOL001"; expiryDate = "04/2027"; hsnCode = "3004"; unit = #strip; purchasePrice = 52; sellingPrice = 65; gstPercent = 5; currentStock = 45; reorderLevel = 5; rackLocation = "" },
      { id = 15; name = "CREMAFFIN PLUS SYP"; genericName = "Liquid Paraffin+Milk of Magnesia"; manufacturer = ""; batchNumber = "CRE001"; expiryDate = "10/2026"; hsnCode = "3004"; unit = #bottle; purchasePrice = 125; sellingPrice = 155; gstPercent = 5; currentStock = 12; reorderLevel = 5; rackLocation = "" },
      { id = 16; name = "SAT ISABGOL 200GM"; genericName = "Psyllium Husk"; manufacturer = ""; batchNumber = "SAT001"; expiryDate = "01/2027"; hsnCode = "3004"; unit = #bottle; purchasePrice = 145; sellingPrice = 185; gstPercent = 5; currentStock = 18; reorderLevel = 5; rackLocation = "" },
      ];
      for (med in sampleMedicines.vals()) {
        medicines.add(med.id, med);
      };
      nextMedicineId := 17;
    };

    // Only seed distributors if none exist
    if (distributors.size() == 0) {
      let sampleDistributors : [Distributor] = [
        {
          id = 1; name = "Alpha Distributors"; contactPerson = "Mr. A"; phone = "1234567890";
          email = "alpha@dist.com"; address = "123 Alpha St"; gstNumber = "27AAAPL1234C1ZV"; drugLicenseNumber = "DL12345";
        },
        {
          id = 2; name = "Beta Pharma"; contactPerson = "Mrs. B"; phone = "0987654321";
          email = "beta@pharma.com"; address = "456 Beta Ave"; gstNumber = "27BBBPL2345D2WT"; drugLicenseNumber = "DL54321";
        },
      ];
      for (dist in sampleDistributors.vals()) {
        distributors.add(dist.id, dist);
      };
      nextDistributorId := 3;
    };

    // Seed bills (only if bills map is empty)
    // GST calculation: amount = MRP x qty; base = amount / 1.05; SGST = CGST = base x 0.025
    // All values in integer rupees (truncated)
    if (bills.size() == 0) {
      // Bill 1 - DN00001 - RADHEY MEDICOS
      // ALBUREL 20% x2: amount=5000, base=4762, SGST=119, CGST=119, gst=238
      let bill1 : Bill = {
        id = 1;
        billNumber = 1;
        invoiceNumber = "DN00001";
        billDate = 1705276800000000000; // 2024-01-15 in nanoseconds
        customerId = 3;
        customerName = "RADHEY MEDICOS";
        customerAddress = "";
        doctorName = "";
        doctorAddress = "";
        paymentMode = #cash;
        subtotal = 4762;
        totalDiscount = 0;
        totalGST = 238;
        grandTotal = 5000;
        remark = "";
        items = [
          {
            medicineId = 1; medicineName = "ALBUREL 20%"; pack = "100ml";
            batch = "ABL001"; expiry = "06/2026"; hsnCode = "3004";
            quantity = 2; unitPrice = 2500; discountPercent = 0;
            gstAmount = 238; sgst = 119; cgst = 119;
          }
        ];
      };

      // Bill 2 - 750 - MR VIKAS BABU VARSHNEY, Dr: RAJEEVE K RAJPUT
      // F-5 TABLETS 5MG x3: amount=135, base=128, SGST=3, CGST=3, gst=6
      let bill2 : Bill = {
        id = 2;
        billNumber = 2;
        invoiceNumber = "750";
        billDate = 1707523200000000000; // 2024-02-10 in nanoseconds
        customerId = 1;
        customerName = "MR VIKAS BABU VARSHNEY";
        customerAddress = "";
        doctorName = "RAJEEVE K RAJPUT";
        doctorAddress = "";
        paymentMode = #cash;
        subtotal = 128;
        totalDiscount = 0;
        totalGST = 6;
        grandTotal = 135;
        remark = "";
        items = [
          {
            medicineId = 2; medicineName = "F-5 TABLETS 5MG"; pack = "10 Tab";
            batch = "F5001"; expiry = "03/2027"; hsnCode = "3004";
            quantity = 3; unitPrice = 45; discountPercent = 0;
            gstAmount = 6; sgst = 3; cgst = 3;
          }
        ];
      };

      // Bill 3 - 1388 - SARASWATI VEERWATI, Dr: DR DIPTI GUPTA
      // CILACAR 10MG x2:        amount=240,  base=229,  sgst=6,  cgst=6,  gst=11
      // METOSARTAN-50 TAB x1:   amount=85,   base=81,   sgst=2,  cgst=2,  gst=4
      // MINIPRESS XL 5MG x2:    amount=220,  base=210,  sgst=5,  cgst=5,  gst=10
      // GABAPIN NT 100 x1:      amount=95,   base=90,   sgst=2,  cgst=2,  gst=4
      // HUMALOG MIX 25 CART x1: amount=1250, base=1190, sgst=30, cgst=30, gst=60
      // ZORYL M 2 FORTE TAB x2: amount=290,  base=276,  sgst=7,  cgst=7,  gst=14
      // ECOSPRIN AV 75/10 x1:   amount=55,   base=52,   sgst=1,  cgst=1,  gst=2
      // Total: amount=2235, base=2128, gst=105, subtotal=2128, grandTotal=2235 (rounded to 2235)
      let bill3 : Bill = {
        id = 3;
        billNumber = 3;
        invoiceNumber = "1388";
        billDate = 1709596800000000000; // 2024-03-05 in nanoseconds
        customerId = 2;
        customerName = "SARASWATI VEERWATI";
        customerAddress = "";
        doctorName = "DR DIPTI GUPTA";
        doctorAddress = "";
        paymentMode = #cash;
        subtotal = 2128;
        totalDiscount = 0;
        totalGST = 105;
        grandTotal = 2235;
        remark = "";
        items = [
          { medicineId = 3; medicineName = "CILACAR 10MG"; pack = "10 Tab"; batch = "CIL001"; expiry = "06/2027"; hsnCode = "3004"; quantity = 2; unitPrice = 120; discountPercent = 0; gstAmount = 11; sgst = 6; cgst = 6 },
          { medicineId = 7; medicineName = "METOSARTAN-50 TAB"; pack = "10 Tab"; batch = "MET001"; expiry = "04/2027"; hsnCode = "3004"; quantity = 1; unitPrice = 85; discountPercent = 0; gstAmount = 4; sgst = 2; cgst = 2 },
          { medicineId = 8; medicineName = "MINIPRESS XL 5MG"; pack = "10 Tab"; batch = "MIN001"; expiry = "02/2027"; hsnCode = "3004"; quantity = 2; unitPrice = 110; discountPercent = 0; gstAmount = 10; sgst = 5; cgst = 5 },
          { medicineId = 5; medicineName = "GABAPIN NT 100"; pack = "10 Tab"; batch = "GAB001"; expiry = "01/2027"; hsnCode = "3004"; quantity = 1; unitPrice = 95; discountPercent = 0; gstAmount = 4; sgst = 2; cgst = 2 },
          { medicineId = 6; medicineName = "HUMALOG MIX 25 CART"; pack = "3ml Cart"; batch = "HUM001"; expiry = "09/2026"; hsnCode = "3004"; quantity = 1; unitPrice = 1250; discountPercent = 0; gstAmount = 60; sgst = 30; cgst = 30 },
          { medicineId = 12; medicineName = "ZORYL M 2 FORTE TAB"; pack = "10 Tab"; batch = "ZOR001"; expiry = "11/2026"; hsnCode = "3004"; quantity = 2; unitPrice = 145; discountPercent = 0; gstAmount = 14; sgst = 7; cgst = 7 },
          { medicineId = 10; medicineName = "ECOSPRIN AV 75/10"; pack = "10 Tab"; batch = "ECO001"; expiry = "05/2027"; hsnCode = "3004"; quantity = 1; unitPrice = 55; discountPercent = 0; gstAmount = 2; sgst = 1; cgst = 1 }
        ];
      };

      // Bill 4 - 1389 - MR VIKAS BABU VARSHNEY, Dr: RAJEEVE K RAJPUT
      // CYBLEX MV 80.3 TAB x1:  amount=185,  base=176,  sgst=4,  cgst=4,  gst=8
      // METPURE XL 50 x2:       amount=150,  base=143,  sgst=4,  cgst=4,  gst=7
      // TAYO TOTAL x1:          amount=95,   base=90,   sgst=2,  cgst=2,  gst=4
      // XILINGIO 10/5 x1:       amount=225,  base=214,  sgst=5,  cgst=5,  gst=10
      // VOLIBO 0.3 TAB x2:      amount=130,  base=124,  sgst=3,  cgst=3,  gst=6
      // GABAPIN NT 100 x1:      amount=95,   base=90,   sgst=2,  cgst=2,  gst=4
      // MINIPRESS XL 5MG x1:    amount=110,  base=105,  sgst=3,  cgst=3,  gst=5
      // Total: amount=990, base=942, gst=44, subtotal=942, grandTotal=990 (rounded)
      let bill4 : Bill = {
        id = 4;
        billNumber = 4;
        invoiceNumber = "1389";
        billDate = 1709683200000000000; // 2024-03-06 in nanoseconds
        customerId = 1;
        customerName = "MR VIKAS BABU VARSHNEY";
        customerAddress = "";
        doctorName = "RAJEEVE K RAJPUT";
        doctorAddress = "";
        paymentMode = #cash;
        subtotal = 942;
        totalDiscount = 0;
        totalGST = 44;
        grandTotal = 990;
        remark = "";
        items = [
          { medicineId = 4; medicineName = "CYBLEX MV 80.3 TAB"; pack = "10 Tab"; batch = "CYB001"; expiry = "12/2026"; hsnCode = "3004"; quantity = 1; unitPrice = 185; discountPercent = 0; gstAmount = 8; sgst = 4; cgst = 4 },
          { medicineId = 11; medicineName = "METPURE XL 50"; pack = "10 Tab"; batch = "METP001"; expiry = "03/2027"; hsnCode = "3004"; quantity = 2; unitPrice = 75; discountPercent = 0; gstAmount = 7; sgst = 4; cgst = 4 },
          { medicineId = 9; medicineName = "TAYO TOTAL"; pack = "4 Tab"; batch = "TAY001"; expiry = "06/2027"; hsnCode = "3004"; quantity = 1; unitPrice = 95; discountPercent = 0; gstAmount = 4; sgst = 2; cgst = 2 },
          { medicineId = 13; medicineName = "XILINGIO 10/5"; pack = "10 Tab"; batch = "XIL001"; expiry = "02/2027"; hsnCode = "3004"; quantity = 1; unitPrice = 225; discountPercent = 0; gstAmount = 10; sgst = 5; cgst = 5 },
          { medicineId = 14; medicineName = "VOLIBO 0.3 TAB"; pack = "10 Tab"; batch = "VOL001"; expiry = "04/2027"; hsnCode = "3004"; quantity = 2; unitPrice = 65; discountPercent = 0; gstAmount = 6; sgst = 3; cgst = 3 },
          { medicineId = 5; medicineName = "GABAPIN NT 100"; pack = "10 Tab"; batch = "GAB001"; expiry = "01/2027"; hsnCode = "3004"; quantity = 1; unitPrice = 95; discountPercent = 0; gstAmount = 4; sgst = 2; cgst = 2 },
          { medicineId = 8; medicineName = "MINIPRESS XL 5MG"; pack = "10 Tab"; batch = "MIN001"; expiry = "02/2027"; hsnCode = "3004"; quantity = 1; unitPrice = 110; discountPercent = 0; gstAmount = 5; sgst = 3; cgst = 3 }
        ];
      };

      bills.add(1, bill1);
      bills.add(2, bill2);
      bills.add(3, bill3);
      bills.add(4, bill4);
      nextBillId := 5;
      nextBillNumber := 5;
    };
  };

  // Medicine CRUD
  public shared func addMedicine(med : Medicine) : async Nat {
    let id = nextMedicineId;
    nextMedicineId += 1;
    let newMed = { med with id };
    medicines.add(id, newMed);
    id;
  };

  public shared func updateMedicine(med : Medicine) : async () {
    switch (medicines.get(med.id)) {
      case (null) { Runtime.trap("Medicine not found") };
      case (?_) { medicines.add(med.id, med) };
    };
  };

  public shared func deleteMedicine(id : Nat) : async () {
    switch (medicines.get(id)) {
      case (null) { Runtime.trap("Medicine not found") };
      case (?_) { medicines.remove(id) };
    };
  };

  public query func getMedicine(id : Nat) : async Medicine {
    switch (medicines.get(id)) {
      case (null) { Runtime.trap("Medicine not found") };
      case (?med) { med };
    };
  };

  public query func getAllMedicines() : async [Medicine] {
    medicines.values().toArray();
  };

  // Customer CRUD
  public shared func addCustomer(cust : Customer) : async Nat {
    let id = nextCustomerId;
    nextCustomerId += 1;
    let newCust = { cust with id };
    customers.add(id, newCust);
    id;
  };

  public shared func updateCustomer(cust : Customer) : async () {
    switch (customers.get(cust.id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?_) { customers.add(cust.id, cust) };
    };
  };

  public shared func deleteCustomer(id : Nat) : async () {
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?_) { customers.remove(id) };
    };
  };

  public query func getCustomer(id : Nat) : async Customer {
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?cust) { cust };
    };
  };

  public query func getAllCustomers() : async [Customer] {
    customers.values().toArray();
  };

  // Billing
  public shared func createBill(bill : Bill) : async Nat {
    let id = nextBillId;
    nextBillId += 1;
    let billNumber = nextBillNumber;
    nextBillNumber += 1;
    let newBill = { bill with id; billNumber };
    bills.add(id, newBill);
    // Deduct stock
    for (item in bill.items.vals()) {
      switch (medicines.get(item.medicineId)) {
        case (null) {};
        case (?med) {
          let newStock = if (med.currentStock >= item.quantity) { med.currentStock - item.quantity } else { 0 };
          medicines.add(item.medicineId, { med with currentStock = newStock });
        };
      };
    };
    id;
  };

  public shared func updateBill(bill : Bill) : async () {
    switch (bills.get(bill.id)) {
      case (null) { Runtime.trap("Bill not found") };
      case (?oldBill) {
        // Restore old stock
        for (item in oldBill.items.vals()) {
          switch (medicines.get(item.medicineId)) {
            case (null) {};
            case (?med) {
              medicines.add(item.medicineId, { med with currentStock = med.currentStock + item.quantity });
            };
          };
        };
        // Deduct new stock
        for (item in bill.items.vals()) {
          switch (medicines.get(item.medicineId)) {
            case (null) {};
            case (?med) {
              let newStock = if (med.currentStock >= item.quantity) { med.currentStock - item.quantity } else { 0 };
              medicines.add(item.medicineId, { med with currentStock = newStock });
            };
          };
        };
        bills.add(bill.id, bill);
      };
    };
  };

  public shared func deleteBill(id : Nat) : async () {
    switch (bills.get(id)) {
      case (null) { Runtime.trap("Bill not found") };
      case (?bill) {
        // Restore stock
        for (item in bill.items.vals()) {
          switch (medicines.get(item.medicineId)) {
            case (null) {};
            case (?med) {
              medicines.add(item.medicineId, { med with currentStock = med.currentStock + item.quantity });
            };
          };
        };
        bills.remove(id);
      };
    };
  };

  public query func getBill(id : Nat) : async Bill {
    switch (bills.get(id)) {
      case (null) { Runtime.trap("Bill not found") };
      case (?bill) { bill };
    };
  };

  public query func getAllBills() : async [Bill] {
    bills.values().toArray();
  };

  // Dashboard Stats
  public query func getDashboardStats() : async DashboardStats {
    let now = Time.now();
    let oneDayNanos = 24 * 60 * 60 * 1_000_000_000;
    let todayStart = now - (now % oneDayNanos);

    var todayTotalSales = 0;
    var todayBillCount = 0;

    for (bill in bills.values()) {
      if (bill.billDate >= todayStart) {
        todayTotalSales += bill.grandTotal;
        todayBillCount += 1;
      };
    };

    var totalMedicinesInStock = 0;
    var lowStockMedicinesCount = 0;

    for (med in medicines.values()) {
      totalMedicinesInStock += med.currentStock;
      if (med.currentStock <= med.reorderLevel) {
        lowStockMedicinesCount += 1;
      };
    };

    {
      todayTotalSales;
      todayBillCount;
      totalMedicinesInStock;
      lowStockMedicinesCount;
    };
  };

  // Distributor CRUD
  public shared func addDistributor(dist : Distributor) : async Nat {
    let id = nextDistributorId;
    nextDistributorId += 1;
    let newDist = { dist with id };
    distributors.add(id, newDist);
    id;
  };

  public shared func updateDistributor(dist : Distributor) : async () {
    switch (distributors.get(dist.id)) {
      case (null) { Runtime.trap("Distributor not found") };
      case (?_) { distributors.add(dist.id, dist) };
    };
  };

  public shared func deleteDistributor(id : Nat) : async () {
    switch (distributors.get(id)) {
      case (null) { Runtime.trap("Distributor not found") };
      case (?_) { distributors.remove(id) };
    };
  };

  public query func getDistributor(id : Nat) : async Distributor {
    switch (distributors.get(id)) {
      case (null) { Runtime.trap("Distributor not found") };
      case (?dist) { dist };
    };
  };

  public query func getAllDistributors() : async [Distributor] {
    distributors.values().toArray();
  };

  // Purchase CRUD
  public shared func addPurchase(purchase : Purchase) : async Nat {
    for (item in purchase.items.vals()) {
      let totalQty = item.qty + item.freeQty;
      switch (medicines.get(item.medicineId)) {
        case (null) {};
        case (?med) {
          let updatedMed = { med with currentStock = med.currentStock + totalQty };
          medicines.add(item.medicineId, updatedMed);
        };
      };
    };

    let id = nextPurchaseId;
    nextPurchaseId += 1;
    let newPurchase = { purchase with id };
    purchases.add(id, newPurchase);
    id;
  };

  public query func getPurchase(id : Nat) : async Purchase {
    switch (purchases.get(id)) {
      case (null) { Runtime.trap("Purchase not found") };
      case (?purchase) { purchase };
    };
  };

  public query func getAllPurchases() : async [Purchase] {
    purchases.values().toArray();
  };

  public query func getPurchasesByDistributor(distributorId : Nat) : async [Purchase] {
    purchases.values().filter(
      func(p) { p.distributorId == distributorId }
    ).toArray();
  };

  // Sales Return CRUD
  public shared func createSalesReturn(ret : SalesReturn) : async Nat {
    let id = nextSalesReturnId;
    nextSalesReturnId += 1;
    let returnNumber = nextSalesReturnNumber;
    nextSalesReturnNumber += 1;
    let newRet = { ret with id; returnNumber };
    salesReturns.add(id, newRet);
    // Restore stock on return
    for (item in ret.items.vals()) {
      switch (medicines.get(item.medicineId)) {
        case (null) {};
        case (?med) {
          medicines.add(item.medicineId, { med with currentStock = med.currentStock + item.quantity });
        };
      };
    };
    id;
  };

  public shared func updateSalesReturn(ret : SalesReturn) : async () {
    switch (salesReturns.get(ret.id)) {
      case (null) { Runtime.trap("Sales return not found") };
      case (?oldRet) {
        // Reverse old stock restore
        for (item in oldRet.items.vals()) {
          switch (medicines.get(item.medicineId)) {
            case (null) {};
            case (?med) {
              let newStock = if (med.currentStock >= item.quantity) { med.currentStock - item.quantity } else { 0 };
              medicines.add(item.medicineId, { med with currentStock = newStock });
            };
          };
        };
        // Apply new stock restore
        for (item in ret.items.vals()) {
          switch (medicines.get(item.medicineId)) {
            case (null) {};
            case (?med) {
              medicines.add(item.medicineId, { med with currentStock = med.currentStock + item.quantity });
            };
          };
        };
        salesReturns.add(ret.id, ret);
      };
    };
  };

  public shared func deleteSalesReturn(id : Nat) : async () {
    switch (salesReturns.get(id)) {
      case (null) { Runtime.trap("Sales return not found") };
      case (?ret) {
        // Reverse stock restore
        for (item in ret.items.vals()) {
          switch (medicines.get(item.medicineId)) {
            case (null) {};
            case (?med) {
              let newStock = if (med.currentStock >= item.quantity) { med.currentStock - item.quantity } else { 0 };
              medicines.add(item.medicineId, { med with currentStock = newStock });
            };
          };
        };
        salesReturns.remove(id);
      };
    };
  };

  public query func getSalesReturn(id : Nat) : async SalesReturn {
    switch (salesReturns.get(id)) {
      case (null) { Runtime.trap("Sales return not found") };
      case (?ret) { ret };
    };
  };

  public query func getAllSalesReturns() : async [SalesReturn] {
    salesReturns.values().toArray();
  };

  // Purchase Return CRUD
  public shared func createPurchaseReturn(ret : PurchaseReturn) : async Nat {
    let id = nextPurchaseReturnId;
    nextPurchaseReturnId += 1;
    let returnNumber = nextPurchaseReturnNumber;
    nextPurchaseReturnNumber += 1;
    let newRet = { ret with id; returnNumber };
    purchaseReturns.add(id, newRet);
    // Deduct stock on purchase return
    for (item in ret.items.vals()) {
      switch (medicines.get(item.medicineId)) {
        case (null) {};
        case (?med) {
          let newStock = if (med.currentStock >= item.quantity) { med.currentStock - item.quantity } else { 0 };
          medicines.add(item.medicineId, { med with currentStock = newStock });
        };
      };
    };
    id;
  };

  public shared func updatePurchaseReturn(ret : PurchaseReturn) : async () {
    switch (purchaseReturns.get(ret.id)) {
      case (null) { Runtime.trap("Purchase return not found") };
      case (?oldRet) {
        // Reverse old deduction
        for (item in oldRet.items.vals()) {
          switch (medicines.get(item.medicineId)) {
            case (null) {};
            case (?med) {
              medicines.add(item.medicineId, { med with currentStock = med.currentStock + item.quantity });
            };
          };
        };
        // Apply new deduction
        for (item in ret.items.vals()) {
          switch (medicines.get(item.medicineId)) {
            case (null) {};
            case (?med) {
              let newStock = if (med.currentStock >= item.quantity) { med.currentStock - item.quantity } else { 0 };
              medicines.add(item.medicineId, { med with currentStock = newStock });
            };
          };
        };
        purchaseReturns.add(ret.id, ret);
      };
    };
  };

  public shared func deletePurchaseReturn(id : Nat) : async () {
    switch (purchaseReturns.get(id)) {
      case (null) { Runtime.trap("Purchase return not found") };
      case (?ret) {
        // Reverse deduction
        for (item in ret.items.vals()) {
          switch (medicines.get(item.medicineId)) {
            case (null) {};
            case (?med) {
              medicines.add(item.medicineId, { med with currentStock = med.currentStock + item.quantity });
            };
          };
        };
        purchaseReturns.remove(id);
      };
    };
  };

  public query func getPurchaseReturn(id : Nat) : async PurchaseReturn {
    switch (purchaseReturns.get(id)) {
      case (null) { Runtime.trap("Purchase return not found") };
      case (?ret) { ret };
    };
  };

  public query func getAllPurchaseReturns() : async [PurchaseReturn] {
    purchaseReturns.values().toArray();
  };

  // Pharmacy Profile
  public query func getPharmacyProfile() : async PharmacyProfile {
    pharmacyProfile;
  };

  public shared func updatePharmacyProfile(profile : PharmacyProfile) : async () {
    pharmacyProfile := profile;
  };

  public shared func initialize() : async () {
    initializeSampleData();
  };

  // Force re-seed if canister was reinstalled and all data was wiped.
  // Safe to call any time — only seeds when all data stores are empty.
  public shared func reinitializeIfEmpty() : async () {
    if (customers.size() == 0 and medicines.size() == 0 and bills.size() == 0) {
      initialized := false;
      initializeSampleData();
    };
  };

  // Returns counts so the frontend can verify data is present after deploy
  public query func getDataCounts() : async {
    customers : Nat;
    medicines : Nat;
    bills : Nat;
    distributors : Nat;
    purchases : Nat;
    salesReturns : Nat;
    purchaseReturns : Nat;
  } {
    {
      customers = customers.size();
      medicines = medicines.size();
      bills = bills.size();
      distributors = distributors.size();
      purchases = purchases.size();
      salesReturns = salesReturns.size();
      purchaseReturns = purchaseReturns.size();
    };
  };
};
