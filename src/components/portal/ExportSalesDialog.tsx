import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatKES, usePortal, VAT_RATE } from "@/lib/portal-store";
import { downloadFile, ordersToCsv } from "@/lib/export";
import { cn } from "@/lib/utils";

type Preset = "week" | "month" | "custom";

const TODAY = "2026-07-30";

function shift(days: number) {
  const d = new Date(TODAY + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function ExportSalesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { orders, profile } = usePortal();
  const [preset, setPreset] = useState<Preset>("month");
  const [from, setFrom] = useState(shift(30));
  const [to, setTo] = useState(TODAY);

  const range = useMemo(() => {
    if (preset === "week") return { from: shift(7), to: TODAY };
    if (preset === "month") return { from: shift(30), to: TODAY };
    return { from, to };
  }, [preset, from, to]);

  const rows = orders.filter((o) => o.date >= range.from && o.date <= range.to);
  const gross = rows.reduce((s, o) => s + o.amount, 0);
  const vat = Math.round(gross - gross / (1 + VAT_RATE));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export sales report for tax / accounting</DialogTitle>
          <DialogDescription>
            Produces an eTIMS-friendly CSV you can upload straight into your accounting software.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["week", "This week"],
              ["month", "This month"],
              ["custom", "Custom range"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setPreset(k)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                preset === k
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-3 text-center text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Orders</p>
            <p className="font-bold tabular-nums">{rows.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gross</p>
            <p className="font-bold tabular-nums">{formatKES(gross)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">VAT 16%</p>
            <p className="font-bold tabular-nums">{formatKES(vat)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            disabled={!rows.length}
            onClick={() => {
              downloadFile(
                `salamafarm-sales-${range.from}-to-${range.to}.csv`,
                ordersToCsv(rows, profile),
                "text/csv",
              );
              onOpenChange(false);
              toast.success(`Exported ${rows.length} sales records`);
            }}
          >
            <FileDown className="mr-1.5 h-4 w-4" /> Download report ({rows.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
