import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, ClipboardList } from "lucide-react";
import { useState } from "react";
import { useGetDistributors, useGetPurchases } from "../hooks/useQueries";

function fmtDate(ns: bigint) {
  return new Date(Number(ns) / 1_000_000).toLocaleDateString("en-IN");
}

function fmtCurrency(n: bigint) {
  return `₹${(Number(n) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default function PurchaseHistory() {
  const { data: purchases, isLoading } = useGetPurchases();
  const { data: distributors } = useGetDistributors();
  const [filterDistributor, setFilterDistributor] = useState("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sorted = [...(purchases ?? [])].sort((a, b) =>
    Number(b.purchaseDate - a.purchaseDate),
  );

  const filtered =
    filterDistributor === "all"
      ? sorted
      : sorted.filter((p) => String(p.distributorId) === filterDistributor);

  return (
    <div className="space-y-5" data-ocid="purchase_history.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Purchase History
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            View and track all purchases from distributors
          </p>
        </div>
        <div className="w-52">
          <Select
            value={filterDistributor}
            onValueChange={setFilterDistributor}
          >
            <SelectTrigger data-ocid="purchase_history.distributor_filter.select">
              <SelectValue placeholder="All Distributors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Distributors</SelectItem>
              {(distributors ?? []).map((d) => (
                <SelectItem key={String(d.id)} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <Table data-ocid="purchase_history.table">
          <TableHeader>
            <TableRow className="bg-accent/60 hover:bg-accent/60">
              <TableHead className="w-8" />
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide">
                Date
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide">
                Invoice No
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide">
                Distributor
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-center">
                Items
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide">
                Subtotal
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide">
                GST
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-right">
                Grand Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4].map((k) => (
                <TableRow key={k}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground text-sm py-12"
                  data-ocid="purchase_history.empty_state"
                >
                  No purchases found. Create a purchase entry to see it here.
                </TableCell>
              </TableRow>
            ) : (
              filtered.flatMap((purchase, idx) => {
                const sid = String(purchase.id);
                const expanded = expandedIds.has(sid);
                const result: React.ReactNode[] = [
                  <TableRow
                    key={sid}
                    className="border-border cursor-pointer hover:bg-accent/30"
                    onClick={() => toggleExpand(sid)}
                    data-ocid={`purchase_history.item.${idx + 1}`}
                  >
                    <TableCell className="w-8 text-muted-foreground">
                      {expanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="text-[13px]">
                      {fmtDate(purchase.purchaseDate)}
                    </TableCell>
                    <TableCell className="font-medium text-[13px]">
                      {purchase.invoiceNumber || "—"}
                    </TableCell>
                    <TableCell className="text-[13px]">
                      {purchase.distributorName}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[11px]">
                        {purchase.items.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[13px]">
                      {fmtCurrency(purchase.subtotal)}
                    </TableCell>
                    <TableCell className="text-[13px]">
                      {fmtCurrency(purchase.totalGST)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-[13px] text-primary">
                      {fmtCurrency(purchase.grandTotal)}
                    </TableCell>
                  </TableRow>,
                ];
                if (expanded) {
                  result.push(
                    <TableRow key={`${sid}-detail`} className="bg-accent/10">
                      <TableCell colSpan={8} className="p-0">
                        <div className="px-8 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Invoice Date: {purchase.invoiceDate || "N/A"}{" "}
                            &nbsp;| Items Detail
                          </p>
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-border">
                                {[
                                  "Medicine",
                                  "Batch",
                                  "Expiry",
                                  "Qty",
                                  "Free",
                                  "Rate",
                                  "MRP",
                                  "GST%",
                                  "Amount",
                                ].map((h) => (
                                  <th
                                    key={h}
                                    className={`py-1.5 pr-4 font-semibold text-muted-foreground ${h === "Amount" ? "text-right pl-4" : h === "Qty" || h === "Free" || h === "GST%" ? "text-right" : "text-left"}`}
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {purchase.items.map((item) => (
                                <tr
                                  key={`${sid}-${item.medicineName}-${item.batch}`}
                                  className="border-b border-border/50"
                                >
                                  <td className="py-1.5 pr-4 font-medium">
                                    {item.medicineName}
                                  </td>
                                  <td className="py-1.5 pr-4 text-muted-foreground">
                                    {item.batch}
                                  </td>
                                  <td className="py-1.5 pr-4 text-muted-foreground">
                                    {item.expiry}
                                  </td>
                                  <td className="py-1.5 pr-4 text-right">
                                    {String(item.qty)}
                                  </td>
                                  <td className="py-1.5 pr-4 text-right text-muted-foreground">
                                    {String(item.freeQty)}
                                  </td>
                                  <td className="py-1.5 pr-4 text-right">
                                    ₹
                                    {(Number(item.purchaseRate) / 100).toFixed(
                                      2,
                                    )}
                                  </td>
                                  <td className="py-1.5 pr-4 text-right">
                                    ₹{(Number(item.mrp) / 100).toFixed(2)}
                                  </td>
                                  <td className="py-1.5 text-right">
                                    {String(item.gstPercent)}%
                                  </td>
                                  <td className="py-1.5 pl-4 text-right font-semibold">
                                    ₹{(Number(item.amount) / 100).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </TableCell>
                    </TableRow>,
                  );
                }
                return result;
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
