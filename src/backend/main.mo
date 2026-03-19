import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Iter "mo:core/Iter";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = { name : Text; role : Text };
  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func assignRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
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
    quantity : Nat;
    unitPrice : Nat;
    discountPercent : Nat;
    gstAmount : Nat;
  };

  public type Bill = {
    id : Nat;
    customerId : Nat;
    items : [BillItem];
    subtotal : Nat;
    totalDiscount : Nat;
    totalGST : Nat;
    grandTotal : Nat;
    paymentMode : PaymentMode;
    billDate : Time.Time;
    billNumber : Nat;
  };

  public type DashboardStats = {
    todayTotalSales : Nat;
    todayBillCount : Nat;
    totalMedicinesInStock : Nat;
    lowStockMedicinesCount : Nat;
  };

  // New types for distributors and purchases
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
    batch : Text;
    expiry : Text;
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

  let medicines = Map.empty<Nat, Medicine>();
  let customers = Map.empty<Nat, Customer>();
  let bills = Map.empty<Nat, Bill>();
  let distributors = Map.empty<Nat, Distributor>();
  let purchases = Map.empty<Nat, Purchase>();

  var nextMedicineId = 1;
  var nextCustomerId = 1;
  var nextBillId = 1;
  var nextBillNumber = 1;
  var nextDistributorId = 1;
  var nextPurchaseId = 1;
  var initialized = false;

  private func initializeSampleData() : () {
    if (initialized) { return };
    initialized := true;

    let sampleMedicines : [Medicine] = [
      {
        id = 1; name = "Paracetamol 500mg"; genericName = "Paracetamol";
        manufacturer = "PharmaCo"; batchNumber = "PC001"; expiryDate = "2025-12-31";
        hsnCode = "30049011"; unit = #tablet; purchasePrice = 2; sellingPrice = 5;
        gstPercent = 12; currentStock = 500; reorderLevel = 100; rackLocation = "A1";
      },
      {
        id = 2; name = "Amoxicillin 250mg"; genericName = "Amoxicillin";
        manufacturer = "MediLabs"; batchNumber = "ML002"; expiryDate = "2025-10-15";
        hsnCode = "30049012"; unit = #strip; purchasePrice = 15; sellingPrice = 30;
        gstPercent = 12; currentStock = 200; reorderLevel = 50; rackLocation = "A2";
      },
      {
        id = 3; name = "Cough Syrup"; genericName = "Dextromethorphan";
        manufacturer = "HealthPlus"; batchNumber = "HP003"; expiryDate = "2026-03-20";
        hsnCode = "30049013"; unit = #bottle; purchasePrice = 50; sellingPrice = 100;
        gstPercent = 18; currentStock = 80; reorderLevel = 20; rackLocation = "B1";
      },
      {
        id = 4; name = "Aspirin 75mg"; genericName = "Acetylsalicylic Acid";
        manufacturer = "CardioMed"; batchNumber = "CM004"; expiryDate = "2025-08-10";
        hsnCode = "30049014"; unit = #tablet; purchasePrice = 3; sellingPrice = 7;
        gstPercent = 12; currentStock = 300; reorderLevel = 80; rackLocation = "A3";
      },
      {
        id = 5; name = "Vitamin D3"; genericName = "Cholecalciferol";
        manufacturer = "VitaLife"; batchNumber = "VL005"; expiryDate = "2026-06-30";
        hsnCode = "30049015"; unit = #tablet; purchasePrice = 10; sellingPrice = 20;
        gstPercent = 12; currentStock = 150; reorderLevel = 40; rackLocation = "C1";
      },
      {
        id = 6; name = "Ibuprofen 400mg"; genericName = "Ibuprofen";
        manufacturer = "PainRelief Inc"; batchNumber = "PR006"; expiryDate = "2025-11-25";
        hsnCode = "30049016"; unit = #tablet; purchasePrice = 4; sellingPrice = 9;
        gstPercent = 12; currentStock = 400; reorderLevel = 100; rackLocation = "A4";
      },
      {
        id = 7; name = "Cetirizine 10mg"; genericName = "Cetirizine";
        manufacturer = "AllergyFree"; batchNumber = "AF007"; expiryDate = "2026-01-15";
        hsnCode = "30049017"; unit = #tablet; purchasePrice = 2; sellingPrice = 5;
        gstPercent = 12; currentStock = 250; reorderLevel = 60; rackLocation = "B2";
      },
      {
        id = 8; name = "Omeprazole 20mg"; genericName = "Omeprazole";
        manufacturer = "GastroCare"; batchNumber = "GC008"; expiryDate = "2025-09-30";
        hsnCode = "30049018"; unit = #strip; purchasePrice = 8; sellingPrice = 18;
        gstPercent = 12; currentStock = 180; reorderLevel = 50; rackLocation = "B3";
      },
      {
        id = 9; name = "Metformin 500mg"; genericName = "Metformin";
        manufacturer = "DiabetesCare"; batchNumber = "DC009"; expiryDate = "2026-04-20";
        hsnCode = "30049019"; unit = #tablet; purchasePrice = 5; sellingPrice = 12;
        gstPercent = 12; currentStock = 90; reorderLevel = 100; rackLocation = "C2";
      },
      {
        id = 10; name = "Antibiotic Ointment"; genericName = "Neomycin";
        manufacturer = "SkinCare Ltd"; batchNumber = "SC010"; expiryDate = "2025-07-10";
        hsnCode = "30049020"; unit = #bottle; purchasePrice = 30; sellingPrice = 60;
        gstPercent = 18; currentStock = 60; reorderLevel = 25; rackLocation = "D1";
      },
    ];

    for (med in sampleMedicines.vals()) {
      medicines.add(med.id, med);
    };
    nextMedicineId := 11;

    let sampleCustomers : [Customer] = [
      { id = 1; name = "John Doe"; phone = "9876543210"; address = "123 Main St"; email = "john@example.com" },
      { id = 2; name = "Jane Smith"; phone = "9876543211"; address = "456 Oak Ave"; email = "jane@example.com" },
      { id = 3; name = "Bob Johnson"; phone = "9876543212"; address = "789 Pine Rd"; email = "bob@example.com" },
      { id = 4; name = "Alice Williams"; phone = "9876543213"; address = "321 Elm St"; email = "alice@example.com" },
      { id = 5; name = "Charlie Brown"; phone = "9876543214"; address = "654 Maple Dr"; email = "charlie@example.com" },
    ];

    for (cust in sampleCustomers.vals()) {
      customers.add(cust.id, cust);
    };
    nextCustomerId := 6;

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

  // Medicine CRUD - Admin only for modifications, users can read
  public shared ({ caller }) func addMedicine(med : Medicine) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add medicines");
    };
    let id = nextMedicineId;
    nextMedicineId += 1;
    let newMed = { med with id };
    medicines.add(id, newMed);
    id;
  };

  public shared ({ caller }) func updateMedicine(med : Medicine) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update medicines");
    };
    switch (medicines.get(med.id)) {
      case (null) { Runtime.trap("Medicine not found") };
      case (?_) { medicines.add(med.id, med) };
    };
  };

  public shared ({ caller }) func deleteMedicine(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete medicines");
    };
    switch (medicines.get(id)) {
      case (null) { Runtime.trap("Medicine not found") };
      case (?_) { medicines.remove(id) };
    };
  };

  public query ({ caller }) func getMedicine(id : Nat) : async Medicine {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view medicines");
    };
    switch (medicines.get(id)) {
      case (null) { Runtime.trap("Medicine not found") };
      case (?med) { med };
    };
  };

  public query ({ caller }) func getAllMedicines() : async [Medicine] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view medicines");
    };
    medicines.values().toArray();
  };

  // Customer CRUD - Users can manage
  public shared ({ caller }) func addCustomer(cust : Customer) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add customers");
    };
    let id = nextCustomerId;
    nextCustomerId += 1;
    let newCust = { cust with id };
    customers.add(id, newCust);
    id;
  };

  public shared ({ caller }) func updateCustomer(cust : Customer) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update customers");
    };
    switch (customers.get(cust.id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?_) { customers.add(cust.id, cust) };
    };
  };

  public shared ({ caller }) func deleteCustomer(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete customers");
    };
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?_) { customers.remove(id) };
    };
  };

  public query ({ caller }) func getCustomer(id : Nat) : async Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?cust) { cust };
    };
  };

  public query ({ caller }) func getAllCustomers() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    customers.values().toArray();
  };

  // Billing - Users can create and view bills
  public shared ({ caller }) func createBill(bill : Bill) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create bills");
    };
    let id = nextBillId;
    nextBillId += 1;
    let billNumber = nextBillNumber;
    nextBillNumber += 1;
    let newBill = { bill with id; billNumber };
    bills.add(id, newBill);
    id;
  };

  public query ({ caller }) func getBill(id : Nat) : async Bill {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bills");
    };
    switch (bills.get(id)) {
      case (null) { Runtime.trap("Bill not found") };
      case (?bill) { bill };
    };
  };

  public query ({ caller }) func getAllBills() : async [Bill] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bills");
    };
    bills.values().toArray();
  };

  // Dashboard Stats - Users can view
  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard stats");
    };
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

  // Distributor CRUD - Admin only for modifications, users can read
  public shared ({ caller }) func addDistributor(dist : Distributor) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add distributors");
    };
    let id = nextDistributorId;
    nextDistributorId += 1;
    let newDist = { dist with id };
    distributors.add(id, newDist);
    id;
  };

  public shared ({ caller }) func updateDistributor(dist : Distributor) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update distributors");
    };
    switch (distributors.get(dist.id)) {
      case (null) { Runtime.trap("Distributor not found") };
      case (?_) { distributors.add(dist.id, dist) };
    };
  };

  public shared ({ caller }) func deleteDistributor(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete distributors");
    };
    switch (distributors.get(id)) {
      case (null) { Runtime.trap("Distributor not found") };
      case (?_) { distributors.remove(id) };
    };
  };

  public query ({ caller }) func getDistributor(id : Nat) : async Distributor {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view distributors");
    };
    switch (distributors.get(id)) {
      case (null) { Runtime.trap("Distributor not found") };
      case (?dist) { dist };
    };
  };

  public query ({ caller }) func getAllDistributors() : async [Distributor] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view distributors");
    };
    distributors.values().toArray();
  };

  // Purchase CRUD - Users can add and view (stock updates are sensitive)
  public shared ({ caller }) func addPurchase(purchase : Purchase) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add purchases");
    };
    // Update medicine stock
    for (item in purchase.items.vals()) {
      let totalQty = item.qty + item.freeQty;
      switch (medicines.get(item.medicineId)) {
        case (null) { Runtime.trap("Medicine not found: " # item.medicineId.toText()) };
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

  public query ({ caller }) func getPurchase(id : Nat) : async Purchase {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view purchases");
    };
    switch (purchases.get(id)) {
      case (null) { Runtime.trap("Purchase not found") };
      case (?purchase) { purchase };
    };
  };

  public query ({ caller }) func getAllPurchases() : async [Purchase] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view purchases");
    };
    purchases.values().toArray();
  };

  public query ({ caller }) func getPurchasesByDistributor(distributorId : Nat) : async [Purchase] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view purchases");
    };
    let iter = purchases.values();
    let filtered = iter.filter(
      func(p) { p.distributorId == distributorId }
    );
    filtered.toArray();
  };

  public shared ({ caller }) func initialize() : async () {
    initializeSampleData();
  };

  system func preupgrade() {};
  system func postupgrade() {
    initializeSampleData();
  };
};
