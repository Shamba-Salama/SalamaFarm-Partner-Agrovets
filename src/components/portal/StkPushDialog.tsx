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
import { formatKES, usePortal, type CustomerOrder } from "@/lib/portal-store";
import { ApiError } from "@/lib/api-client";
import { formatApiError } from "@/lib/format-api-error";
import { normalizeKenyaMsisdn } from "@/lib/payments-api";

type Step = "compose" | "charge";

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

export function StkPushDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { products, profile, createCounterOrder, chargeCounterOrder, createStoreSubaccount } =
    usePortal();
  const [step, setStep] = useState<Step>("compose");
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState("");
  const [productId, setProductId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [creatingSubaccount, setCreatingSubaccount] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<CustomerOrder | null>(null);
  const [awaitingText, setAwaitingText] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const selected = products.find((p) => p.id === productId);
  const amount = selected ? selected.price : 0;
  const normalizedPhone = normalizeKenyaMsisdn(phone);
  const hasSubaccount = Boolean(profile.paystackSubaccountCode?.trim());
  const composeValid = Boolean(selected) && amount > 0 && Boolean(normalizedPhone);

  const reset = () => {
    setStep("compose");
    setPhone("");
    setCustomer("");
    setProductId("");
    setSubmitting(false);
    setCreatingSubaccount(false);
    setCreatedOrder(null);
    setAwaitingText(null);
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
            {step === "compose"
              ? "Create a counter order, then send a Paystack M-Pesa prompt to the farmer."
              : "Confirm the phone and send the STK charge. Payment is confirmed by webhook — this only starts the prompt."}
          </DialogDescription>
        </DialogHeader>

        {step === "compose" ? (
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
        ) : (
          <div className="space-y-4">
            {createdOrder && (
              <div className="rounded-xl bg-muted p-3 text-sm">
                <p className="font-medium">Order #{createdOrder.id}</p>
                <p className="text-muted-foreground">
                  {createdOrder.product} · {formatKES(createdOrder.amount)}
                </p>
              </div>
            )}

            {!hasSubaccount && (
              <div className="space-y-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
                <p className="font-medium">Paystack subaccount required</p>
                <p className="text-muted-foreground">
                  This store has no Paystack subaccount yet. Create one before charging — otherwise
                  the request will fail.
                </p>
                <Button
                  type="button"
                  size="sm"
                  disabled={creatingSubaccount}
                  onClick={() => {
                    void (async () => {
                      setCreatingSubaccount(true);
                      try {
                        const res = await createStoreSubaccount();
                        toast.success(
                          res.created
                            ? "Paystack subaccount created"
                            : "Using existing Paystack subaccount",
                          { description: res.subaccountCode },
                        );
                      } catch (err) {
                        toast.error(
                          err instanceof ApiError
                            ? formatApiError(err)
                            : "Could not create subaccount.",
                        );
                      } finally {
                        setCreatingSubaccount(false);
                      }
                    })();
                  }}
                >
                  {creatingSubaccount ? "Creating…" : "Create Paystack subaccount"}
                </Button>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Charge phone</Label>
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

            {awaitingText && (
              <div className="rounded-xl border border-info/30 bg-info/10 p-3 text-sm">
                <p className="font-medium">Awaiting confirmation</p>
                <p className="mt-1 text-muted-foreground">{awaitingText}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  The order is not marked paid until Paystack confirms. Use “Refresh payment status”
                  on the orders page after the farmer completes the prompt.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {step === "compose" ? (
            <Button
              className="w-full"
              disabled={!composeValid || submitting}
              onClick={() => {
                void (async () => {
                  if (!selected) return;
                  const e164 = normalizeKenyaMsisdn(phone);
                  if (!e164) {
                    setPhoneError(
                      "Use 07XXXXXXXX or +2547XXXXXXXX (10 digits after 0, or 12 with 254).",
                    );
                    return;
                  }
                  setSubmitting(true);
                  try {
                    const { order, channel } = await createCounterOrder({
                      phone: e164,
                      productId: selected.id,
                      customer,
                    });
                    setCreatedOrder(order);
                    setStep("charge");
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
          ) : (
            <>
              <Button
                className="w-full"
                disabled={
                  !createdOrder ||
                  !hasSubaccount ||
                  !normalizedPhone ||
                  submitting ||
                  Boolean(awaitingText)
                }
                onClick={() => {
                  void (async () => {
                    if (!createdOrder) return;
                    const e164 = normalizeKenyaMsisdn(phone);
                    if (!e164) {
                      setPhoneError(
                        "Use 07XXXXXXXX or +2547XXXXXXXX (10 digits after 0, or 12 with 254).",
                      );
                      return;
                    }
                    setSubmitting(true);
                    try {
                      const res = await chargeCounterOrder({
                        orderId: createdOrder.id,
                        phone: e164,
                      });
                      const text =
                        res.display_text?.trim() ||
                        `Charge started (${res.status ?? "pending"}). Reference ${res.reference}.`;
                      setAwaitingText(text);
                      toast.message("STK prompt sent — awaiting confirmation", {
                        description: text,
                      });
                    } catch (err) {
                      chargeFailureToast(err);
                    } finally {
                      setSubmitting(false);
                    }
                  })();
                }}
              >
                <Smartphone className="mr-1.5 h-4 w-4" />{" "}
                {submitting
                  ? "Sending STK…"
                  : awaitingText
                    ? "Awaiting confirmation"
                    : "Send STK charge"}
              </Button>
              {awaitingText && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false);
                    reset();
                  }}
                >
                  Done
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
