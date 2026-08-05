import { api } from "@/lib/api-client";

export type ApiCustomer = {
  id: number;
  name: string;
  phone: string;
  created_at: string;
  updated_at: string;
};

export type ApiOrderItem = {
  id: number;
  product_id: number;
  name: string;
  qty: number;
  /** DRF DecimalField serializes as a string. */
  price: string;
};

export type ApiOrderCustomer = {
  id: number;
  name: string;
  phone: string;
};

export type ApiOrder = {
  id: number;
  customer: ApiOrderCustomer;
  phone: string;
  product: string;
  items: ApiOrderItem[];
  date: string;
  time: string;
  status: string;
  mpesa_code: string;
  channel: string;
  order_type: string;
  pickup: string;
  /** DRF DecimalField serializes as a string. */
  amount: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PortalCustomer = {
  id: string;
  name: string;
  phone: string;
};

/** UI flat order shape — matches portal-store CustomerOrder (+ customerId). */
export type MappedOrder = {
  id: string;
  customer: string;
  customerId: string;
  phone: string;
  product: string;
  items: { name: string; qty: number; price: number }[];
  date: string;
  time: string;
  mpesaCode: string;
  amount: number;
  status: string;
  channel: string;
  orderType: string;
  pickup: string;
};

/** Integer cents helpers — avoid float money strings that fail DRF decimal_places=2. */
export const cents = (n: number) => Math.round(n * 100);
export const money = (centsValue: number) => (centsValue / 100).toFixed(2);

export function apiOrderToOrder(o: ApiOrder): MappedOrder {
  return {
    id: String(o.id),
    customer: o.customer?.name ?? "",
    customerId: String(o.customer?.id ?? ""),
    phone: o.phone ?? o.customer?.phone ?? "",
    product: o.product ?? "",
    items: (o.items ?? []).map((i) => ({
      name: i.name,
      qty: Number(i.qty),
      price: Number(i.price),
    })),
    date: o.date,
    time: o.time,
    mpesaCode: o.mpesa_code ?? "",
    amount: Number(o.amount),
    status: o.status,
    channel: o.channel,
    orderType: o.order_type,
    pickup: o.pickup,
  };
}

export function apiCustomerToCustomer(c: ApiCustomer): PortalCustomer {
  return {
    id: String(c.id),
    name: c.name ?? "",
    phone: c.phone ?? "",
  };
}

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

export type CounterOrderCreateInput = {
  productId: number;
  productPrice: number;
  qty?: number;
  phone: string;
  customerName?: string;
  channel: "in-app" | "offline-sms";
};

/** Build create body with amount == sum of item cents as fixed 2-decimal strings. */
export function buildCounterOrderBody(input: CounterOrderCreateInput) {
  const qty = input.qty ?? 1;
  const unitCents = cents(input.productPrice);
  const lineCents = unitCents * qty;
  return {
    customer: {
      name: (input.customerName?.trim() || "Counter Customer") as string,
      phone: input.phone,
    },
    items: [
      {
        product_id: input.productId,
        qty,
        price: money(unitCents),
      },
    ],
    amount: money(lineCents),
    status: "Pending",
    mpesa_code: "",
    channel: input.channel,
    order_type: "Counter Pickup",
    pickup: "Unmatched",
  };
}

export async function fetchCustomers(): Promise<ApiCustomer[]> {
  const data = await api.get<unknown>("/customers/");
  return unwrapList<ApiCustomer>(data);
}

export async function upsertCustomer(body: { name: string; phone: string }): Promise<ApiCustomer> {
  // Backend returns 201 on create and 200 on update-by-phone — both are success.
  return api.post<ApiCustomer>("/customers/", body);
}

export async function fetchCustomerDetail(id: string | number): Promise<ApiCustomer> {
  return api.get<ApiCustomer>(`/customers/${id}/`);
}

export async function updateCustomer(
  id: string | number,
  patch: Partial<{ name: string; phone: string }>,
): Promise<ApiCustomer> {
  return api.patch<ApiCustomer>(`/customers/${id}/`, patch);
}

export async function fetchOrders(): Promise<ApiOrder[]> {
  const data = await api.get<unknown>("/orders/");
  return unwrapList<ApiOrder>(data);
}

export async function createOrder(body: unknown): Promise<ApiOrder> {
  return api.post<ApiOrder>("/orders/", body);
}

export async function patchOrder(
  id: string | number,
  patch: Partial<{
    status: string;
    pickup: string;
    order_type: string;
    channel: string;
  }>,
): Promise<ApiOrder> {
  return api.patch<ApiOrder>(`/orders/${id}/`, patch);
}
