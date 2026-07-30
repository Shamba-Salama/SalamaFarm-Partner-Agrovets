import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Search, ShieldAlert } from "lucide-react";
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
import { formatKES, usePortal } from "@/lib/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mpesa")({
  head: () => ({
    meta: [
      { title: "M-Pesa Reconciliation Log | SalamaFarm Partner Agrovets" },
      {
        name: "description",
        content:
          "Match customer M-Pesa confirmation codes against counter pickups to prevent collection fraud at your agrovet.",
      },
      { property: "og:title", content: "M-Pesa Reconciliation Log | SalamaFarm Partner Agrovets" },
      {
        property: "og:description",
        content: "Verify confirmation codes before releasing goods at the counter.",
      },
    ],
  }),
  component: MpesaPage,
});

function MpesaPage() {
  const { transactions, setPickup } = usePortal();
  const [code, setCode] = useState("");

  const match = code.trim()
    ? transactions.find((t) => t.code.toLowerCase() === code.trim().toLowerCase())
    : null;

  return (
    <PortalLayout
      title="M-Pesa Transaction Log"
      subtitle="Verify confirmation codes before handing over goods"
    >
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="min-w-0">
              <p className="mb-1.5 text-sm font-medium">Counter verification</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter customer M-Pesa code e.g. SGJ9PL44BV"
                  className="pl-9 font-mono"
                />
              </div>
            </div>
            <Button
              disabled={!match || match.pickup === "Collected"}
              onClick={() => {
                if (!match) return;
                setPickup(match.id, "Collected");
                toast.success(`${match.code} marked as collected`);
              }}
            >
              Mark as collected
            </Button>
          </div>

          {code.trim() &&
            (match ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="font-medium">Valid payment</span>
                <span>
                  {match.payer} · {formatKES(match.amount)} · {match.item} · {match.pickup}
                </span>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span className="font-medium">No payment found for this code — do not release goods.</span>
              </div>
            ))}

          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.code}</TableCell>
                    <TableCell className="min-w-[150px]">
                      <span className="block font-medium">{t.payer}</span>
                      <span className="block text-xs text-muted-foreground">+{t.phone}</span>
                    </TableCell>
                    <TableCell className="min-w-[160px]">{t.item}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatKES(t.amount)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{t.time}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "border-transparent",
                          t.pickup === "Collected" && "bg-success text-success-foreground",
                          t.pickup === "Awaiting Pickup" && "bg-warning text-warning-foreground",
                          t.pickup === "Unmatched" && "bg-destructive text-destructive-foreground",
                        )}
                      >
                        {t.pickup}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={t.pickup === "Collected"}
                        onClick={() => setPickup(t.id, "Collected")}
                      >
                        Confirm pickup
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PortalLayout>
  );
}
