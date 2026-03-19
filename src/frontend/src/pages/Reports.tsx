import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, IndianRupee, Package, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import {
  useGetBills,
  useGetCustomers,
  useGetMedicines,
} from "../hooks/useQueries";

function fmtCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
function billNo(n: bigint) {
  return `INV-${String(Number(n)).padStart(4, "0")}`;
}
function fmtDate(ns: bigint) {
  return new Date(Number(ns) / 1_000_000).toLocaleDateString("en-IN");
}

export default function Reports() {
  const { data: bills = [], isLoading: billsLoading } = useGetBills();
  const { data: medicines = [], isLoading: medsLoading } = useGetMedicines();
  const { data: customers = [] } = useGetCustomers();

  const custMap = useMemo(
    () => Object.fromEntries(customers.map((c) => [String(c.id), c])),
    [customers],
  );

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthBills = useMemo(
    () =>
      bills.filter((b) => {
        const d = new Date(Number(b.billDate) / 1_000_000);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }),
    [bills, currentMonth, currentYear],
  );

  const thisMonthSales = thisMonthBills.reduce(
    (acc, b) => acc + Number(b.grandTotal),
    0,
  );
  const totalSalesAll = bills.reduce((acc, b) => acc + Number(b.grandTotal), 0);

  const medSalesMap = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> =
      {};
    for (const b of bills) {
      for (const item of b.items) {
        const key = String(item.medicineId);
        const med = medicines.find((m) => String(m.id) === key);
        if (!map[key])
          map[key] = { name: med?.name ?? "Unknown", qty: 0, revenue: 0 };
        map[key].qty += Number(item.quantity);
        map[key].revenue += Number(item.quantity) * Number(item.unitPrice);
      }
    }
    return Object.entries(map)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 10);
  }, [bills, medicines]);

  const custSpendMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of bills) {
      const key = String(b.customerId);
      map[key] = (map[key] || 0) + Number(b.grandTotal);
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [bills]);

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of bills) {
      map[b.paymentMode] = (map[b.paymentMode] || 0) + Number(b.grandTotal);
    }
    return map;
  }, [bills]);

  const kpis = [
    {
      label: "This Month's Sales",
      value: fmtCurrency(thisMonthSales),
      icon: IndianRupee,
      color: "text-primary",
    },
    {
      label: "This Month's Bills",
      value: String(thisMonthBills.length),
      icon: FileText,
      color: "text-blue-600",
    },
    {
      label: "Total Sales (All Time)",
      value: fmtCurrency(totalSalesAll),
      icon: TrendingUp,
      color: "text-emerald-600",
    },
    {
      label: "Total Bills (All Time)",
      value: String(bills.length),
      icon: Package,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6" data-ocid="reports.page">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Business overview and analytics
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {kpi.label}
                  </p>
                  {billsLoading ? (
                    <Skeleton className="h-7 w-20 mt-2" />
                  ) : (
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  )}
                </div>
                <div className={`p-2 rounded-lg bg-accent ${kpi.color}`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Selling Medicines */}
        <Card className="shadow-card" data-ocid="reports.top_medicines.card">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Top Selling Medicines
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {medsLoading || billsLoading ? (
              <div className="p-4 space-y-2">
                {["a", "b", "c", "d", "e"].map((k) => (
                  <Skeleton key={k} className="h-9 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold text-muted-foreground pl-5">
                      #
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground">
                      Medicine
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground">
                      Units Sold
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground text-right pr-5">
                      Revenue
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medSalesMap.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground text-xs py-8"
                        data-ocid="reports.top_medicines.empty_state"
                      >
                        No sales data yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    medSalesMap.map(([medId, { name, qty, revenue }], idx) => (
                      <TableRow
                        key={medId}
                        className="border-border text-[13px]"
                        data-ocid={`reports.medicine.item.${idx + 1}`}
                      >
                        <TableCell className="pl-5 text-muted-foreground font-medium w-8">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {qty}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-5 font-semibold">
                          {fmtCurrency(revenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="shadow-card" data-ocid="reports.top_customers.card">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Top Customers by Spend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {billsLoading ? (
              <div className="p-4 space-y-2">
                {["a", "b", "c", "d"].map((k) => (
                  <Skeleton key={k} className="h-9 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold text-muted-foreground pl-5">
                      #
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground">
                      Customer
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground text-right pr-5">
                      Total Spend
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {custSpendMap.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground text-xs py-8"
                        data-ocid="reports.top_customers.empty_state"
                      >
                        No data yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    custSpendMap.map(([custId, spend], idx) => (
                      <TableRow
                        key={custId}
                        className="border-border text-[13px]"
                        data-ocid={`reports.customer.item.${idx + 1}`}
                      >
                        <TableCell className="pl-5 text-muted-foreground font-medium w-8">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {custMap[custId]?.name ?? "Unknown"}
                        </TableCell>
                        <TableCell className="text-right pr-5 font-semibold">
                          {fmtCurrency(spend)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payment Mode Breakdown */}
        <Card
          className="shadow-card"
          data-ocid="reports.payment_breakdown.card"
        >
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Payment Mode Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold text-muted-foreground pl-5">
                    Mode
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right pr-5">
                    Revenue
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(paymentBreakdown).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground text-xs py-8"
                      data-ocid="reports.payment_breakdown.empty_state"
                    >
                      No data
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(paymentBreakdown).map(
                    ([mode, amount], idx) => (
                      <TableRow
                        key={mode}
                        className="border-border text-[13px]"
                        data-ocid={`reports.payment.item.${idx + 1}`}
                      >
                        <TableCell className="pl-5 capitalize font-medium">
                          {mode}
                        </TableCell>
                        <TableCell className="text-right pr-5 font-semibold">
                          {fmtCurrency(amount)}
                        </TableCell>
                      </TableRow>
                    ),
                  )
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Bills */}
        <Card className="shadow-card" data-ocid="reports.recent_bills.card">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold text-muted-foreground pl-5">
                    Bill
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground">
                    Customer
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground text-right pr-5">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground text-xs py-8"
                      data-ocid="reports.recent_bills.empty_state"
                    >
                      No transactions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  [...bills]
                    .sort((a, b) => Number(b.billDate - a.billDate))
                    .slice(0, 5)
                    .map((bill, idx) => (
                      <TableRow
                        key={String(bill.id)}
                        className="border-border text-[13px]"
                        data-ocid={`reports.transaction.item.${idx + 1}`}
                      >
                        <TableCell className="pl-5 font-medium">
                          {billNo(bill.billNumber)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {custMap[String(bill.customerId)]?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {fmtDate(bill.billDate)}
                        </TableCell>
                        <TableCell className="text-right pr-5 font-semibold">
                          {fmtCurrency(Number(bill.grandTotal))}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <footer className="text-center text-xs text-muted-foreground pt-4 pb-2">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
