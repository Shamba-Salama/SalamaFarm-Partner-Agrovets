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
import { ApiError } from "@/lib/api-client";
import { formatApiError } from "@/lib/format-api-error";

export function StkPushDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { products, createCounterOrder } = usePortal();
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState("");
  const [productId, setProductId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const selected = products.find((p) => p.id === productId);
  const amount = selected ? selected.price : 0;
  const valid =
    /^(0|254)\d{8,11}$/.test(phone.replace(/\s/g, "")) && Boolean(selected) && amount > 0;

  const reset = () => {
    setPhone("");
    setCustomer("");
    setProductId("");
    setSubmitting(false);
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
            Create a counter order against a catalog product. Payment charging is Pass 4B — this
            records the unpaid order only.
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
            <Select value={productId || undefined} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom" disabled>
                  Custom amount… (unavailable — needs a catalog product)
                </SelectItem>
                {products
                  .filter((p) => p.active)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {formatKES(p.price)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Custom amounts have no backend representation (`items` require a real product_id).
              Pick a product from inventory.
            </p>
          </div>

          <div className="rounded-xl bg-muted p-3 text-sm">
            <span className="text-muted-foreground">Amount to request</span>
            <p className="text-xl font-bold tabular-nums">{formatKES(amount || 0)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            disabled={!valid || submitting}
            onClick={() => {
              void (async () => {
                if (!selected) return;
                setSubmitting(true);
                try {
                  const { order, channel } = await createCounterOrder({
                    phone,
                    productId: selected.id,
                    customer,
                  });
                  onOpenChange(false);
                  reset();
                  toast.success(`Order #${order.id} created`, {
                    description:
                      channel === "offline-sms"
                        ? "Number not seen before — tagged Offline/SMS for follow-ups."
                        : "Phone already known — follow-ups tagged in-app.",
                  });
                } catch (err) {
                  toast.error(
                    err instanceof ApiError ? formatApiError(err) : "Could not create order.",
                  );
                } finally {
                  setSubmitting(false);
                }
              })();
            }}
          >
            <Smartphone className="mr-1.5 h-4 w-4" />{" "}
            {submitting ? "Creating order…" : "Create counter order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
