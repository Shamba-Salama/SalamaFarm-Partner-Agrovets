import { api } from "@/lib/api-client";
import type { ApiStore } from "@/lib/store-api";

export type ChargeResponse = {
  transaction_id: number;
  reference: string;
  status: string | null;
  display_text: string | null;
  amount: string;
  amount_cents: number;
  phone: string;
  subaccount_code: string;
  paystack: Record<string, unknown>;
};

export type CreateSubaccountResponse = {
  created: boolean;
  subaccount_code: string;
  store: ApiStore;
  detail?: string;
  paystack?: Record<string, unknown>;
};

/**
 * Match backend normalize_kenya_msisdn for client validation.
 * Returns E.164 (+254…) or null if invalid.
 */
export function normalizeKenyaMsisdn(phone: string): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    return `+254${digits.slice(1)}`;
  }
  if (digits.startsWith("254") && digits.length === 12) {
    return `+${digits}`;
  }
  return null;
}

export async function chargeOrder(input: {
  orderId: string;
  phone: string;
}): Promise<ChargeResponse> {
  return api.post<ChargeResponse>("/payments/charge/", {
    order_id: Number(input.orderId),
    phone: input.phone,
  });
}

/** POST /store/create-subaccount/ with empty body — backend uses MPTILL + store till. */
export async function createSubaccount(): Promise<CreateSubaccountResponse> {
  return api.post<CreateSubaccountResponse>("/store/create-subaccount/", {});
}
