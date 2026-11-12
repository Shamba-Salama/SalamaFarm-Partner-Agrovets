import { useState } from "react";
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
import { normalizeKenyaMsisdn } from "@/lib/payments-api";

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
  const [mpesaCode, setMpesaCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const selected = products.find((p) => p.id === productId);
  const amount = selected ? selected.price : 0;
  const normalizedPhone = normalizeKenyaMsisdn(phone);
  const composeValid = Boolean(selected) && amount > 0 && Boolean(normalizedPhone);

  const reset = () => {
    setPhone("");
    setCustomer("");
    setProductId("");
    setMpesaCode("");
    setSubmitting(false);
    setPhoneError(null);
  };

  const onPhoneBlur = () => {
    if (!phone.trim()) {
      setPhoneError(null);
      return;
    }
    setPhoneError(
      normalizeKenyaMsisdn(phone)
        ? null
        : "Use 07XXXXXXXX or +2547XXXXXXXX (10 digits after 0, or 12 with 254).",
    );
  };

  const onSave = async () => {
    if (!composeValid || !productId || submitting) return;
    setSubmitting(true);
    try {
      const { order } = await createCounterOrder({
        phone,
        productId,
        customer,
        mpesaCode,
      });
      toast.success(
        order.paidAt ? "Counter sale recorded as paid" : "Counter sale recorded",
        {
          description: order.paidAt
            ? `Order #${order.id} · ${order.mpesaCode}`
            : `Order #${order.id} is awaiting an M-Pesa code.`,
        },
      );
      onOpenChange(false);
      reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? formatApiError(err) : "Could not record the sale.");
    } finally {
      setSubmitting(false);
    }
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
          <DialogTitle>Counter sale</DialogTitle>
          <DialogDescription>
            Record a counter order. Add the M-Pesa confirmation code if the farmer has already paid.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Farmer phone number</Label>
            <Input
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError(null);
              }}
              onBlur={onPhoneBlur}
              placeholder="0712345678"
              inputMode="tel"
            />
            {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
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
                {products
                  .filter((p) => p.active)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {formatKES(p.price)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>M-Pesa code (optional)</Label>
            <Input
              value={mpesaCode}
              onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
              placeholder="e.g. SGJ9PL44BV"
              className="font-mono uppercase"
              maxLength={20}
            />
          </div>

          <div className="rounded-xl bg-muted p-3 text-sm">
            <span className="text-muted-foreground">Amount</span>
            <p className="text-xl font-bold tabular-nums">{formatKES(amount || 0)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button className="w-full" disabled={!composeValid || submitting} onClick={() => void onSave()}>
            {submitting ? "Saving…" : "Save sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
