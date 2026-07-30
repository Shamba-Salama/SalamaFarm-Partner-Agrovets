import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Category = "Fertilizer" | "Seeds" | "Vet Supplies" | "Pesticides";

export const CATEGORIES: Category[] = ["Fertilizer", "Seeds", "Vet Supplies", "Pesticides"];

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

export type CustomerOrder = {
  id: string;
  customer: string;
  phone: string;
  product: string;
  date: string;
  mpesaCode: string;
  amount: number;
  status: FollowUpStatus;
};

export type MpesaTx = {
  id: string;
  code: string;
  payer: string;
  phone: string;
  amount: number;
  time: string;
  item: string;
  pickup: "Collected" | "Awaiting Pickup" | "Unmatched";
};

export type StoreProfile = {
  name: string;
  town: string;
  county: string;
  till: string;
  whatsapp: string;
  permitFile: string | null;
  verified: boolean;
  open: boolean;
  onboarded: boolean;
};

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
    date: "2026-07-24",
    mpesaCode: "SGH4KL92AC",
    amount: 4850,
    status: "Pending",
  },
  {
    id: "o2",
    customer: "Kiprop Langat",
    phone: "254720998877",
    product: "Amitraz Cattle Dip 1L",
    date: "2026-07-22",
    mpesaCode: "SGF8ZZ21QW",
    amount: 1650,
    status: "Contacted",
  },
  {
    id: "o3",
    customer: "Achieng Otieno",
    phone: "254733445566",
    product: "Sukari F1 Tomato Seeds 10g",
    date: "2026-07-19",
    mpesaCode: "SGD1RT77MN",
    amount: 2400,
    status: "Satisfied",
  },
  {
    id: "o4",
    customer: "Musyoka Kimeu",
    phone: "254701223344",
    product: "Ridomil Gold MZ 250g",
    date: "2026-07-28",
    mpesaCode: "SGJ9PL44BV",
    amount: 1200,
    status: "Pending",
  },
];

const seedTx: MpesaTx[] = [
  {
    id: "t1",
    code: "SGJ9PL44BV",
    payer: "Musyoka Kimeu",
    phone: "254701223344",
    amount: 1200,
    time: "2026-07-28 09:14",
    item: "Ridomil Gold MZ 250g",
    pickup: "Awaiting Pickup",
  },
  {
    id: "t2",
    code: "SGH4KL92AC",
    payer: "Wanjiku Mwangi",
    phone: "254712345678",
    amount: 4850,
    time: "2026-07-24 15:02",
    item: "YaraMila Cereal 50kg",
    pickup: "Collected",
  },
  {
    id: "t3",
    code: "SGF8ZZ21QW",
    payer: "Kiprop Langat",
    phone: "254720998877",
    amount: 1650,
    time: "2026-07-22 11:41",
    item: "Amitraz Cattle Dip 1L",
    pickup: "Collected",
  },
  {
    id: "t4",
    code: "SGX0MM13LO",
    payer: "Unknown sender",
    phone: "254799112233",
    amount: 780,
    time: "2026-07-21 17:55",
    item: "—",
    pickup: "Unmatched",
  },
  {
    id: "t5",
    code: "SGD1RT77MN",
    payer: "Achieng Otieno",
    phone: "254733445566",
    amount: 2400,
    time: "2026-07-19 08:30",
    item: "Sukari F1 Tomato Seeds 10g",
    pickup: "Collected",
  },
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

type Ctx = {
  profile: StoreProfile;
  setProfile: (p: Partial<StoreProfile>) => void;
  products: Product[];
  saveProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  toggleProduct: (id: string) => void;
  orders: CustomerOrder[];
  setOrderStatus: (id: string, status: FollowUpStatus) => void;
  transactions: MpesaTx[];
  setPickup: (id: string, pickup: MpesaTx["pickup"]) => void;
};

const PortalContext = createContext<Ctx | null>(null);

export function PortalProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<StoreProfile>({
    name: "Green Valley Agrovet",
    town: "Nakuru Town",
    county: "Nakuru",
    till: "5203817",
    whatsapp: "254711223344",
    permitFile: "business-permit-2026.pdf",
    verified: false,
    open: true,
    onboarded: false,
  });
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [orders, setOrders] = useState<CustomerOrder[]>(seedOrders);
  const [transactions, setTransactions] = useState<MpesaTx[]>(seedTx);

  const setProfile = useCallback(
    (p: Partial<StoreProfile>) => setProfileState((prev) => ({ ...prev, ...p })),
    [],
  );

  const saveProduct = useCallback((p: Product) => {
    setProducts((prev) =>
      prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev],
    );
  }, []);

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
    (id: string, pickup: MpesaTx["pickup"]) =>
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, pickup } : t))),
    [],
  );

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      products,
      saveProduct,
      deleteProduct,
      toggleProduct,
      orders,
      setOrderStatus,
      transactions,
      setPickup,
    }),
    [
      profile,
      setProfile,
      products,
      saveProduct,
      deleteProduct,
      toggleProduct,
      orders,
      setOrderStatus,
      transactions,
      setPickup,
    ],
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used inside PortalProvider");
  return ctx;
}
