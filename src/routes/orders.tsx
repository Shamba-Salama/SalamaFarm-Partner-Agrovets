import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, FileText, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PortalLayout } from "@/components/portal/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChannelBadge } from "@/components/portal/ChatDrawer";
import { formatKES, usePortal, VAT_RATE } from "@/lib/portal-store";
import { printReceipt } from "@/lib/export";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Sales, Orders & M-Pesa Log | SalamaFarm Partner Agrovets" },
      {
        name: "description",
        content:
          "Match M-Pesa confirmation codes against pickups, download printable VAT receipts and export sales for tax filing.",
      },
      { property: "og:title", content: "Sales, Orders & M-Pesa Log | SalamaFarm" },
      {
        property: "og:description",
        content: "Counter reconciliation, PDF receipts and accounting exports for your agrovet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { orders, profile, setPickup, clearNewOrders } = usePortal();
  const [verify, setVerify] = useState("");
  const [query, setQuery] = useState("");

  const match = verify.trim()
    ? orders.find((o) => o.mpesaCode.toLowerCase() === verify.trim().toLowerCase())
    : null;

  const rows = orders.filter(
    (o) =>
      o.customer.toLowerCase().includes(query.toLowerCase()) ||
      o.mpesaCode.toLowerCase().includes(query.toLowerCase()) ||
      o.product.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <PortalLayout
      title="Sales, Orders & M-Pesa Log"
      subtitle={`${orders.length} recorded transactions`}
      actions={
        <Button size="sm" variant="ghost" onClick={clearNewOrders}>
          Mark orders seen
        </Button>
      }
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Verify M-Pesa confirmation code before releasing goods
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={verify}
                  onChange={(e) => setVerify(e.target.value.toUpperCase())}
                  placeholder="e.g. SGJ9PL44BV"
                  className="pl-9 font-mono uppercase"
                />
              </div>
            </div>
            {verify.trim() && (
              <div
                className={cn(
                  "min-w-[240px] flex-1 rounded-xl p-3 text-sm",
                  match ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
                )}
              >
                {match ? (
                  <>
                    <p className="font-semibold">✅ Valid payment found</p>
                    <p className="text-foreground">
                      {match.customer} · {formatKES(match.amount)} · {match.product}
                    </p>
                    {match.pickup !== "Collected" && (
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setPickup(match.id, "Collected");
                          toast.success("Marked as collected at the counter");
                        }}
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark goods released
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="font-semibold">
                    ⚠️ No payment matches this code — do not release goods.
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, customer or item…"
              className="pl-9"
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>M-Pesa code</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Total (incl. VAT)</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.mpesaCode}</TableCell>
                    <TableCell className="min-w-[150px]">
                      <span className="block font-medium">{o.customer}</span>
                      <span className="block text-xs text-muted-foreground">+{o.phone}</span>
                    </TableCell>
                    <TableCell className="min-w-[170px]">
                      {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                    </TableCell>
                    <TableCell>
                      <ChannelBadge channel={o.channel} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatKES(o.amount)}
                      <span className="block text-[11px] text-muted-foreground">
                        VAT {formatKES(Math.round(o.amount - o.amount / (1 + VAT_RATE)))}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {o.date} {o.time}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "border-transparent",
                          o.pickup === "Collected" && "bg-success text-success-foreground",
                          o.pickup === "Awaiting Pickup" && "bg-warning text-warning-foreground",
                          o.pickup === "Unmatched" && "bg-destructive text-destructive-foreground",
                        )}
                      >
                        {o.pickup}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const ok = printReceipt(o, profile);
                          if (!ok) toast.error("Allow pop-ups to download the receipt");
                        }}
                      >
                        <FileText className="mr-1.5 h-4 w-4" /> Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No transactions match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
