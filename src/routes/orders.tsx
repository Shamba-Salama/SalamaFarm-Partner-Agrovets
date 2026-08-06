import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, FileText, RefreshCw, Search, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { PortalLayout } from "@/components/portal/PortalLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChannelBadge } from "@/components/portal/ChatDrawer";
import { formatKES, usePortal, VAT_RATE, type CustomerOrder } from "@/lib/portal-store";
import { ApiError } from "@/lib/api-client";
import { formatApiError } from "@/lib/format-api-error";
import { normalizeKenyaMsisdn } from "@/lib/payments-api";
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

function formatPaidAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function chargeFailureToast(err: unknown): void {
  if (!(err instanceof ApiError)) {
    toast.error("Could not initiate charge.");
    return;
  }
  const detail = formatApiError(err);
  if (err.status === 400) {
    toast.error("Charge could not start", {
      description: detail || "Check the phone number, subaccount, and order amount.",
    });
    return;
  }
  if (err.status === 404) {
    toast.error("Order not found", {
      description: detail || "This order no longer exists for your store.",
    });
    return;
  }
  if (err.status === 502) {
    toast.error("Paystack unreachable", {
      description:
        detail ||
        "Paystack rejected or could not be reached. The charge was not initiated — try again later.",
    });
    return;
  }
  toast.error(detail || "Could not initiate charge.");
}

function OrdersPage() {
  const {
    orders,
    ordersLoading,
    profile,
    setPickup,
    clearNewOrders,
    refreshOrders,
    chargeCounterOrder,
  } = usePortal();
  const [verify, setVerify] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [chargingId, setChargingId] = useState<string | null>(null);
  const [refreshingPayments, setRefreshingPayments] = useState(false);

  const match = verify.trim()
    ? orders.find((o) => o.mpesaCode.toLowerCase() === verify.trim().toLowerCase())
    : null;

  const rows = orders.filter(
    (o) =>
      o.customer.toLowerCase().includes(query.toLowerCase()) ||
      o.mpesaCode.toLowerCase().includes(query.toLowerCase()) ||
      o.product.toLowerCase().includes(query.toLowerCase()),
  );

  const filtersActive = query.trim().length > 0;

  const onPickupChange = async (id: string, pickup: CustomerOrder["pickup"]) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await setPickup(id, pickup);
      toast.success(`Pickup set to ${pickup}`);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? formatApiError(err) : "Could not update pickup status.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const onMarkCollected = async (id: string) => {
    await onPickupChange(id, "Collected");
  };

  const onRefreshPayments = async () => {
    setRefreshingPayments(true);
    try {
      await refreshOrders();
      toast.success("Payment status refreshed");
    } catch (err) {
      toast.error(err instanceof ApiError ? formatApiError(err) : "Could not refresh orders.");
    } finally {
      setRefreshingPayments(false);
    }
  };

  const onCharge = async (o: CustomerOrder) => {
    if (o.paidAt || chargingId) return;
    const e164 = normalizeKenyaMsisdn(o.phone);
    if (!e164) {
      toast.error("Invalid phone on this order", {
        description: "Use 07XXXXXXXX or +2547XXXXXXXX before charging.",
      });
      return;
    }
    if (!profile.paystackSubaccountCode?.trim()) {
      toast.error("Paystack subaccount required", {
        description: "Create a subaccount from the STK Push dialog before charging.",
      });
      return;
    }
    setChargingId(o.id);
    try {
      const res = await chargeCounterOrder({ orderId: o.id, phone: e164 });
      const text =
        res.display_text?.trim() ||
        `Charge started (${res.status ?? "pending"}). Reference ${res.reference}.`;
      toast.message("STK prompt sent — awaiting confirmation", { description: text });
    } catch (err) {
      chargeFailureToast(err);
    } finally {
      setChargingId(null);
    }
  };

  return (
    <PortalLayout
      title="Sales, Orders & M-Pesa Log"
      subtitle={`${orders.length} recorded transactions`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={refreshingPayments}
            onClick={() => void onRefreshPayments()}
          >
            <RefreshCw className={cn("mr-1.5 h-4 w-4", refreshingPayments && "animate-spin")} />
            Refresh payment status
          </Button>
          <Button size="sm" variant="ghost" onClick={clearNewOrders}>
            Mark orders seen
          </Button>
        </div>
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
                        disabled={busyId === match.id}
                        onClick={() => void onMarkCollected(match.id)}
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
                  <TableHead>Payment</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading && orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      Loading orders…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 && orders.length === 0 && !filtersActive ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      No orders yet
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      No transactions match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.mpesaCode || "—"}</TableCell>
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
                      <TableCell className="min-w-[140px]">
                        {o.paidAt ? (
                          <div>
                            <Badge variant="secondary">Paid</Badge>
                            <span className="mt-1 block text-[11px] text-muted-foreground">
                              {formatPaidAt(o.paidAt)}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline">Awaiting payment</Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {o.date} {o.time}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={o.pickup}
                          disabled={busyId === o.id}
                          onValueChange={(v) =>
                            void onPickupChange(o.id, v as CustomerOrder["pickup"])
                          }
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(["Unmatched", "Awaiting Pickup", "Collected"] as const).map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {o.paidAt === null && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={chargingId !== null}
                              onClick={() => void onCharge(o)}
                            >
                              <Smartphone className="mr-1.5 h-4 w-4" />
                              {chargingId === o.id ? "Sending…" : "Charge"}
                            </Button>
                          )}
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
