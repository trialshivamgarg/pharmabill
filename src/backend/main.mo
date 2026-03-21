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
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
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

  // In-memory working Maps
  let medicines = Map.empty<Nat, Medicine>();
  let customers = Map.empty<Nat, Customer>();
  let bills = Map.empty<Nat, Bill>();
  let distributors = Map.empty<Nat, Distributor>();
  let purchases = Map.empty<Nat, Purchase>();

  // Stable storage — survives canister upgrades
  stable var stableMedicines : [(Nat, Medicine)] = [];
  stable var stableCustomers : [(Nat, Customer)] = [];
  stable var stableBills : [(Nat, Bill)] = [];
  stable var stableDistributors : [(Nat, Distributor)] = [];
  stable var stablePurchases : [(Nat, Purchase)] = [];

  stable var nextMedicineId : Nat = 1;
  stable var nextCustomerId : Nat = 1;
  stable var nextBillId : Nat = 1;
  stable var nextBillNumber : Nat = 1;
  stable var nextDistributorId : Nat = 1;
  stable var nextPurchaseId : Nat = 1;
  stable var initialized : Bool = false;

  private func initializeSampleData() : () {
    if (initialized) { return };
    initialized := true;

    let sampleCustomers : [Customer] = [
      { id = 1; name = "John Doe"; phone = "9876543210"; address = "123 Main St"; email = "john@example.com" },
      { id = 2; name = "Jane Smith"; phone = "9876543211"; address = "456 Oak Ave"; email = "jane@example.com" },
    ];

    for (cust in sampleCustomers.vals()) {
      customers.add(cust.id, cust);
    };
    nextCustomerId := 3;

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

  // Medicine CRUD - open to all users (no login required)
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

  // Customer CRUD - open to all users
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

  // Billing - open to all users
  public shared func createBill(bill : Bill) : async Nat {
    let id = nextBillId;
    nextBillId += 1;
    let billNumber = nextBillNumber;
    nextBillNumber += 1;
    let newBill = { bill with id; billNumber };
    bills.add(id, newBill);
    id;
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

  // Distributor CRUD - open to all users
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

  // Purchase CRUD - open to all users
  public shared func addPurchase(purchase : Purchase) : async Nat {
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
    let iter = purchases.values();
    let filtered = iter.filter(
      func(p) { p.distributorId == distributorId }
    );
    filtered.toArray();
  };

  public shared func initialize() : async () {
    initializeSampleData();
  };

  // Serialize all Maps to stable arrays before upgrade
  system func preupgrade() {
    stableMedicines := medicines.toArray();
    stableCustomers := customers.toArray();
    stableBills := bills.toArray();
    stableDistributors := distributors.toArray();
    stablePurchases := purchases.toArray();
  };

  // Restore Maps from stable arrays after upgrade
  system func postupgrade() {
    for ((k, v) in stableMedicines.vals()) { medicines.add(k, v) };
    for ((k, v) in stableCustomers.vals()) { customers.add(k, v) };
    for ((k, v) in stableBills.vals()) { bills.add(k, v) };
    for ((k, v) in stableDistributors.vals()) { distributors.add(k, v) };
    for ((k, v) in stablePurchases.vals()) { purchases.add(k, v) };
    // Clear stable arrays to free memory
    stableMedicines := [];
    stableCustomers := [];
    stableBills := [];
    stableDistributors := [];
    stablePurchases := [];
    // Only seed sample data on very first deploy
    if (not initialized) {
      initializeSampleData();
    };
  };
};
