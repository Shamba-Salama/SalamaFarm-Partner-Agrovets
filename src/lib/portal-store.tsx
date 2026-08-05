import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  apiStoreToProfile,
  emptyStoreProfile,
  fetchStore,
  patchStore,
  type StoreProfile,
} from "@/lib/store-api";
import {
  apiProductToProduct,
  createProduct as createProductApi,
  deleteProductApi,
  fetchProducts,
  importProductsCsv,
  toggleProductActive,
  updateProduct as updateProductApi,
  type ProductWriteBody,
} from "@/lib/catalog-api";
import {
  apiCustomerToCustomer,
  apiOrderToOrder,
  buildCounterOrderBody,
  createOrder as createOrderApi,
  fetchCustomers,
  fetchOrders,
  patchOrder,
  upsertCustomer,
  type PortalCustomer,
} from "@/lib/crm-api";
import { fetchWeeklySales, type WeeklySalesRow } from "@/lib/analytics-api";
import { chargeOrder, createSubaccount, type ChargeResponse } from "@/lib/payments-api";
import { ApiError } from "@/lib/api-client";

export type { WeeklySalesRow } from "@/lib/analytics-api";
export type { ChargeResponse } from "@/lib/payments-api";
export { prepareWeeklySalesChartRows } from "@/lib/analytics-api";

export type { ApiStore, StoreProfile } from "@/lib/store-api";
export { emptyStoreProfile } from "@/lib/store-api";
export type { PortalCustomer } from "@/lib/crm-api";
export type { ProductWriteBody } from "@/lib/catalog-api";

export type Category = "Fertilizer" | "Seeds" | "Vet Supplies" | "Pesticides";

export const CATEGORIES: Category[] = ["Fertilizer", "Seeds", "Vet Supplies", "Pesticides"];

export type Channel = "in-app" | "offline-sms";

export type Product = {
  id: string;
  name: string;
  category: Category;
  description: string;
  price: number;
  stock: number;
  expiry: string | null;
  image: string;
  imageUrl?: string | null;
  active: boolean;
};

export type FollowUpStatus = "Pending" | "Contacted" | "Satisfied";

export type OrderItem = { name: string; qty: number; price: number };

export type CustomerOrder = {
  id: string;
  customer: string;
  customerId?: string;
  phone: string;
  product: string;
  items: OrderItem[];
  date: string;
  time: string;
  mpesaCode: string;
  amount: number;
  status: FollowUpStatus;
  channel: Channel;
  orderType: "Counter Pickup" | "Delivery";
  pickup: "Collected" | "Awaiting Pickup" | "Unmatched";
  paidAt: string | null;
};

export type ChatMessage = {
  id: string;
  from: "farmer" | "store";
  text: string;
  time: string;
};

export type Thread = {
  id: string;
  farmer: string;
  phone: string;
  channel: Channel;
  topic: string;
  unread: number;
  messages: ChatMessage[];
};

export const FOLLOW_UP_TEMPLATES = [
  {
    id: "pest-7",
    label: "7-Day Pest Control Check",
    body: (c: string, item: string) =>
      `Habari ${c}, it has been a week since you bought ${item}. Have the pests reduced on your crop? Reply here if you need a stronger dose or a different product.`,
  },
  {
    id: "fert-14",
    label: "14-Day Fertilizer Application Review",
    body: (c: string, item: string) =>
      `Hello ${c}, two weeks after applying ${item} — how is the crop colour and growth? We can advise on top dressing timing.`,
  },
  {
    id: "vaccine",
    label: "Livestock Vaccine Reminder",
    body: (c: string, item: string) =>
      `Hi ${c}, a reminder that the next dose after ${item} is due soon. Shall we reserve a batch for you at the counter?`,
  },
  {
    id: "restock",
    label: "Restock & Seasonal Offer",
    body: (c: string, item: string) =>
      `Habari ${c}! Planting season is here and ${item} is back in stock at a partner price. Reply to reserve yours.`,
  },
] as const;

const seedThreads: Thread[] = [
  {
    id: "th1",
    farmer: "Wanjiku Mwangi",
    phone: "254712345678",
    channel: "in-app",
    topic: "Maize leaf yellowing",
    unread: 2,
    messages: [
      {
        id: "m1",
        from: "farmer",
        text: "Habari, my maize leaves are turning yellow from the bottom. Which fertilizer should I add?",
        time: "08:12",
      },
      { id: "m2", from: "farmer", text: "The crop is 6 weeks old.", time: "08:13" },
    ],
  },
  {
    id: "th2",
    farmer: "Kiprop Langat",
    phone: "254720998877",
    channel: "offline-sms",
    topic: "Cattle tick control",
    unread: 0,
    messages: [
      { id: "m3", from: "farmer", text: "Is the Amitraz dip still in stock?", time: "Yesterday" },
      {
        id: "m4",
        from: "store",
        text: "Yes, we have 12 litres left. Pass by the counter today.",
        time: "Yesterday",
      },
    ],
  },
];

const farmerPool = [
  { name: "Njeri Kamau", phone: "254714009911", topic: "Tomato late blight" },
  { name: "Otieno Were", phone: "254705772211", topic: "Layer chicken drop in eggs" },
  { name: "Chebet Rono", phone: "254718330077", topic: "Potato seed availability" },
  { name: "Mutiso Ndeti", phone: "254799441122", topic: "Goat deworming schedule" },
  { name: "Amina Hassan", phone: "254736554400", topic: "Kale aphid infestation" },
];

const inquiryLines = [
  "Which product do you recommend and what does it cost?",
  "Do you have stock today? I can come to the counter this evening.",
  "How much should I dilute per 20 litre knapsack?",
  "Can you deliver to my farm this week?",
];

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr || !String(dateStr).trim()) return null;
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((parsed.getTime() - todayMs) / 86400000);
}

export function stockStatus(p: Product): "In Stock" | "Low Stock" | "Expired" | "Clearance" {
  const d = daysUntil(p.expiry);
  if (d !== null && d < 0) return "Expired";
  if (p.stock < 5) return "Low Stock";
  if (d !== null && d <= 30) return "Clearance";
  return "In Stock";
}

export const formatKES = (n: number) =>
  "KES " + n.toLocaleString("en-KE", { maximumFractionDigits: 0 });

export const VAT_RATE = 0.16;

function playChime() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const notes = [880, 1174];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + i * 0.16 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.16 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.16);
      osc.stop(ctx.currentTime + i * 0.16 + 0.32);
    });
    setTimeout(() => void ctx.close(), 1200);
  } catch {
    /* audio unavailable */
  }
}

function pushNotification(title: string, body: string) {
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") new Notification(title, { body });
  } catch {
    /* notifications unavailable */
  }
}

const nowTime = () =>
  new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false });

const uid = () => Math.random().toString(36).slice(2, 10);

type Ctx = {
  profile: StoreProfile;
  storeReady: boolean;
  /** Apply a store profile from an API response without a network call. */
  hydrateProfile: (p: Partial<StoreProfile> | StoreProfile) => void;
  resetProfile: () => void;
  /** GET /store/ and replace local profile. */
  refreshStore: () => Promise<StoreProfile>;
  /** PATCH /store/ and update local profile from the response. */
  updateStore: (p: Partial<StoreProfile>) => Promise<StoreProfile>;
  /** Optimistic PATCH { open: !current }. Reverts on failure. */
  toggleStoreOpen: () => Promise<StoreProfile>;
  products: Product[];
  productsReady: boolean;
  productsLoading: boolean;
  refreshProducts: () => Promise<Product[]>;
  createProductEntry: (draft: ProductWriteBody) => Promise<Product>;
  updateProductEntry: (id: string, draft: ProductWriteBody) => Promise<Product>;
  removeProduct: (id: string) => Promise<void>;
  toggleProduct: (id: string) => Promise<Product>;
  importProductsCsvFile: (file: File) => Promise<{ created: number }>;
  resetProducts: () => void;
  orders: CustomerOrder[];
  ordersReady: boolean;
  ordersLoading: boolean;
  customers: PortalCustomer[];
  customersReady: boolean;
  customersLoading: boolean;
  refreshOrders: () => Promise<CustomerOrder[]>;
  resetOrders: () => void;
  refreshCustomers: () => Promise<PortalCustomer[]>;
  resetCustomers: () => void;
  createOrderEntry: (body: unknown) => Promise<CustomerOrder>;
  createCounterOrder: (input: {
    phone: string;
    productId: string;
    customer?: string;
  }) => Promise<{ order: CustomerOrder; channel: Channel }>;
  /** Initiate Paystack STK for an unpaid order. Does not mark paid locally. */
  chargeCounterOrder: (input: { orderId: string; phone: string }) => Promise<ChargeResponse>;
  createStoreSubaccount: () => Promise<{
    created: boolean;
    subaccountCode: string;
    profile: StoreProfile;
  }>;
  weeklySales: WeeklySalesRow[];
  weeklySalesReady: boolean;
  weeklySalesLoading: boolean;
  refreshWeeklySales: () => Promise<WeeklySalesRow[]>;
  resetWeeklySales: () => void;
  setOrderStatus: (id: string, status: FollowUpStatus) => Promise<CustomerOrder>;
  setPickup: (id: string, pickup: CustomerOrder["pickup"]) => Promise<CustomerOrder>;
  upsertCustomerEntry: (input: { name: string; phone: string }) => Promise<PortalCustomer>;
  newOrderCount: number;
  clearNewOrders: () => void;
  threads: Thread[];
  unreadMessages: number;
  openThreadId: string | null;
  openChat: (id: string | null) => void;
  markRead: (id: string) => void;
  sendMessage: (threadId: string, text: string) => void;
  startThread: (
    farmer: string,
    phone: string,
    channel: Channel,
    topic: string,
    text: string,
  ) => void;
  lastIncoming: { thread: Thread; text: string; key: string } | null;
  soundOn: boolean;
  setSoundOn: (v: boolean) => void;
  enablePush: () => void;
};

const PortalContext = createContext<Ctx | null>(null);

export function PortalProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<StoreProfile>(() => emptyStoreProfile());
  const [storeReady, setStoreReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsReady, setProductsReady] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersReady, setOrdersReady] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [customers, setCustomers] = useState<PortalCustomer[]>([]);
  const [customersReady, setCustomersReady] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [weeklySales, setWeeklySales] = useState<WeeklySalesRow[]>([]);
  const [weeklySalesReady, setWeeklySalesReady] = useState(false);
  const [weeklySalesLoading, setWeeklySalesLoading] = useState(false);
  const [threads, setThreads] = useState<Thread[]>(seedThreads);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const chargingOrderIds = useRef(new Set<string>());

  const mapProduct = useCallback((raw: ReturnType<typeof apiProductToProduct>): Product => {
    const category = CATEGORIES.includes(raw.category as Category)
      ? (raw.category as Category)
      : "Fertilizer";
    return { ...raw, category };
  }, []);

  const mapOrder = useCallback((raw: ReturnType<typeof apiOrderToOrder>): CustomerOrder => {
    const channel: Channel = raw.channel === "offline-sms" ? "offline-sms" : "in-app";
    const status: FollowUpStatus =
      raw.status === "Contacted" || raw.status === "Satisfied" ? raw.status : "Pending";
    const orderType: CustomerOrder["orderType"] =
      raw.orderType === "Delivery" ? "Delivery" : "Counter Pickup";
    const pickup: CustomerOrder["pickup"] =
      raw.pickup === "Collected" || raw.pickup === "Awaiting Pickup" || raw.pickup === "Unmatched"
        ? raw.pickup
        : "Unmatched";
    return {
      id: raw.id,
      customer: raw.customer,
      customerId: raw.customerId,
      phone: raw.phone,
      product: raw.product,
      items: raw.items,
      date: raw.date,
      time: raw.time,
      mpesaCode: raw.mpesaCode,
      amount: raw.amount,
      status,
      channel,
      orderType,
      pickup,
      paidAt: raw.paidAt ?? null,
    };
  }, []);

  const hydrateProfile = useCallback((p: Partial<StoreProfile> | StoreProfile) => {
    setProfileState((prev) => ({ ...prev, ...p }));
    setStoreReady(true);
  }, []);

  const resetProfile = useCallback(() => {
    setProfileState(emptyStoreProfile());
    setStoreReady(false);
  }, []);

  const refreshStore = useCallback(async () => {
    const store = await fetchStore();
    const next = apiStoreToProfile(store);
    setProfileState(next);
    setStoreReady(true);
    return next;
  }, []);

  const updateStore = useCallback(async (p: Partial<StoreProfile>) => {
    const store = await patchStore(p);
    const next = apiStoreToProfile(store);
    setProfileState(next);
    setStoreReady(true);
    return next;
  }, []);

  const toggleStoreOpen = useCallback(async () => {
    let previous = true;
    setProfileState((prev) => {
      previous = prev.open;
      return { ...prev, open: !prev.open };
    });
    try {
      const store = await patchStore({ open: !previous });
      const next = apiStoreToProfile(store);
      setProfileState(next);
      return next;
    } catch (err) {
      setProfileState((prev) => ({ ...prev, open: previous }));
      throw err;
    }
  }, []);

  const resetProducts = useCallback(() => {
    setProducts([]);
    setProductsReady(false);
    setProductsLoading(false);
  }, []);

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const list = await fetchProducts();
      const next = list.map((row) => mapProduct(apiProductToProduct(row)));
      setProducts(next);
      setProductsReady(true);
      return next;
    } finally {
      setProductsLoading(false);
    }
  }, [mapProduct]);

  const createProductEntry = useCallback(
    async (draft: ProductWriteBody) => {
      const created = mapProduct(apiProductToProduct(await createProductApi(draft)));
      setProducts((prev) => [created, ...prev]);
      setProductsReady(true);
      return created;
    },
    [mapProduct],
  );

  const updateProductEntry = useCallback(
    async (id: string, draft: ProductWriteBody) => {
      try {
        const updated = mapProduct(apiProductToProduct(await updateProductApi(id, draft)));
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
        return updated;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          await refreshProducts();
          throw new ApiError("This product no longer exists.", 404, err.body);
        }
        throw err;
      }
    },
    [mapProduct, refreshProducts],
  );

  const removeProduct = useCallback(
    async (id: string) => {
      let removed: Product | undefined;
      setProducts((prev) => {
        removed = prev.find((p) => p.id === id);
        return prev.filter((p) => p.id !== id);
      });
      try {
        await deleteProductApi(id);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          await refreshProducts();
          throw new ApiError("This product no longer exists.", 404, err.body);
        }
        if (removed) {
          setProducts((prev) => {
            if (prev.some((p) => p.id === removed!.id)) return prev;
            return [removed!, ...prev];
          });
        }
        throw err;
      }
    },
    [refreshProducts],
  );

  const toggleProduct = useCallback(
    async (id: string) => {
      let previousActive = true;
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          previousActive = p.active;
          return { ...p, active: !p.active };
        }),
      );
      try {
        const updated = mapProduct(apiProductToProduct(await toggleProductActive(id)));
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
        return updated;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          await refreshProducts();
          throw new ApiError("This product no longer exists.", 404, err.body);
        }
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, active: previousActive } : p)),
        );
        throw err;
      }
    },
    [mapProduct, refreshProducts],
  );

  const importProductsCsvFile = useCallback(
    async (file: File) => {
      const result = await importProductsCsv(file);
      await refreshProducts();
      return { created: result.created };
    },
    [refreshProducts],
  );

  const resetOrders = useCallback(() => {
    setOrders([]);
    setOrdersReady(false);
    setOrdersLoading(false);
  }, []);

  const refreshOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const list = await fetchOrders();
      const next = list.map((row) => mapOrder(apiOrderToOrder(row)));
      setOrders(next);
      setOrdersReady(true);
      return next;
    } finally {
      setOrdersLoading(false);
    }
  }, [mapOrder]);

  const resetCustomers = useCallback(() => {
    setCustomers([]);
    setCustomersReady(false);
    setCustomersLoading(false);
  }, []);

  const refreshCustomers = useCallback(async () => {
    setCustomersLoading(true);
    try {
      const list = await fetchCustomers();
      const next = list.map(apiCustomerToCustomer);
      setCustomers(next);
      setCustomersReady(true);
      return next;
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  const createOrderEntry = useCallback(
    async (body: unknown) => {
      const created = mapOrder(apiOrderToOrder(await createOrderApi(body)));
      setOrders((prev) => [created, ...prev]);
      setOrdersReady(true);
      setNewOrderCount((n) => n + 1);
      return created;
    },
    [mapOrder],
  );

  const upsertCustomerEntry = useCallback(async (input: { name: string; phone: string }) => {
    const saved = apiCustomerToCustomer(await upsertCustomer(input));
    setCustomers((prev) => {
      const without = prev.filter((c) => c.id !== saved.id && c.phone !== saved.phone);
      return [saved, ...without];
    });
    setCustomersReady(true);
    return saved;
  }, []);

  const setOrderStatus = useCallback(
    async (id: string, status: FollowUpStatus) => {
      let previous: FollowUpStatus = "Pending";
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o;
          previous = o.status;
          return { ...o, status };
        }),
      );
      try {
        const updated = mapOrder(apiOrderToOrder(await patchOrder(id, { status })));
        setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
        return updated;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          await refreshOrders();
          throw new ApiError("This order no longer exists.", 404, err.body);
        }
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: previous } : o)));
        throw err;
      }
    },
    [mapOrder, refreshOrders],
  );

  const setPickup = useCallback(
    async (id: string, pickup: CustomerOrder["pickup"]) => {
      let previous: CustomerOrder["pickup"] = "Unmatched";
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o;
          previous = o.pickup;
          return { ...o, pickup };
        }),
      );
      try {
        const updated = mapOrder(apiOrderToOrder(await patchOrder(id, { pickup })));
        setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
        return updated;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          await refreshOrders();
          throw new ApiError("This order no longer exists.", 404, err.body);
        }
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, pickup: previous } : o)));
        throw err;
      }
    },
    [mapOrder, refreshOrders],
  );

  const createCounterOrder = useCallback(
    async (input: { phone: string; productId: string; customer?: string }) => {
      const product = products.find((p) => p.id === input.productId);
      if (!product) {
        throw new ApiError("Select a product from inventory.", 400, null);
      }
      const normalized = input.phone.replace(/\D/g, "").replace(/^0/, "254");
      const known =
        orders.find((o) => o.phone === normalized) ||
        customers.find((c) => c.phone === normalized) ||
        threads.find((t) => t.phone === normalized);
      const channel: Channel = known ? "in-app" : "offline-sms";
      const body = buildCounterOrderBody({
        productId: Number(product.id),
        productPrice: product.price,
        phone: normalized,
        customerName: input.customer,
        channel,
      });
      const order = await createOrderEntry(body);
      void refreshCustomers().catch(() => undefined);
      return { order, channel };
    },
    [products, orders, customers, threads, createOrderEntry, refreshCustomers],
  );

  const chargeCounterOrder = useCallback(async (input: { orderId: string; phone: string }) => {
    const id = input.orderId;
    if (chargingOrderIds.current.has(id)) {
      throw new ApiError("A charge is already in progress for this order.", 409, null);
    }
    chargingOrderIds.current.add(id);
    try {
      return await chargeOrder({ orderId: id, phone: input.phone });
    } finally {
      chargingOrderIds.current.delete(id);
    }
  }, []);

  const createStoreSubaccount = useCallback(async () => {
    const res = await createSubaccount();
    const next = apiStoreToProfile(res.store);
    setProfileState(next);
    setStoreReady(true);
    return {
      created: res.created,
      subaccountCode: res.subaccount_code,
      profile: next,
    };
  }, []);

  const resetWeeklySales = useCallback(() => {
    setWeeklySales([]);
    setWeeklySalesReady(false);
    setWeeklySalesLoading(false);
  }, []);

  const refreshWeeklySales = useCallback(async () => {
    setWeeklySalesLoading(true);
    try {
      const list = await fetchWeeklySales();
      setWeeklySales(list);
      setWeeklySalesReady(true);
      return list;
    } finally {
      setWeeklySalesLoading(false);
    }
  }, []);

  const markRead = useCallback(
    (id: string) => setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t))),
    [],
  );

  const openChat = useCallback(
    (id: string | null) => {
      setOpenThreadId(id);
      if (id) markRead(id);
    },
    [markRead],
  );

  const sendMessage = useCallback((threadId: string, text: string) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              unread: 0,
              messages: [...t.messages, { id: uid(), from: "store", text, time: nowTime() }],
            }
          : t,
      ),
    );
  }, []);

  const startThread = useCallback(
    (farmer: string, phone: string, channel: Channel, topic: string, text: string) => {
      setThreads((prev) => {
        const existing = prev.find((t) => t.phone === phone);
        if (existing) {
          return prev.map((t) =>
            t.id === existing.id
              ? {
                  ...t,
                  messages: [...t.messages, { id: uid(), from: "store", text, time: nowTime() }],
                }
              : t,
          );
        }
        return [
          {
            id: uid(),
            farmer,
            phone,
            channel,
            topic,
            unread: 0,
            messages: [{ id: uid(), from: "store", text, time: nowTime() }],
          },
          ...prev,
        ];
      });
    },
    [],
  );

  const enablePush = useCallback(() => {
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        void Notification.requestPermission();
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Simulated realtime channel (stands in for Supabase Realtime / WebSocket feed)
  const [incoming, setIncoming] = useState<{ thread: Thread; text: string; key: string } | null>(
    null,
  );

  useEffect(() => {
    if (!profile.open) return;
    const timer = window.setInterval(() => {
      const f = farmerPool[Math.floor(Math.random() * farmerPool.length)]!;
      const text = inquiryLines[Math.floor(Math.random() * inquiryLines.length)]!;
      const msg: ChatMessage = { id: uid(), from: "farmer", text, time: nowTime() };
      let delivered: Thread | null = null;
      setThreads((prev) => {
        const existing = prev.find((t) => t.phone === f.phone);
        if (existing) {
          delivered = {
            ...existing,
            unread: existing.unread + 1,
            messages: [...existing.messages, msg],
          };
          return prev.map((t) => (t.id === existing.id ? delivered! : t));
        }
        delivered = {
          id: uid(),
          farmer: f.name,
          phone: f.phone,
          channel: "in-app",
          topic: f.topic,
          unread: 1,
          messages: [msg],
        };
        return [delivered, ...prev];
      });
      window.setTimeout(() => {
        if (delivered) setIncoming({ thread: delivered, text, key: uid() });
      }, 0);
    }, 25000);
    return () => window.clearInterval(timer);
  }, [profile.open]);

  useEffect(() => {
    if (!incoming) return;
    if (soundOn) playChime();
    pushNotification(
      `New inquiry from ${incoming.thread.farmer}`,
      `${incoming.thread.topic}: ${incoming.text}`,
    );
  }, [incoming, soundOn]);

  const unreadMessages = threads.reduce((s, t) => s + t.unread, 0);

  const value = useMemo(
    () => ({
      profile,
      storeReady,
      hydrateProfile,
      resetProfile,
      refreshStore,
      updateStore,
      toggleStoreOpen,
      products,
      productsReady,
      productsLoading,
      refreshProducts,
      createProductEntry,
      updateProductEntry,
      removeProduct,
      toggleProduct,
      importProductsCsvFile,
      resetProducts,
      orders,
      ordersReady,
      ordersLoading,
      customers,
      customersReady,
      customersLoading,
      refreshOrders,
      resetOrders,
      refreshCustomers,
      resetCustomers,
      createOrderEntry,
      createCounterOrder,
      chargeCounterOrder,
      createStoreSubaccount,
      weeklySales,
      weeklySalesReady,
      weeklySalesLoading,
      refreshWeeklySales,
      resetWeeklySales,
      setOrderStatus,
      setPickup,
      upsertCustomerEntry,
      newOrderCount,
      clearNewOrders: () => setNewOrderCount(0),
      threads,
      unreadMessages,
      openThreadId,
      openChat,
      markRead,
      sendMessage,
      startThread,
      lastIncoming: incoming,
      soundOn,
      setSoundOn,
      enablePush,
    }),
    [
      profile,
      storeReady,
      hydrateProfile,
      resetProfile,
      refreshStore,
      updateStore,
      toggleStoreOpen,
      products,
      productsReady,
      productsLoading,
      refreshProducts,
      createProductEntry,
      updateProductEntry,
      removeProduct,
      toggleProduct,
      importProductsCsvFile,
      resetProducts,
      orders,
      ordersReady,
      ordersLoading,
      customers,
      customersReady,
      customersLoading,
      refreshOrders,
      resetOrders,
      refreshCustomers,
      resetCustomers,
      createOrderEntry,
      createCounterOrder,
      chargeCounterOrder,
      createStoreSubaccount,
      weeklySales,
      weeklySalesReady,
      weeklySalesLoading,
      refreshWeeklySales,
      resetWeeklySales,
      setOrderStatus,
      setPickup,
      upsertCustomerEntry,
      newOrderCount,
      threads,
      unreadMessages,
      openThreadId,
      openChat,
      markRead,
      sendMessage,
      startThread,
      incoming,
      soundOn,
      enablePush,
    ],
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used inside PortalProvider");
  return ctx;
}
