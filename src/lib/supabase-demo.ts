import { clearTokens, getAccessToken, setTokens } from "./auth-storage";
import { ApiError } from "./api-client";

const DEMO_STORAGE_KEY = "salamafarm_demo_backend_v1";
const DEMO_USER_KEY = "salamafarm_demo_user_email";

export type DemoProduct = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: string;
  stock: number;
  expiry: string | null;
  image_emoji: string;
  image: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type DemoUser = {
  id: number;
  email: string;
  password: string;
  phone: string;
  created_at: string;
  store: {
    id: number;
    name: string;
    town: string;
    county: string;
    till: string;
    attendant_phone: string;
    open: boolean;
    onboarded: boolean;
  } | null;
};

type DemoState = {
  users: DemoUser[];
  products: DemoProduct[];
  orders: any[];
  customers: any[];
  threads: any[];
};

function readDemoState(): DemoState {
  if (typeof window === "undefined") {
    return buildDefaultDemoState();
  }

  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) {
      const initial = buildDefaultDemoState();
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as DemoState;
  } catch {
    const initial = buildDefaultDemoState();
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function writeDemoState(state: DemoState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
}

function buildDefaultDemoState(): DemoState {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 1,
        email: "demo@salamafarm.co.ke",
        password: "demo123",
        phone: "+254712345678",
        created_at: now,
        store: {
          id: 1,
          name: "SalamaFarm Agrovet",
          town: "Nairobi",
          county: "Nairobi County",
          till: "123456",
          attendant_phone: "+254712345678",
          open: true,
          onboarded: true,
        },
      },
    ],
    products: [
      {
        id: 1,
        name: "Maize Seeds",
        category: "Seeds",
        description: "High-yield maize seed blend for local farmers.",
        price: "1850.00",
        stock: 28,
        expiry: "2027-03-01",
        image_emoji: "🌾",
        image: null,
        active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        name: "Organic Fertilizer",
        category: "Fertilizer",
        description: "Balanced organic fertilizer for vegetables and cereals.",
        price: "2500.00",
        stock: 12,
        expiry: "2026-12-15",
        image_emoji: "🌱",
        image: null,
        active: true,
        created_at: now,
        updated_at: now,
      },
    ],
    orders: [
      {
        id: 1,
        customer_name: "Lucy Wanjiku",
        customer_phone: "+254700111222",
        total_amount: 2200,
        amount: 2200,
        status: "Pending",
        payment_status: "paid",
        pickup: "Awaiting Pickup",
        order_type: "counter",
        channel: "Marketplace",
        created_at: now,
      },
      {
        id: 2,
        customer_name: "David Otieno",
        customer_phone: "+254712998877",
        total_amount: 3300,
        amount: 3300,
        status: "Completed",
        payment_status: "paid",
        pickup: "Collected",
        order_type: "counter",
        channel: "Marketplace",
        created_at: now,
      },
    ],
    customers: [
      {
        id: 1,
        name: "Lucy Wanjiku",
        phone: "+254700111222",
        last_order: now,
      },
      {
        id: 2,
        name: "David Otieno",
        phone: "+254712998877",
        last_order: now,
      },
    ],
    threads: [
      {
        id: 1,
        customer_name: "Lucy Wanjiku",
        customer_phone: "+254700111222",
        unread: 1,
        last_message: "Thanks, I am picking up the order today.",
        messages: [
          { id: 1, sender: "customer", text: "Hi, do you still have maize seeds?" },
          { id: 2, sender: "store", text: "Yes, we do. We can reserve it for you." },
        ],
      },
    ],
  };
}

function getDemoUserEmail(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DEMO_USER_KEY);
}

function setDemoUserEmail(email: string | null) {
  if (typeof window === "undefined") return;
  if (email) {
    window.localStorage.setItem(DEMO_USER_KEY, email);
  } else {
    window.localStorage.removeItem(DEMO_USER_KEY);
  }
}

function findUserByEmail(email: string): DemoUser | undefined {
  return readDemoState().users.find((user) => user.email === email.toLowerCase());
}

function ensureDemoUserState(): DemoState {
  const state = readDemoState();
  if (!state.users.length) {
    const fresh = buildDefaultDemoState();
    writeDemoState(fresh);
    return fresh;
  }
  return state;
}

function setupDemoSession(email: string, user: DemoUser) {
  setDemoUserEmail(email);
  setTokens(`demo-access-${user.id}`, `demo-refresh-${user.id}`);
}

export async function demoApiRequest(path: string, options: any): Promise<any> {
  const state = ensureDemoUserState();
  const method = (options.method ?? "GET").toUpperCase();
  const body = options.body !== undefined && options.body !== null ? options.body : undefined;

  if (path === "/auth/token/") {
    const payload = typeof body === "string" ? JSON.parse(body) : body ?? {};
    const email = String(payload.email ?? "").toLowerCase();
    const password = String(payload.password ?? "");
    const user = state.users.find((entry) => entry.email === email && entry.password === password);
    if (!user) {
      throw new ApiError("Invalid email or password.", 401, { detail: "Invalid email or password." });
    }
    setupDemoSession(email, user);
    return { access: `demo-access-${user.id}`, refresh: `demo-refresh-${user.id}` };
  }

  if (path === "/auth/register/") {
    const payload = typeof body === "string" ? JSON.parse(body) : body ?? {};
    const email = String(payload.email ?? "").toLowerCase();
    const store = payload.store ?? {};
    const existing = findUserByEmail(email);
    if (existing) {
      setupDemoSession(email, existing);
      return {
        id: existing.id,
        email: existing.email,
        phone: existing.phone,
        created_at: existing.created_at,
        store: existing.store,
      };
    }

    const newUser: DemoUser = {
      id: Date.now(),
      email,
      password: String(payload.password ?? "demo123"),
      phone: String(payload.phone ?? "+254700000000"),
      created_at: new Date().toISOString(),
      store: {
        id: Date.now() + 1,
        name: store.name ?? "Demo Store",
        town: store.town ?? "Nairobi",
        county: store.county ?? "Nairobi County",
        till: store.till ?? "123456",
        attendant_phone: store.attendant_phone ?? "+254700000000",
        open: true,
        onboarded: true,
      },
    };

    const next = readDemoState();
    next.users.push(newUser);
    writeDemoState(next);
    setupDemoSession(email, newUser);
    return {
      id: newUser.id,
      email: newUser.email,
      phone: newUser.phone,
      created_at: newUser.created_at,
      store: newUser.store,
    };
  }

  if (path === "/auth/me/") {
    const email = getDemoUserEmail();
    if (!email) {
      throw new ApiError("Not authenticated.", 401, { detail: "Not authenticated." });
    }
    const user = findUserByEmail(email);
    if (!user) {
      throw new ApiError("User not found.", 404, { detail: "User not found." });
    }
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      created_at: user.created_at,
      store: user.store,
    };
  }

  if (path === "/store/") {
    const email = getDemoUserEmail();
    const user = email ? findUserByEmail(email) : undefined;
    if (!user) {
      throw new ApiError("Store not found.", 404, { detail: "Store not found." });
    }

    if (method === "PATCH") {
      const payload = typeof body === "string" ? JSON.parse(body) : body ?? {};
      const nextUser = { ...user, store: { ...user.store, ...payload, attendant_phone: payload.attendant_phone ?? user.store?.attendant_phone ?? "" } };
      const next = readDemoState();
      next.users = next.users.map((entry) => (entry.id === user.id ? nextUser : entry));
      writeDemoState(next);
      return {
        id: nextUser.store?.id ?? 1,
        name: nextUser.store?.name ?? "",
        town: nextUser.store?.town ?? "",
        county: nextUser.store?.county ?? "",
        till: nextUser.store?.till ?? "",
        attendant_phone: nextUser.store?.attendant_phone ?? "",
        open: nextUser.store?.open ?? true,
        onboarded: nextUser.store?.onboarded ?? false,
      };
    }

    return {
      id: user.store?.id ?? 1,
      name: user.store?.name ?? "",
      town: user.store?.town ?? "",
      county: user.store?.county ?? "",
      till: user.store?.till ?? "",
      attendant_phone: user.store?.attendant_phone ?? "",
      open: user.store?.open ?? true,
      onboarded: user.store?.onboarded ?? false,
    };
  }

  if (path === "/products/") {
    const next = readDemoState();
    if (method === "GET") return next.products;
    if (method === "POST") {
      const payload = typeof body === "string" ? JSON.parse(body) : body ?? {};
      const created = {
        id: Date.now(),
        name: payload.name ?? "Demo Product",
        category: payload.category ?? "General",
        description: payload.description ?? "",
        price: String(payload.price ?? 0),
        stock: Number(payload.stock ?? 0),
        expiry: payload.expiry ?? null,
        image_emoji: payload.image_emoji ?? "📦",
        image: payload.image ?? null,
        active: payload.active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      next.products.unshift(created);
      writeDemoState(next);
      return created;
    }
    if (method === "PATCH") {
      const payload = typeof body === "string" ? JSON.parse(body) : body ?? {};
      const productId = Number(path.split("/").filter(Boolean)[1] ?? 0);
      next.products = next.products.map((product) =>
        product.id === productId ? { ...product, ...payload, updated_at: new Date().toISOString() } : product,
      );
      writeDemoState(next);
      return next.products.find((item) => item.id === productId) ?? payload;
    }
    if (method === "DELETE") {
      const productId = Number(path.split("/").filter(Boolean)[1] ?? 0);
      next.products = next.products.filter((product) => product.id !== productId);
      writeDemoState(next);
      return { success: true };
    }
  }

  if (path === "/products/import/") {
    return { created: 0, products: [] };
  }

  if (path.startsWith("/products/") && path.endsWith("/toggle/")) {
    const next = readDemoState();
    const productId = Number(path.split("/").filter(Boolean)[1] ?? 0);
    next.products = next.products.map((product) =>
      product.id === productId ? { ...product, active: !product.active, updated_at: new Date().toISOString() } : product,
    );
    writeDemoState(next);
    return next.products.find((item) => item.id === productId) ?? null;
  }

  if (path === "/customers/") {
    return readDemoState().customers;
  }

  if (path.startsWith("/customers/") && method === "PATCH") {
    return { ok: true };
  }

  if (path === "/orders/") {
    const next = readDemoState();
    return next.orders;
  }

  if (path.startsWith("/orders/") && method === "PATCH") {
    const id = Number(path.split("/").filter(Boolean)[1] ?? 0);
    const next = readDemoState();
    next.orders = next.orders.map((order) =>
      order.id === id ? { ...order, status: "Completed", payment_status: "paid" } : order,
    );
    writeDemoState(next);
    return next.orders.find((item) => item.id === id) ?? { id };
  }

  if (path === "/threads/") {
    return readDemoState().threads;
  }

  if (path.startsWith("/threads/") && path.endsWith("/messages/")) {
    const payload = typeof body === "string" ? JSON.parse(body) : body ?? {};
    const threadId = Number(path.split("/").filter(Boolean)[1] ?? 0);
    const next = readDemoState();
    const thread = next.threads.find((item) => item.id === threadId);
    if (!thread) return { ok: true };
    thread.messages.push({ id: Date.now(), sender: "store", text: payload.text ?? "Hello" });
    thread.last_message = payload.text ?? "Hello";
    writeDemoState(next);
    return { ok: true };
  }

  if (path === "/analytics/weekly-sales/") {
    return [
      { week: "2026-W01", Fertilizer: 24000, Seeds: 38000, "Vet Supplies": 15000, Pesticides: 12000 },
      { week: "2026-W02", Fertilizer: 26000, Seeds: 43000, "Vet Supplies": 18000, Pesticides: 16500 },
    ];
  }

  if (path === "/analytics/app-visits/") {
    return { total_visits: 248, today: 38, change: 18.2 };
  }

  if (path === "/payments/charge/") {
    return {
      reference: `demo-${Date.now()}`,
      display_text: "Demo payment charge created successfully.",
      data: { id: "demo-charge" },
    };
  }

  if (path === "/store/create-subaccount/") {
    return { subaccount_code: "SB_DEMO_101" };
  }

  if (path === "/auth/token/refresh/") {
    return { access: `demo-access-refresh-${Date.now()}` };
  }

  if (path === "/auth/logout/") {
    clearTokens();
    setDemoUserEmail(null);
    return { ok: true };
  }

  return { ok: true };
}

export function isSupabaseTemporaryBackendEnabled(): boolean {
  return import.meta.env.VITE_USE_SUPABASE === "true" || Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}
