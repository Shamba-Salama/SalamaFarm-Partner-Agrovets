import { useState } from "react";
import { Smartphone } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatKES, usePortal } from "@/lib/portal-store";

export function StkPushDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { products, stkPush } = usePortal();
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState("");
  const [productId, setProductId] = useState<string>("custom");
  const [custom, setCustom] = useState("");

  const selected = products.find((p) => p.id === productId);
  const amount = selected ? selected.price : Number(custom || 0);
  const valid = /^(0|254)\d{8,11}$/.test(phone.replace(/\s/g, "")) && amount > 0;

  const reset = () => {
    setPhone("");
    setCustomer("");
    setProductId("custom");
    setCustom("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Counter M-Pesa STK Push</DialogTitle>
          <DialogDescription>
            Send a payment prompt straight to the farmer&apos;s phone at the counter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Farmer phone number</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712345678"
              inputMode="tel"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Farmer name (optional)</Label>
            <Input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="e.g. Wanjiku Mwangi"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Product from inventory</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom amount…</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {formatKES(p.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!selected && (
            <div className="space-y-1.5">
              <Label>Custom amount (KES)</Label>
              <Input
                type="number"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="1500"
              />
            </div>
          )}

          <div className="rounded-xl bg-muted p-3 text-sm">
            <span className="text-muted-foreground">Amount to request</span>
            <p className="text-xl font-bold tabular-nums">{formatKES(amount || 0)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            disabled={!valid}
            onClick={() => {
              const { channel, code } = stkPush({
                phone,
                amount,
                product: selected?.name ?? "Counter sale",
                customer,
              });
              onOpenChange(false);
              reset();
              toast.success(`STK push sent · ${code}`, {
                description:
                  channel === "offline-sms"
                    ? "Number not on the app — tagged Offline/SMS. Follow-ups route through the Bulk SMS Gateway."
                    : "Farmer has an active SalamaFarm account — follow-ups deliver in-app.",
              });
            }}
          >
            <Smartphone className="mr-1.5 h-4 w-4" /> Trigger M-Pesa STK Push
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
