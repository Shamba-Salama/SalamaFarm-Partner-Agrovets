import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
  expiry: string; // ISO date
  image: string;
  active: boolean;
};

export type FollowUpStatus = "Pending" | "Contacted" | "Satisfied";

export type OrderItem = { name: string; qty: number; price: number };

export type CustomerOrder = {
  id: string;
  customer: string;
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

export type StoreProfile = {
  name: string;
  town: string;
  county: string;
  till: string;
  attendantPhone: string;
  open: boolean;
  onboarded: boolean;
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

const seedProducts: Product[] = [
  {
    id: "p1",
    name: "YaraMila Cereal 50kg",
    category: "Fertilizer",
    description: "NPK 23:10:5 top dressing fertilizer. Apply 1 handful per planting hole.",
    price: 4850,
    stock: 24,
    expiry: "2027-04-30",
    image: "🌾",
    active: true,
  },
  {
    id: "p2",
    name: "Simba Hybrid Maize SC Duma 43",
    category: "Seeds",
    description: "Early maturing drought tolerant maize seed, 2kg pack.",
    price: 780,
    stock: 3,
    expiry: "2026-11-12",
    image: "🌽",
    active: true,
  },
  {
    id: "p3",
    name: "Amitraz Cattle Dip 1L",
    category: "Vet Supplies",
    description: "Acaricide for tick control in cattle. Dilute 2ml per litre of water.",
    price: 1650,
    stock: 12,
    expiry: "2026-08-20",
    image: "🐄",
    active: true,
  },
  {
    id: "p4",
    name: "Ridomil Gold MZ 250g",
    category: "Pesticides",
    description: "Systemic fungicide for late blight in potatoes and tomatoes.",
    price: 1200,
    stock: 8,
    expiry: "2026-07-25",
    image: "🧴",
    active: true,
  },
  {
    id: "p5",
    name: "Kienyeji Chick Mash 20kg",
    category: "Vet Supplies",
    description: "Balanced starter mash for indigenous chicks, 0-8 weeks.",
    price: 1980,
    stock: 2,
    expiry: "2026-09-05",
    image: "🐓",
    active: false,
  },
  {
    id: "p6",
    name: "Sukari F1 Tomato Seeds 10g",
    category: "Seeds",
    description: "High yielding determinate tomato variety for open field.",
    price: 2400,
    stock: 17,
    expiry: "2027-01-18",
    image: "🍅",
    active: true,
  },
];

const seedOrders: CustomerOrder[] = [
  {
    id: "o1",
    customer: "Wanjiku Mwangi",
    phone: "254712345678",
    product: "YaraMila Cereal 50kg",
    items: [{ name: "YaraMila Cereal 50kg", qty: 1, price: 4850 }],
    date: "2026-07-24",
    time: "15:02",
    mpesaCode: "SGH4KL92AC",
    amount: 4850,
    status: "Pending",
    channel: "in-app",
    orderType: "Counter Pickup",
    pickup: "Collected",
  },
  {
    id: "o2",
    customer: "Kiprop Langat",
    phone: "254720998877",
    product: "Amitraz Cattle Dip 1L",
    items: [{ name: "Amitraz Cattle Dip 1L", qty: 1, price: 1650 }],
    date: "2026-07-22",
    time: "11:41",
    mpesaCode: "SGF8ZZ21QW",
    amount: 1650,
    status: "Contacted",
    channel: "offline-sms",
    orderType: "Counter Pickup",
    pickup: "Collected",
  },
  {
    id: "o3",
    customer: "Achieng Otieno",
    phone: "254733445566",
    product: "Sukari F1 Tomato Seeds 10g",
    items: [{ name: "Sukari F1 Tomato Seeds 10g", qty: 1, price: 2400 }],
    date: "2026-07-19",
    time: "08:30",
    mpesaCode: "SGD1RT77MN",
    amount: 2400,
    status: "Satisfied",
    channel: "in-app",
    orderType: "Delivery",
    pickup: "Collected",
  },
  {
    id: "o4",
    customer: "Musyoka Kimeu",
    phone: "254701223344",
    product: "Ridomil Gold MZ 250g",
    items: [{ name: "Ridomil Gold MZ 250g", qty: 1, price: 1200 }],
    date: "2026-07-28",
    time: "09:14",
    mpesaCode: "SGJ9PL44BV",
    amount: 1200,
    status: "Pending",
    channel: "offline-sms",
    orderType: "Counter Pickup",
    pickup: "Awaiting Pickup",
  },
];

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

export const weeklySales = [
  { week: "Wk 22", Fertilizer: 42000, Seeds: 18000, "Vet Supplies": 21000, Pesticides: 12000 },
  { week: "Wk 23", Fertilizer: 51000, Seeds: 22500, "Vet Supplies": 17800, Pesticides: 15400 },
  { week: "Wk 24", Fertilizer: 38500, Seeds: 30100, "Vet Supplies": 24200, Pesticides: 11200 },
  { week: "Wk 25", Fertilizer: 61200, Seeds: 27400, "Vet Supplies": 19600, Pesticides: 18900 },
  { week: "Wk 26", Fertilizer: 47800, Seeds: 33800, "Vet Supplies": 28100, Pesticides: 14300 },
  { week: "Wk 27", Fertilizer: 72400, Seeds: 29900, "Vet Supplies": 31500, Pesticides: 20600 },
];

export function daysUntil(dateStr: string) {
  const today = new Date("2026-07-30T00:00:00Z").getTime();
  return Math.round((new Date(dateStr + "T00:00:00Z").getTime() - today) / 86400000);
}

export function stockStatus(p: Product): "In Stock" | "Low Stock" | "Expired" | "Clearance" {
  const d = daysUntil(p.expiry);
  if (d < 0) return "Expired";
  if (p.stock < 5) return "Low Stock";
  if (d <= 30) return "Clearance";
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
  setProfile: (p: Partial<StoreProfile>) => void;
  products: Product[];
  saveProduct: (p: Product) => void;
  importProducts: (p: Product[]) => void;
  deleteProduct: (id: string) => void;
  toggleProduct: (id: string) => void;
  orders: CustomerOrder[];
  setOrderStatus: (id: string, status: FollowUpStatus) => void;
  setPickup: (id: string, pickup: CustomerOrder["pickup"]) => void;
  newOrderCount: number;
  clearNewOrders: () => void;
  threads: Thread[];
  unreadMessages: number;
  openThreadId: string | null;
  openChat: (id: string | null) => void;
  markRead: (id: string) => void;
  sendMessage: (threadId: string, text: string) => void;
  startThread: (farmer: string, phone: string, channel: Channel, topic: string, text: string) => void;
  stkPush: (input: {
    phone: string;
    amount: number;
    product: string;
    customer?: string;
  }) => { channel: Channel; code: string };
  lastIncoming: { thread: Thread; text: string; key: string } | null;
  soundOn: boolean;
  setSoundOn: (v: boolean) => void;
  enablePush: () => void;
};

const PortalContext = createContext<Ctx | null>(null);

export function PortalProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<StoreProfile>({
    name: "Green Valley Agrovet",
    town: "Nakuru Town",
    county: "Nakuru",
    till: "5203817",
    attendantPhone: "0711223344",
    open: true,
    onboarded: false,
  });
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [orders, setOrders] = useState<CustomerOrder[]>(seedOrders);
  const [threads, setThreads] = useState<Thread[]>(seedThreads);
  const [newOrderCount, setNewOrderCount] = useState(1);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  const setProfile = useCallback(
    (p: Partial<StoreProfile>) => setProfileState((prev) => ({ ...prev, ...p })),
    [],
  );

  const saveProduct = useCallback((p: Product) => {
    setProducts((prev) =>
      prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev],
    );
  }, []);

  const importProducts = useCallback(
    (list: Product[]) => setProducts((prev) => [...list, ...prev]),
    [],
  );

  const deleteProduct = useCallback(
    (id: string) => setProducts((prev) => prev.filter((p) => p.id !== id)),
    [],
  );

  const toggleProduct = useCallback(
    (id: string) =>
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))),
    [],
  );

  const setOrderStatus = useCallback(
    (id: string, status: FollowUpStatus) =>
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o))),
    [],
  );

  const setPickup = useCallback(
    (id: string, pickup: CustomerOrder["pickup"]) =>
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, pickup } : o))),
    [],
  );

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

  const stkPush = useCallback<Ctx["stkPush"]>(
    ({ phone, amount, product, customer }) => {
      const normalized = phone.replace(/\D/g, "").replace(/^0/, "254");
      const known = orders.find((o) => o.phone === normalized) ?? threads.find((t) => t.phone === normalized);
      const channel: Channel = known ? "in-app" : "offline-sms";
      const code = "SG" + uid().toUpperCase().slice(0, 8);
      const d = new Date();
      setOrders((prev) => [
        {
          id: uid(),
          customer: customer?.trim() || (known && "farmer" in known ? known.farmer : known?.customer) || "Counter Customer",
          phone: normalized,
          product,
          items: [{ name: product, qty: 1, price: amount }],
          date: d.toISOString().slice(0, 10),
          time: nowTime(),
          mpesaCode: code,
          amount,
          status: "Pending",
          channel,
          orderType: "Counter Pickup",
          pickup: "Awaiting Pickup",
        },
        ...prev,
      ]);
      setNewOrderCount((n) => n + 1);
      return { channel, code };
    },
    [orders, threads],
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
      setProfile,
      products,
      saveProduct,
      importProducts,
      deleteProduct,
      toggleProduct,
      orders,
      setOrderStatus,
      setPickup,
      newOrderCount,
      clearNewOrders: () => setNewOrderCount(0),
      threads,
      unreadMessages,
      openThreadId,
      openChat,
      markRead,
      sendMessage,
      startThread,
      stkPush,
      lastIncoming: incoming,
      soundOn,
      setSoundOn,
      enablePush,
    }),
    [
      profile,
      setProfile,
      products,
      saveProduct,
      importProducts,
      deleteProduct,
      toggleProduct,
      orders,
      setOrderStatus,
      setPickup,
      newOrderCount,
      threads,
      unreadMessages,
      openThreadId,
      openChat,
      markRead,
      sendMessage,
      startThread,
      stkPush,
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
