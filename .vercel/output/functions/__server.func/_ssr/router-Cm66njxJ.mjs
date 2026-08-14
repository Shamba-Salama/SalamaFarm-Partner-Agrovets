import { i as __toESM } from "../_runtime.mjs";
import { a as messageFromUnknown, i as getRefreshToken, n as clearTokens, o as setTokens, r as getAccessToken, t as ApiError } from "./auth-storage-CRdHlSbd.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as createRootRouteWithContext, b as useRouter, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, v as Link, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-Cm66njxJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var styles_default = "/assets/styles-L_ZY4x7N.css";
var DEMO_STORAGE_KEY = "salamafarm_demo_backend_v1";
var DEMO_USER_KEY = "salamafarm_demo_user_email";
function readDemoState() {
	if (typeof window === "undefined") return buildDefaultDemoState();
	try {
		const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
		if (!raw) {
			const initial = buildDefaultDemoState();
			window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(initial));
			return initial;
		}
		return JSON.parse(raw);
	} catch {
		const initial = buildDefaultDemoState();
		window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(initial));
		return initial;
	}
}
function writeDemoState(state) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
}
function buildDefaultDemoState() {
	const now = (/* @__PURE__ */ new Date()).toISOString();
	return {
		users: [{
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
				onboarded: true
			}
		}],
		products: [{
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
			updated_at: now
		}, {
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
			updated_at: now
		}],
		orders: [{
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
			created_at: now
		}, {
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
			created_at: now
		}],
		customers: [{
			id: 1,
			name: "Lucy Wanjiku",
			phone: "+254700111222",
			last_order: now
		}, {
			id: 2,
			name: "David Otieno",
			phone: "+254712998877",
			last_order: now
		}],
		threads: [{
			id: 1,
			customer_name: "Lucy Wanjiku",
			customer_phone: "+254700111222",
			unread: 1,
			last_message: "Thanks, I am picking up the order today.",
			messages: [{
				id: 1,
				sender: "customer",
				text: "Hi, do you still have maize seeds?"
			}, {
				id: 2,
				sender: "store",
				text: "Yes, we do. We can reserve it for you."
			}]
		}]
	};
}
function getDemoUserEmail() {
	if (typeof window === "undefined") return null;
	return window.localStorage.getItem(DEMO_USER_KEY);
}
function setDemoUserEmail(email) {
	if (typeof window === "undefined") return;
	if (email) window.localStorage.setItem(DEMO_USER_KEY, email);
	else window.localStorage.removeItem(DEMO_USER_KEY);
}
function findUserByEmail(email) {
	return readDemoState().users.find((user) => user.email === email.toLowerCase());
}
function ensureDemoUserState() {
	const state = readDemoState();
	if (!state.users.length) {
		const fresh = buildDefaultDemoState();
		writeDemoState(fresh);
		return fresh;
	}
	return state;
}
function setupDemoSession(email, user) {
	setDemoUserEmail(email);
	setTokens(`demo-access-${user.id}`, `demo-refresh-${user.id}`);
}
async function demoApiRequest(path, options) {
	const state = ensureDemoUserState();
	const method = (options.method ?? "GET").toUpperCase();
	const body = options.body !== void 0 && options.body !== null ? options.body : void 0;
	if (path === "/auth/token/") {
		const payload = typeof body === "string" ? JSON.parse(body) : body ?? {};
		const email = String(payload.email ?? "").toLowerCase();
		const password = String(payload.password ?? "");
		const user = state.users.find((entry) => entry.email === email && entry.password === password);
		if (!user) throw new ApiError("Invalid email or password.", 401, { detail: "Invalid email or password." });
		setupDemoSession(email, user);
		return {
			access: `demo-access-${user.id}`,
			refresh: `demo-refresh-${user.id}`
		};
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
				store: existing.store
			};
		}
		const newUser = {
			id: Date.now(),
			email,
			password: String(payload.password ?? "demo123"),
			phone: String(payload.phone ?? "+254700000000"),
			created_at: (/* @__PURE__ */ new Date()).toISOString(),
			store: {
				id: Date.now() + 1,
				name: store.name ?? "Demo Store",
				town: store.town ?? "Nairobi",
				county: store.county ?? "Nairobi County",
				till: store.till ?? "123456",
				attendant_phone: store.attendant_phone ?? "+254700000000",
				open: true,
				onboarded: true
			}
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
			store: newUser.store
		};
	}
	if (path === "/auth/me/") {
		const email = getDemoUserEmail();
		if (!email) throw new ApiError("Not authenticated.", 401, { detail: "Not authenticated." });
		const user = findUserByEmail(email);
		if (!user) throw new ApiError("User not found.", 404, { detail: "User not found." });
		return {
			id: user.id,
			email: user.email,
			phone: user.phone,
			created_at: user.created_at,
			store: user.store
		};
	}
	if (path === "/store/") {
		const email = getDemoUserEmail();
		const user = email ? findUserByEmail(email) : void 0;
		if (!user) throw new ApiError("Store not found.", 404, { detail: "Store not found." });
		if (method === "PATCH") {
			const payload = typeof body === "string" ? JSON.parse(body) : body ?? {};
			const nextUser = {
				...user,
				store: {
					...user.store,
					...payload,
					attendant_phone: payload.attendant_phone ?? user.store?.attendant_phone ?? ""
				}
			};
			const next = readDemoState();
			next.users = next.users.map((entry) => entry.id === user.id ? nextUser : entry);
			writeDemoState(next);
			return {
				id: nextUser.store?.id ?? 1,
				name: nextUser.store?.name ?? "",
				town: nextUser.store?.town ?? "",
				county: nextUser.store?.county ?? "",
				till: nextUser.store?.till ?? "",
				attendant_phone: nextUser.store?.attendant_phone ?? "",
				open: nextUser.store?.open ?? true,
				onboarded: nextUser.store?.onboarded ?? false
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
			onboarded: user.store?.onboarded ?? false
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
				created_at: (/* @__PURE__ */ new Date()).toISOString(),
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			};
			next.products.unshift(created);
			writeDemoState(next);
			return created;
		}
		if (method === "PATCH") {
			const payload = typeof body === "string" ? JSON.parse(body) : body ?? {};
			const productId = Number(path.split("/").filter(Boolean)[1] ?? 0);
			next.products = next.products.map((product) => product.id === productId ? {
				...product,
				...payload,
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			} : product);
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
	if (path === "/products/import/") return {
		created: 0,
		products: []
	};
	if (path.startsWith("/products/") && path.endsWith("/toggle/")) {
		const next = readDemoState();
		const productId = Number(path.split("/").filter(Boolean)[1] ?? 0);
		next.products = next.products.map((product) => product.id === productId ? {
			...product,
			active: !product.active,
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		} : product);
		writeDemoState(next);
		return next.products.find((item) => item.id === productId) ?? null;
	}
	if (path === "/customers/") return readDemoState().customers;
	if (path.startsWith("/customers/") && method === "PATCH") return { ok: true };
	if (path === "/orders/") return readDemoState().orders;
	if (path.startsWith("/orders/") && method === "PATCH") {
		const id = Number(path.split("/").filter(Boolean)[1] ?? 0);
		const next = readDemoState();
		next.orders = next.orders.map((order) => order.id === id ? {
			...order,
			status: "Completed",
			payment_status: "paid"
		} : order);
		writeDemoState(next);
		return next.orders.find((item) => item.id === id) ?? { id };
	}
	if (path === "/threads/") return readDemoState().threads;
	if (path.startsWith("/threads/") && path.endsWith("/messages/")) {
		const payload = typeof body === "string" ? JSON.parse(body) : body ?? {};
		const threadId = Number(path.split("/").filter(Boolean)[1] ?? 0);
		const next = readDemoState();
		const thread = next.threads.find((item) => item.id === threadId);
		if (!thread) return { ok: true };
		thread.messages.push({
			id: Date.now(),
			sender: "store",
			text: payload.text ?? "Hello"
		});
		thread.last_message = payload.text ?? "Hello";
		writeDemoState(next);
		return { ok: true };
	}
	if (path === "/analytics/weekly-sales/") return [{
		week: "2026-W01",
		Fertilizer: 24e3,
		Seeds: 38e3,
		"Vet Supplies": 15e3,
		Pesticides: 12e3
	}, {
		week: "2026-W02",
		Fertilizer: 26e3,
		Seeds: 43e3,
		"Vet Supplies": 18e3,
		Pesticides: 16500
	}];
	if (path === "/analytics/app-visits/") return {
		total_visits: 248,
		today: 38,
		change: 18.2
	};
	if (path === "/payments/charge/") return {
		reference: `demo-${Date.now()}`,
		display_text: "Demo payment charge created successfully.",
		data: { id: "demo-charge" }
	};
	if (path === "/store/create-subaccount/") return { subaccount_code: "SB_DEMO_101" };
	if (path === "/auth/token/refresh/") return { access: `demo-access-refresh-${Date.now()}` };
	if (path === "/auth/logout/") {
		clearTokens();
		setDemoUserEmail(null);
		return { ok: true };
	}
	return { ok: true };
}
function isSupabaseTemporaryBackendEnabled() {
	return true;
}
var DEFAULT_BASE = "http://127.0.0.1:8000/api/v1";
function getApiBaseUrl() {
	return "http://127.0.0.1:8000/api/v1".replace(/\/$/, "") || DEFAULT_BASE;
}
var loggedBackend = false;
function logBackendOnce() {
	if (loggedBackend || typeof console === "undefined") return;
	loggedBackend = true;
	if (isSupabaseTemporaryBackendEnabled()) console.info("[api] Using the Supabase adapter (VITE_USE_SUPABASE).");
	else console.info(`[api] Using Django at ${getApiBaseUrl()}. Set VITE_USE_SUPABASE=true in .env.local and restart Vite to use Supabase.`);
}
var unauthorizedHandler = null;
var refreshInFlight = null;
/** Register logout/redirect when refresh fails (set by AuthProvider). */
function setUnauthorizedHandler(handler) {
	unauthorizedHandler = handler;
}
async function parseBody(res) {
	const text = await res.text();
	if (!text) return null;
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}
async function tryRefreshAccessToken() {
	if (refreshInFlight) return refreshInFlight;
	refreshInFlight = (async () => {
		const refresh = getRefreshToken();
		if (!refresh) return false;
		try {
			const res = await fetch(`${getApiBaseUrl()}/auth/token/refresh/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				},
				body: JSON.stringify({ refresh })
			});
			const data = await parseBody(res);
			if (!res.ok || !data?.access) {
				clearTokens();
				return false;
			}
			const currentRefresh = getRefreshToken() ?? refresh;
			setTokens(data.access, currentRefresh);
			return true;
		} catch {
			clearTokens();
			return false;
		} finally {
			refreshInFlight = null;
		}
	})();
	return refreshInFlight;
}
async function supabaseApiRequest(path, options) {
	const { supabaseRegister, supabaseLogin, supabaseGetMe, supabaseGetStore, supabasePatchStore, supabaseGetProducts, supabaseCreateProduct, supabaseGetOrders, supabaseGetThreads, supabaseLogout } = await import("./supabase-adapter-FTQS1CAj.mjs");
	const method = (options.method ?? "GET").toUpperCase();
	const body = options.body;
	if (path === "/auth/register/" && method === "POST") return await supabaseRegister(body);
	if (path === "/auth/token/" && method === "POST") {
		const payload = typeof body === "string" ? JSON.parse(body) : body;
		return await supabaseLogin(payload.email, payload.password);
	}
	if (path === "/auth/me/" && method === "GET") return await supabaseGetMe();
	if (path === "/auth/logout/" && method === "POST") {
		await supabaseLogout();
		return { ok: true };
	}
	if (path === "/store/" && method === "GET") return await supabaseGetStore();
	if (path === "/store/" && method === "PATCH") return await supabasePatchStore(body ?? {});
	if (path === "/products/" && method === "GET") return await supabaseGetProducts();
	if (path === "/products/" && method === "POST") return await supabaseCreateProduct(typeof body === "string" ? JSON.parse(body) : body);
	if (path === "/orders/" && method === "GET") return await supabaseGetOrders();
	if (path === "/threads/" && method === "GET") return await supabaseGetThreads();
	return await demoApiRequest(path, options);
}
async function apiRequest(path, options = {}) {
	logBackendOnce();
	if (isSupabaseTemporaryBackendEnabled()) try {
		return await supabaseApiRequest(path, options);
	} catch (error) {
		if (error instanceof ApiError) throw error;
		throw new ApiError(messageFromUnknown(error) || "Backend request failed.", 500, error);
	}
	const { method = "GET", body, auth = true, headers = {}, skipRefresh = false } = options;
	const url = path.startsWith("http") ? path : `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
	const reqHeaders = {
		Accept: "application/json",
		...headers
	};
	let payload;
	if (body !== void 0 && body !== null) if (body instanceof FormData) payload = body;
	else {
		reqHeaders["Content-Type"] = "application/json";
		payload = JSON.stringify(body);
	}
	if (auth) {
		const token = getAccessToken();
		if (token) reqHeaders.Authorization = `Bearer ${token}`;
	}
	let res;
	try {
		res = await fetch(url, {
			method,
			headers: reqHeaders,
			body: payload
		});
	} catch (error) {
		throw new ApiError(`Could not reach API at ${url}: ${messageFromUnknown(error) || "network error"}`, 0, error);
	}
	if (res.status === 401 && auth && !skipRefresh) {
		if (await tryRefreshAccessToken()) return apiRequest(path, {
			...options,
			skipRefresh: true
		});
		clearTokens();
		unauthorizedHandler?.();
		const errBody = await parseBody(res);
		throw new ApiError("Session expired. Please log in again.", 401, errBody);
	}
	const parsed = await parseBody(res);
	if (!res.ok) {
		const detail = typeof parsed === "object" && parsed && "detail" in parsed && typeof parsed.detail === "string" ? parsed.detail : `Request failed (${res.status})`;
		throw new ApiError(detail, res.status, parsed);
	}
	return parsed;
}
var api = {
	get: (path, opts) => apiRequest(path, {
		...opts,
		method: "GET"
	}),
	post: (path, body, opts) => apiRequest(path, {
		...opts,
		method: "POST",
		body
	}),
	patch: (path, body, opts) => apiRequest(path, {
		...opts,
		method: "PATCH",
		body
	}),
	delete: (path, opts) => apiRequest(path, {
		...opts,
		method: "DELETE"
	})
};
var emptyStoreProfile = () => ({
	name: "",
	town: "",
	county: "",
	till: "",
	attendantPhone: "",
	latitude: null,
	longitude: null,
	paystackSubaccountCode: "",
	open: true,
	onboarded: false
});
function apiStoreToProfile(store) {
	return {
		name: store.name ?? "",
		town: store.town ?? "",
		county: store.county ?? "",
		till: store.till ?? "",
		attendantPhone: store.attendant_phone ?? "",
		latitude: store.latitude ?? null,
		longitude: store.longitude ?? null,
		paystackSubaccountCode: store.paystack_subaccount_code ?? "",
		open: Boolean(store.open),
		onboarded: Boolean(store.onboarded)
	};
}
function profilePatchToBody(patch) {
	const body = {};
	if (patch.name !== void 0) body.name = patch.name;
	if (patch.town !== void 0) body.town = patch.town;
	if (patch.county !== void 0) body.county = patch.county;
	if (patch.till !== void 0) body.till = patch.till;
	if (patch.attendantPhone !== void 0) body.attendant_phone = patch.attendantPhone;
	if (patch.latitude !== void 0) body.latitude = patch.latitude;
	if (patch.longitude !== void 0) body.longitude = patch.longitude;
	if (patch.open !== void 0) body.open = patch.open;
	if (patch.onboarded !== void 0) body.onboarded = patch.onboarded;
	return body;
}
async function fetchStore() {
	return api.get("/store/");
}
async function patchStore(patch) {
	return api.patch("/store/", profilePatchToBody(patch));
}
function apiProductToProduct(p) {
	return {
		id: String(p.id),
		name: p.name ?? "",
		category: p.category,
		description: p.description ?? "",
		price: Number(p.price),
		stock: Number(p.stock),
		expiry: p.expiry ?? null,
		image: p.image_emoji || "📦",
		imageUrl: p.image ?? null,
		active: Boolean(p.active)
	};
}
function productToApiBody(p) {
	const expiry = p.expiry && String(p.expiry).trim() ? String(p.expiry).trim() : null;
	return {
		name: p.name,
		category: p.category,
		description: p.description,
		price: p.price,
		stock: p.stock,
		expiry,
		image_emoji: p.image,
		active: p.active
	};
}
function productToFormData(p) {
	const form = new FormData();
	const body = productToApiBody(p);
	for (const [key, value] of Object.entries(body)) {
		if (value === null || value === void 0) continue;
		if (typeof value === "boolean") form.append(key, value ? "true" : "false");
		else form.append(key, String(value));
	}
	if (p.imageFile) form.append("image", p.imageFile, p.imageFile.name);
	return form;
}
function unwrapProductList(data) {
	if (Array.isArray(data)) return data;
	if (data && typeof data === "object" && Array.isArray(data.results)) return data.results;
	return [];
}
async function fetchProducts() {
	return unwrapProductList(await api.get("/products/"));
}
async function createProduct(p) {
	if (p.imageFile) return api.post("/products/", productToFormData(p));
	return api.post("/products/", productToApiBody(p));
}
async function updateProduct(id, p) {
	if (p.imageFile) return api.patch(`/products/${id}/`, productToFormData(p));
	return api.patch(`/products/${id}/`, productToApiBody(p));
}
async function deleteProductApi(id) {
	await api.delete(`/products/${id}/`);
}
async function toggleProductActive(id) {
	return api.post(`/products/${id}/toggle/`);
}
async function importProductsCsv(file) {
	const form = new FormData();
	form.append("file", file);
	return api.post("/products/import/", form);
}
/** Integer cents helpers — avoid float money strings that fail DRF decimal_places=2. */
var cents = (n) => Math.round(n * 100);
var money = (centsValue) => (centsValue / 100).toFixed(2);
function apiOrderToOrder(o) {
	return {
		id: String(o.id),
		customer: o.customer?.name ?? "",
		customerId: String(o.customer?.id ?? ""),
		phone: o.phone ?? o.customer?.phone ?? "",
		product: o.product ?? "",
		items: (o.items ?? []).map((i) => ({
			name: i.name,
			qty: Number(i.qty),
			price: Number(i.price)
		})),
		date: o.date,
		time: o.time,
		mpesaCode: o.mpesa_code ?? "",
		amount: Number(o.amount),
		status: o.status,
		channel: o.channel,
		orderType: o.order_type,
		pickup: o.pickup,
		paidAt: o.paid_at ?? null
	};
}
function apiCustomerToCustomer(c) {
	return {
		id: String(c.id),
		name: c.name ?? "",
		phone: c.phone ?? ""
	};
}
function unwrapList$2(data) {
	if (Array.isArray(data)) return data;
	if (data && typeof data === "object" && Array.isArray(data.results)) return data.results;
	return [];
}
/** Build create body with amount == sum of item cents as fixed 2-decimal strings. */
function buildCounterOrderBody(input) {
	const qty = input.qty ?? 1;
	const unitCents = cents(input.productPrice);
	const lineCents = unitCents * qty;
	return {
		customer: {
			name: input.customerName?.trim() || "Counter Customer",
			phone: input.phone
		},
		items: [{
			product_id: input.productId,
			qty,
			price: money(unitCents)
		}],
		amount: money(lineCents),
		status: "Pending",
		mpesa_code: "",
		channel: input.channel,
		order_type: "Counter Pickup",
		pickup: "Unmatched"
	};
}
async function fetchCustomers() {
	return unwrapList$2(await api.get("/customers/"));
}
async function upsertCustomer(body) {
	return api.post("/customers/", body);
}
async function fetchOrders() {
	return unwrapList$2(await api.get("/orders/"));
}
async function createOrder(body) {
	return api.post("/orders/", body);
}
async function patchOrder(id, patch) {
	return api.patch(`/orders/${id}/`, patch);
}
function unwrapList$1(data) {
	if (Array.isArray(data)) return data;
	if (data && typeof data === "object" && Array.isArray(data.results)) return data.results;
	return [];
}
function apiWeeklySalesRowToRow(r) {
	const num = (key) => Number(r[key] ?? 0) || 0;
	return {
		week: String(r.week ?? ""),
		year: Number(r.year),
		isoWeek: Number(r.iso_week),
		Fertilizer: num("Fertilizer"),
		Seeds: num("Seeds"),
		"Vet Supplies": num("Vet Supplies"),
		Pesticides: num("Pesticides")
	};
}
async function fetchWeeklySales() {
	return unwrapList$1(await api.get("/analytics/weekly-sales/")).map(apiWeeklySalesRowToRow);
}
function apiAppVisitsToStats(raw) {
	return {
		startedCount: Number(raw.started_count) || 0,
		arrivedCount: Number(raw.arrived_count) || 0,
		arrivedToday: Number(raw.arrived_today) || 0,
		arrivedThisWeek: Number(raw.arrived_this_week) || 0
	};
}
async function fetchAppVisits() {
	return apiAppVisitsToStats(await api.get("/analytics/app-visits/"));
}
/**
* Prepare rows for Recharts: keep API sort, cap at 8 most recent weeks,
* rebuild axis labels (include year only when the visible window spans years).
* Does not gap-fill missing weeks.
*/
function prepareWeeklySalesChartRows(rows) {
	const recent = rows.slice(-8);
	const multiYear = new Set(recent.map((r) => r.year)).size > 1;
	return recent.map((r) => ({
		...r,
		week: multiYear ? `Wk ${r.isoWeek} · ${r.year}` : `Wk ${r.isoWeek}`
	}));
}
/**
* Match backend normalize_kenya_msisdn for client validation.
* Returns E.164 (+254…) or null if invalid.
*/
function normalizeKenyaMsisdn(phone) {
	const digits = (phone || "").replace(/\D/g, "");
	if (digits.startsWith("0") && digits.length === 10) return `+254${digits.slice(1)}`;
	if (digits.startsWith("254") && digits.length === 12) return `+${digits}`;
	return null;
}
async function chargeOrder(input) {
	return api.post("/payments/charge/", {
		order_id: Number(input.orderId),
		phone: input.phone
	});
}
/** POST /store/create-subaccount/ with empty body — backend uses MPTILL + store till. */
async function createSubaccount() {
	return api.post("/store/create-subaccount/", {});
}
/** Display time for chat bubbles — HH:MM today, short date otherwise. */
function formatMessageTime(iso) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const now = /* @__PURE__ */ new Date();
	if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) return d.toLocaleTimeString("en-KE", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	});
	return d.toLocaleDateString("en-KE", {
		month: "short",
		day: "numeric"
	});
}
function apiMessageToMessage(m) {
	return {
		id: String(m.id),
		from: m.sender === "farmer" ? "farmer" : "store",
		text: m.text ?? "",
		time: formatMessageTime(m.created_at),
		createdAt: m.created_at
	};
}
function apiThreadToThread(t) {
	const hasMessages = "messages" in t && Array.isArray(t.messages);
	return {
		id: String(t.id),
		farmer: t.customer?.name ?? "",
		customerId: String(t.customer?.id ?? ""),
		phone: t.customer?.phone ?? "",
		channel: t.channel,
		topic: t.topic ?? "",
		unread: Number(t.unread ?? 0),
		lastMessage: t.last_message ? apiMessageToMessage(t.last_message) : null,
		messages: hasMessages ? t.messages.map(apiMessageToMessage) : [],
		messagesLoaded: hasMessages,
		updatedAt: t.updated_at
	};
}
function unwrapList(data) {
	if (Array.isArray(data)) return data;
	if (data && typeof data === "object" && Array.isArray(data.results)) return data.results;
	return [];
}
async function fetchThreads() {
	return unwrapList(await api.get("/threads/"));
}
async function fetchThreadDetail(id) {
	return api.get(`/threads/${id}/`);
}
async function createThread(body) {
	const payload = {
		customer_id: body.customer_id,
		topic: body.topic,
		channel: body.channel
	};
	if (body.message !== void 0 && body.message.trim() !== "") payload.message = body.message.trim();
	return api.post("/threads/", payload);
}
async function postThreadMessage(id, text) {
	return api.post(`/threads/${id}/messages/`, { text });
}
async function markThreadRead(id) {
	return api.post(`/threads/${id}/mark-read/`, {});
}
var CATEGORIES = [
	"Fertilizer",
	"Seeds",
	"Vet Supplies",
	"Pesticides"
];
var FOLLOW_UP_TEMPLATES = [
	{
		id: "pest-7",
		label: "7-Day Pest Control Check",
		body: (c, item) => `Habari ${c}, it has been a week since you bought ${item}. Have the pests reduced on your crop? Reply here if you need a stronger dose or a different product.`
	},
	{
		id: "fert-14",
		label: "14-Day Fertilizer Application Review",
		body: (c, item) => `Hello ${c}, two weeks after applying ${item} — how is the crop colour and growth? We can advise on top dressing timing.`
	},
	{
		id: "vaccine",
		label: "Livestock Vaccine Reminder",
		body: (c, item) => `Hi ${c}, a reminder that the next dose after ${item} is due soon. Shall we reserve a batch for you at the counter?`
	},
	{
		id: "restock",
		label: "Restock & Seasonal Offer",
		body: (c, item) => `Habari ${c}! Planting season is here and ${item} is back in stock at a partner price. Reply to reserve yours.`
	}
];
function daysUntil(dateStr) {
	if (!dateStr || !String(dateStr).trim()) return null;
	const parsed = /* @__PURE__ */ new Date(`${dateStr}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return null;
	const now = /* @__PURE__ */ new Date();
	const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
	return Math.round((parsed.getTime() - todayMs) / 864e5);
}
function stockStatus(p) {
	const d = daysUntil(p.expiry);
	if (d !== null && d < 0) return "Expired";
	if (p.stock < 5) return "Low Stock";
	if (d !== null && d <= 30) return "Clearance";
	return "In Stock";
}
var formatKES = (n) => "KES " + n.toLocaleString("en-KE", { maximumFractionDigits: 0 });
var VAT_RATE = .16;
function playChime() {
	try {
		const Ctor = window.AudioContext ?? window.webkitAudioContext;
		if (!Ctor) return;
		const ctx = new Ctor();
		[880, 1174].forEach((f, i) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "sine";
			osc.frequency.value = f;
			gain.gain.setValueAtTime(1e-4, ctx.currentTime + i * .16);
			gain.gain.exponentialRampToValueAtTime(.18, ctx.currentTime + i * .16 + .02);
			gain.gain.exponentialRampToValueAtTime(1e-4, ctx.currentTime + i * .16 + .3);
			osc.connect(gain).connect(ctx.destination);
			osc.start(ctx.currentTime + i * .16);
			osc.stop(ctx.currentTime + i * .16 + .32);
		});
		setTimeout(() => void ctx.close(), 1200);
	} catch {}
}
function pushNotification(title, body) {
	try {
		if (typeof Notification === "undefined") return;
		if (Notification.permission === "granted") new Notification(title, { body });
	} catch {}
}
var nowTime = () => (/* @__PURE__ */ new Date()).toLocaleTimeString("en-KE", {
	hour: "2-digit",
	minute: "2-digit",
	hour12: false
});
var uid = () => Math.random().toString(36).slice(2, 10);
var PortalContext = (0, import_react.createContext)(null);
function PortalProvider({ children }) {
	const [profile, setProfileState] = (0, import_react.useState)(() => emptyStoreProfile());
	const [storeReady, setStoreReady] = (0, import_react.useState)(false);
	const [products, setProducts] = (0, import_react.useState)([]);
	const [productsReady, setProductsReady] = (0, import_react.useState)(false);
	const [productsLoading, setProductsLoading] = (0, import_react.useState)(false);
	const [orders, setOrders] = (0, import_react.useState)([]);
	const [ordersReady, setOrdersReady] = (0, import_react.useState)(false);
	const [ordersLoading, setOrdersLoading] = (0, import_react.useState)(false);
	const [customers, setCustomers] = (0, import_react.useState)([]);
	const [customersReady, setCustomersReady] = (0, import_react.useState)(false);
	const [customersLoading, setCustomersLoading] = (0, import_react.useState)(false);
	const [weeklySales, setWeeklySales] = (0, import_react.useState)([]);
	const [weeklySalesReady, setWeeklySalesReady] = (0, import_react.useState)(false);
	const [weeklySalesLoading, setWeeklySalesLoading] = (0, import_react.useState)(false);
	const [appVisits, setAppVisits] = (0, import_react.useState)(null);
	const [appVisitsReady, setAppVisitsReady] = (0, import_react.useState)(false);
	const [appVisitsLoading, setAppVisitsLoading] = (0, import_react.useState)(false);
	const [threads, setThreads] = (0, import_react.useState)([]);
	const [threadsReady, setThreadsReady] = (0, import_react.useState)(false);
	const [threadsLoading, setThreadsLoading] = (0, import_react.useState)(false);
	const [newOrderCount, setNewOrderCount] = (0, import_react.useState)(0);
	const [openThreadId, setOpenThreadId] = (0, import_react.useState)(null);
	const [soundOn, setSoundOn] = (0, import_react.useState)(true);
	const chargingOrderIds = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const threadsRef = (0, import_react.useRef)([]);
	threadsRef.current = threads;
	const openThreadIdRef = (0, import_react.useRef)(null);
	openThreadIdRef.current = openThreadId;
	const mapProduct = (0, import_react.useCallback)((raw) => {
		const category = CATEGORIES.includes(raw.category) ? raw.category : "Fertilizer";
		return {
			...raw,
			category
		};
	}, []);
	const mapOrder = (0, import_react.useCallback)((raw) => {
		const channel = raw.channel === "offline-sms" ? "offline-sms" : "in-app";
		const status = raw.status === "Contacted" || raw.status === "Satisfied" ? raw.status : "Pending";
		const orderType = raw.orderType === "Delivery" ? "Delivery" : "Counter Pickup";
		const pickup = raw.pickup === "Collected" || raw.pickup === "Awaiting Pickup" || raw.pickup === "Unmatched" ? raw.pickup : "Unmatched";
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
			paidAt: raw.paidAt ?? null
		};
	}, []);
	const mapThread = (0, import_react.useCallback)((raw) => {
		const channel = raw.channel === "offline-sms" ? "offline-sms" : "in-app";
		return {
			...raw,
			channel
		};
	}, []);
	const sortThreads = (0, import_react.useCallback)((list) => {
		return [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	}, []);
	const mergeThreadList = (0, import_react.useCallback)((fetched, previous) => {
		const prevById = new Map(previous.map((t) => [t.id, t]));
		return sortThreads(fetched.map((next) => {
			const old = prevById.get(next.id);
			if (old?.messagesLoaded) return {
				...next,
				messages: old.messages,
				messagesLoaded: true
			};
			return next;
		}));
	}, [sortThreads]);
	const hydrateProfile = (0, import_react.useCallback)((p) => {
		setProfileState((prev) => ({
			...prev,
			...p
		}));
		setStoreReady(true);
	}, []);
	const resetProfile = (0, import_react.useCallback)(() => {
		setProfileState(emptyStoreProfile());
		setStoreReady(false);
	}, []);
	const refreshStore = (0, import_react.useCallback)(async () => {
		const next = apiStoreToProfile(await fetchStore());
		setProfileState(next);
		setStoreReady(true);
		return next;
	}, []);
	const updateStore = (0, import_react.useCallback)(async (p) => {
		const next = apiStoreToProfile(await patchStore(p));
		setProfileState(next);
		setStoreReady(true);
		return next;
	}, []);
	const toggleStoreOpen = (0, import_react.useCallback)(async () => {
		let previous = true;
		setProfileState((prev) => {
			previous = prev.open;
			return {
				...prev,
				open: !prev.open
			};
		});
		try {
			const next = apiStoreToProfile(await patchStore({ open: !previous }));
			setProfileState(next);
			return next;
		} catch (err) {
			setProfileState((prev) => ({
				...prev,
				open: previous
			}));
			throw err;
		}
	}, []);
	const resetProducts = (0, import_react.useCallback)(() => {
		setProducts([]);
		setProductsReady(false);
		setProductsLoading(false);
	}, []);
	const refreshProducts = (0, import_react.useCallback)(async () => {
		setProductsLoading(true);
		try {
			const next = (await fetchProducts()).map((row) => mapProduct(apiProductToProduct(row)));
			setProducts(next);
			setProductsReady(true);
			return next;
		} finally {
			setProductsLoading(false);
		}
	}, [mapProduct]);
	const createProductEntry = (0, import_react.useCallback)(async (draft) => {
		const created = mapProduct(apiProductToProduct(await createProduct(draft)));
		setProducts((prev) => [created, ...prev]);
		setProductsReady(true);
		return created;
	}, [mapProduct]);
	const updateProductEntry = (0, import_react.useCallback)(async (id, draft) => {
		try {
			const updated = mapProduct(apiProductToProduct(await updateProduct(id, draft)));
			setProducts((prev) => prev.map((p) => p.id === id ? updated : p));
			return updated;
		} catch (err) {
			if (err instanceof ApiError && err.status === 404) {
				await refreshProducts();
				throw new ApiError("This product no longer exists.", 404, err.body);
			}
			throw err;
		}
	}, [mapProduct, refreshProducts]);
	const removeProduct = (0, import_react.useCallback)(async (id) => {
		let removed;
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
			if (removed) setProducts((prev) => {
				if (prev.some((p) => p.id === removed.id)) return prev;
				return [removed, ...prev];
			});
			throw err;
		}
	}, [refreshProducts]);
	const toggleProduct = (0, import_react.useCallback)(async (id) => {
		let previousActive = true;
		setProducts((prev) => prev.map((p) => {
			if (p.id !== id) return p;
			previousActive = p.active;
			return {
				...p,
				active: !p.active
			};
		}));
		try {
			const updated = mapProduct(apiProductToProduct(await toggleProductActive(id)));
			setProducts((prev) => prev.map((p) => p.id === id ? updated : p));
			return updated;
		} catch (err) {
			if (err instanceof ApiError && err.status === 404) {
				await refreshProducts();
				throw new ApiError("This product no longer exists.", 404, err.body);
			}
			setProducts((prev) => prev.map((p) => p.id === id ? {
				...p,
				active: previousActive
			} : p));
			throw err;
		}
	}, [mapProduct, refreshProducts]);
	const importProductsCsvFile = (0, import_react.useCallback)(async (file) => {
		const result = await importProductsCsv(file);
		await refreshProducts();
		return { created: result.created };
	}, [refreshProducts]);
	const resetOrders = (0, import_react.useCallback)(() => {
		setOrders([]);
		setOrdersReady(false);
		setOrdersLoading(false);
	}, []);
	const refreshOrders = (0, import_react.useCallback)(async () => {
		setOrdersLoading(true);
		try {
			const next = (await fetchOrders()).map((row) => mapOrder(apiOrderToOrder(row)));
			setOrders(next);
			setOrdersReady(true);
			return next;
		} finally {
			setOrdersLoading(false);
		}
	}, [mapOrder]);
	const resetCustomers = (0, import_react.useCallback)(() => {
		setCustomers([]);
		setCustomersReady(false);
		setCustomersLoading(false);
	}, []);
	const refreshCustomers = (0, import_react.useCallback)(async () => {
		setCustomersLoading(true);
		try {
			const next = (await fetchCustomers()).map(apiCustomerToCustomer);
			setCustomers(next);
			setCustomersReady(true);
			return next;
		} finally {
			setCustomersLoading(false);
		}
	}, []);
	const createOrderEntry = (0, import_react.useCallback)(async (body) => {
		const created = mapOrder(apiOrderToOrder(await createOrder(body)));
		setOrders((prev) => [created, ...prev]);
		setOrdersReady(true);
		setNewOrderCount((n) => n + 1);
		return created;
	}, [mapOrder]);
	const upsertCustomerEntry = (0, import_react.useCallback)(async (input) => {
		const saved = apiCustomerToCustomer(await upsertCustomer(input));
		setCustomers((prev) => {
			const without = prev.filter((c) => c.id !== saved.id && c.phone !== saved.phone);
			return [saved, ...without];
		});
		setCustomersReady(true);
		return saved;
	}, []);
	const setOrderStatus = (0, import_react.useCallback)(async (id, status) => {
		let previous = "Pending";
		setOrders((prev) => prev.map((o) => {
			if (o.id !== id) return o;
			previous = o.status;
			return {
				...o,
				status
			};
		}));
		try {
			const updated = mapOrder(apiOrderToOrder(await patchOrder(id, { status })));
			setOrders((prev) => prev.map((o) => o.id === id ? updated : o));
			return updated;
		} catch (err) {
			if (err instanceof ApiError && err.status === 404) {
				await refreshOrders();
				throw new ApiError("This order no longer exists.", 404, err.body);
			}
			setOrders((prev) => prev.map((o) => o.id === id ? {
				...o,
				status: previous
			} : o));
			throw err;
		}
	}, [mapOrder, refreshOrders]);
	const setPickup = (0, import_react.useCallback)(async (id, pickup) => {
		let previous = "Unmatched";
		setOrders((prev) => prev.map((o) => {
			if (o.id !== id) return o;
			previous = o.pickup;
			return {
				...o,
				pickup
			};
		}));
		try {
			const updated = mapOrder(apiOrderToOrder(await patchOrder(id, { pickup })));
			setOrders((prev) => prev.map((o) => o.id === id ? updated : o));
			return updated;
		} catch (err) {
			if (err instanceof ApiError && err.status === 404) {
				await refreshOrders();
				throw new ApiError("This order no longer exists.", 404, err.body);
			}
			setOrders((prev) => prev.map((o) => o.id === id ? {
				...o,
				pickup: previous
			} : o));
			throw err;
		}
	}, [mapOrder, refreshOrders]);
	const createCounterOrder = (0, import_react.useCallback)(async (input) => {
		const product = products.find((p) => p.id === input.productId);
		if (!product) throw new ApiError("Select a product from inventory.", 400, null);
		const normalized = input.phone.replace(/\D/g, "").replace(/^0/, "254");
		const channel = orders.find((o) => o.phone === normalized) || customers.find((c) => c.phone === normalized) || threads.find((t) => t.phone === normalized) ? "in-app" : "offline-sms";
		const body = buildCounterOrderBody({
			productId: Number(product.id),
			productPrice: product.price,
			phone: normalized,
			customerName: input.customer,
			channel
		});
		const order = await createOrderEntry(body);
		refreshCustomers().catch(() => void 0);
		return {
			order,
			channel
		};
	}, [
		products,
		orders,
		customers,
		threads,
		createOrderEntry,
		refreshCustomers
	]);
	const chargeCounterOrder = (0, import_react.useCallback)(async (input) => {
		const id = input.orderId;
		if (chargingOrderIds.current.has(id)) throw new ApiError("A charge is already in progress for this order.", 409, null);
		chargingOrderIds.current.add(id);
		try {
			return await chargeOrder({
				orderId: id,
				phone: input.phone
			});
		} finally {
			chargingOrderIds.current.delete(id);
		}
	}, []);
	const createStoreSubaccount = (0, import_react.useCallback)(async () => {
		const res = await createSubaccount();
		const next = apiStoreToProfile(res.store);
		setProfileState(next);
		setStoreReady(true);
		return {
			created: res.created,
			subaccountCode: res.subaccount_code,
			profile: next
		};
	}, []);
	const resetWeeklySales = (0, import_react.useCallback)(() => {
		setWeeklySales([]);
		setWeeklySalesReady(false);
		setWeeklySalesLoading(false);
	}, []);
	const refreshWeeklySales = (0, import_react.useCallback)(async () => {
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
	const resetAppVisits = (0, import_react.useCallback)(() => {
		setAppVisits(null);
		setAppVisitsReady(false);
		setAppVisitsLoading(false);
	}, []);
	const refreshAppVisits = (0, import_react.useCallback)(async () => {
		setAppVisitsLoading(true);
		try {
			const stats = await fetchAppVisits();
			setAppVisits(stats);
			setAppVisitsReady(true);
			return stats;
		} finally {
			setAppVisitsLoading(false);
		}
	}, []);
	const resetThreads = (0, import_react.useCallback)(() => {
		setThreads([]);
		setThreadsReady(false);
		setThreadsLoading(false);
		setOpenThreadId(null);
	}, []);
	const refreshThreads = (0, import_react.useCallback)(async () => {
		setThreadsLoading(true);
		try {
			const list = (await fetchThreads()).map((row) => mapThread(apiThreadToThread(row)));
			setThreads((prev) => mergeThreadList(list, prev));
			setThreadsReady(true);
			return mergeThreadList(list, threadsRef.current);
		} finally {
			setThreadsLoading(false);
		}
	}, [mapThread, mergeThreadList]);
	const markRead = (0, import_react.useCallback)((id) => setThreads((prev) => prev.map((t) => t.id === id ? {
		...t,
		unread: 0
	} : t)), []);
	const openChat = (0, import_react.useCallback)(async (id) => {
		setOpenThreadId(id);
		if (!id) return;
		const current = threadsRef.current.find((t) => t.id === id);
		const previousUnread = current?.unread ?? 0;
		setThreads((prev) => prev.map((t) => t.id === id ? {
			...t,
			unread: 0
		} : t));
		if (!current?.messagesLoaded) try {
			const detail = mapThread(apiThreadToThread(await fetchThreadDetail(id)));
			setThreads((prev) => prev.map((t) => t.id === id ? {
				...detail,
				unread: 0
			} : t));
		} catch (err) {
			console.warn("Failed to load thread messages", err);
		}
		try {
			const res = await markThreadRead(id);
			setThreads((prev) => prev.map((t) => t.id === id ? {
				...t,
				unread: res.unread,
				updatedAt: res.updated_at
			} : t));
		} catch {
			setThreads((prev) => prev.map((t) => t.id === id ? {
				...t,
				unread: previousUnread
			} : t));
		}
	}, [mapThread]);
	const sendMessage = (0, import_react.useCallback)(async (threadId, text) => {
		const trimmed = text.trim();
		if (!trimmed) return;
		const tempId = `tmp-${uid()}`;
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		const optimistic = {
			id: tempId,
			from: "store",
			text: trimmed,
			time: nowTime(),
			createdAt: nowIso
		};
		setThreads((prev) => sortThreads(prev.map((t) => t.id === threadId ? {
			...t,
			messages: [...t.messages, optimistic],
			lastMessage: optimistic,
			updatedAt: nowIso,
			messagesLoaded: true
		} : t)));
		try {
			const res = await postThreadMessage(threadId, trimmed);
			const msg = apiMessageToMessage(res.message);
			setThreads((prev) => sortThreads(prev.map((t) => t.id === threadId ? {
				...t,
				unread: res.thread.unread,
				updatedAt: res.thread.updated_at,
				messages: t.messages.map((m) => m.id === tempId ? msg : m),
				lastMessage: msg,
				messagesLoaded: true
			} : t)));
		} catch (err) {
			setThreads((prev) => prev.map((t) => t.id === threadId ? {
				...t,
				messages: t.messages.filter((m) => m.id !== tempId),
				lastMessage: t.messages.filter((m) => m.id !== tempId).at(-1) ?? t.lastMessage
			} : t));
			if (err instanceof ApiError && err.status === 404) {
				await refreshThreads();
				throw new ApiError("This conversation no longer exists.", 404, err.body);
			}
			throw err;
		}
	}, [refreshThreads, sortThreads]);
	const startThread = (0, import_react.useCallback)(async (input) => {
		let customerId = (input.customerId || "").trim();
		if (!customerId) customerId = (await upsertCustomerEntry({
			name: input.name,
			phone: input.phone
		})).id;
		const digits = (p) => p.replace(/\D/g, "").replace(/^0/, "254");
		const existing = threadsRef.current.find((t) => t.customerId && t.customerId === customerId) || threadsRef.current.find((t) => digits(t.phone) === digits(input.phone));
		if (existing) {
			await sendMessage(existing.id, input.text);
			return threadsRef.current.find((t) => t.id === existing.id) ?? existing;
		}
		const created = mapThread(apiThreadToThread(await createThread({
			customer_id: Number(customerId),
			topic: input.topic,
			channel: input.channel,
			...input.text.trim() ? { message: input.text.trim() } : {}
		})));
		setThreads((prev) => sortThreads([created, ...prev.filter((t) => t.id !== created.id)]));
		setThreadsReady(true);
		return created;
	}, [
		mapThread,
		sendMessage,
		sortThreads,
		upsertCustomerEntry
	]);
	const enablePush = (0, import_react.useCallback)(() => {
		try {
			if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission();
		} catch {}
	}, []);
	const [incoming, setIncoming] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!threadsReady) return;
		const poll = async () => {
			if (!getAccessToken()) return;
			if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
			try {
				const list = (await fetchThreads()).map((row) => mapThread(apiThreadToThread(row)));
				const prev = threadsRef.current;
				const prevById = new Map(prev.map((t) => [t.id, t]));
				const openId = openThreadIdRef.current;
				for (const next of list) {
					const old = prevById.get(next.id);
					const last = next.lastMessage;
					if (last?.from === "farmer" && (!old || old.lastMessage?.id !== last.id || next.unread > (old.unread ?? 0)) && last) {
						setIncoming({
							thread: next,
							text: last.text,
							key: uid()
						});
						break;
					}
				}
				let merged = mergeThreadList(list, prev);
				if (openId) try {
					const detail = mapThread(apiThreadToThread(await fetchThreadDetail(openId)));
					merged = merged.map((t) => t.id === openId ? {
						...detail,
						unread: 0,
						messagesLoaded: true
					} : t);
				} catch (err) {
					console.warn("Open thread refresh failed", err);
				}
				setThreads(merged);
			} catch (err) {
				console.warn("Thread poll failed", err);
			}
		};
		poll();
		const intervalMs = openThreadId ? 3e3 : 8e3;
		const timer = window.setInterval(() => {
			poll();
		}, intervalMs);
		return () => window.clearInterval(timer);
	}, [
		threadsReady,
		mapThread,
		mergeThreadList,
		openThreadId
	]);
	(0, import_react.useEffect)(() => {
		if (!incoming) return;
		if (soundOn) playChime();
		pushNotification(`New inquiry from ${incoming.thread.farmer}`, `${incoming.thread.topic}: ${incoming.text}`);
	}, [incoming, soundOn]);
	const unreadMessages = threads.reduce((s, t) => s + t.unread, 0);
	const value = (0, import_react.useMemo)(() => ({
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
		appVisits,
		appVisitsReady,
		appVisitsLoading,
		refreshAppVisits,
		resetAppVisits,
		setOrderStatus,
		setPickup,
		upsertCustomerEntry,
		newOrderCount,
		clearNewOrders: () => setNewOrderCount(0),
		threads,
		threadsReady,
		threadsLoading,
		refreshThreads,
		resetThreads,
		unreadMessages,
		openThreadId,
		openChat,
		markRead,
		sendMessage,
		startThread,
		lastIncoming: incoming,
		soundOn,
		setSoundOn,
		enablePush
	}), [
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
		appVisits,
		appVisitsReady,
		appVisitsLoading,
		refreshAppVisits,
		resetAppVisits,
		setOrderStatus,
		setPickup,
		upsertCustomerEntry,
		newOrderCount,
		threads,
		threadsReady,
		threadsLoading,
		refreshThreads,
		resetThreads,
		unreadMessages,
		openThreadId,
		openChat,
		markRead,
		sendMessage,
		startThread,
		incoming,
		soundOn,
		enablePush
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortalContext.Provider, {
		value,
		children
	});
}
function usePortal() {
	const ctx = (0, import_react.useContext)(PortalContext);
	if (!ctx) throw new Error("usePortal must be used inside PortalProvider");
	return ctx;
}
var AuthContext = (0, import_react.createContext)(null);
function AuthProvider({ children }) {
	const { refreshStore, resetProfile, hydrateProfile, refreshProducts, resetProducts, refreshOrders, resetOrders, refreshCustomers, resetCustomers, refreshWeeklySales, resetWeeklySales, refreshAppVisits, resetAppVisits, refreshThreads, resetThreads } = usePortal();
	const navigate = useNavigate();
	const [vendor, setVendor] = (0, import_react.useState)(null);
	const [isBootstrapping, setIsBootstrapping] = (0, import_react.useState)(true);
	const loadStoreProfile = (0, import_react.useCallback)(async () => {
		try {
			await refreshStore();
		} catch (err) {
			console.warn("Failed to load store profile", err);
			throw err;
		}
	}, [refreshStore]);
	const loadProducts = (0, import_react.useCallback)(async () => {
		try {
			await refreshProducts();
		} catch (err) {
			console.warn("Failed to load products", err);
		}
	}, [refreshProducts]);
	const loadOrders = (0, import_react.useCallback)(async () => {
		try {
			await refreshOrders();
		} catch (err) {
			console.warn("Failed to load orders", err);
		}
	}, [refreshOrders]);
	const loadCustomers = (0, import_react.useCallback)(async () => {
		try {
			await refreshCustomers();
		} catch (err) {
			console.warn("Failed to load customers", err);
		}
	}, [refreshCustomers]);
	const loadWeeklySales = (0, import_react.useCallback)(async () => {
		try {
			await refreshWeeklySales();
		} catch (err) {
			console.warn("Failed to load weekly sales", err);
		}
	}, [refreshWeeklySales]);
	const loadAppVisits = (0, import_react.useCallback)(async () => {
		try {
			await refreshAppVisits();
		} catch (err) {
			console.warn("Failed to load app visits", err);
		}
	}, [refreshAppVisits]);
	const loadThreads = (0, import_react.useCallback)(async () => {
		try {
			await refreshThreads();
		} catch (err) {
			console.warn("Failed to load threads", err);
		}
	}, [refreshThreads]);
	const logout = (0, import_react.useCallback)(() => {
		clearTokens();
		setVendor(null);
		resetProfile();
		resetProducts();
		resetOrders();
		resetCustomers();
		resetWeeklySales();
		resetAppVisits();
		resetThreads();
		navigate({ to: "/login" });
	}, [
		navigate,
		resetProfile,
		resetProducts,
		resetOrders,
		resetCustomers,
		resetWeeklySales,
		resetAppVisits,
		resetThreads
	]);
	const refreshMe = (0, import_react.useCallback)(async () => {
		if (!getAccessToken()) {
			setVendor(null);
			return null;
		}
		const me = await api.get("/auth/me/");
		setVendor(me);
		try {
			await loadStoreProfile();
		} catch {
			if (me.store) hydrateProfile(apiStoreToProfile({
				id: me.store.id,
				name: me.store.name,
				town: me.store.town,
				county: me.store.county,
				till: me.store.till,
				attendant_phone: me.store.attendant_phone,
				open: me.store.open,
				onboarded: me.store.onboarded
			}));
		}
		await loadProducts();
		await loadOrders();
		await loadCustomers();
		await loadWeeklySales();
		await loadAppVisits();
		await loadThreads();
		return me;
	}, [
		loadStoreProfile,
		hydrateProfile,
		loadProducts,
		loadOrders,
		loadCustomers,
		loadWeeklySales,
		loadAppVisits,
		loadThreads
	]);
	const login = (0, import_react.useCallback)(async (email, password) => {
		try {
			const tokens = await api.post("/auth/token/", {
				email,
				password
			}, { auth: false });
			if (!tokens?.access) throw new ApiError("Login succeeded but no access token was returned.", 500, tokens);
			setTokens(tokens.access, tokens.refresh);
			const me = await api.get("/auth/me/");
			setVendor(me);
			try {
				await loadStoreProfile();
			} catch {
				if (me.store) hydrateProfile(apiStoreToProfile({
					id: me.store.id,
					name: me.store.name,
					town: me.store.town,
					county: me.store.county,
					till: me.store.till,
					attendant_phone: me.store.attendant_phone,
					open: me.store.open,
					onboarded: me.store.onboarded
				}));
			}
			await loadProducts();
			await loadOrders();
			await loadCustomers();
			await loadWeeklySales();
			await loadAppVisits();
			await loadThreads();
			return me;
		} catch (err) {
			console.error("Sign-in failed", err);
			if (err instanceof ApiError) throw err;
			throw new ApiError(messageFromUnknown(err) || "Could not sign in.", 0, err);
		}
	}, [
		loadStoreProfile,
		hydrateProfile,
		loadProducts,
		loadOrders,
		loadCustomers,
		loadWeeklySales,
		loadAppVisits,
		loadThreads
	]);
	const register = (0, import_react.useCallback)(async (input) => {
		try {
			await api.post("/auth/register/", {
				email: input.email,
				password: input.password,
				phone: input.phone || input.store.attendant_phone,
				store: input.store
			}, { auth: false });
			const me = await login(input.email, input.password);
			try {
				const store = await api.patch("/store/", { onboarded: true });
				hydrateProfile(apiStoreToProfile(store));
				const next = {
					...me,
					store: {
						id: store.id,
						name: store.name,
						town: store.town,
						county: store.county,
						till: store.till,
						attendant_phone: store.attendant_phone,
						open: store.open,
						onboarded: store.onboarded
					}
				};
				setVendor(next);
				return next;
			} catch (patchErr) {
				console.warn("Account created but store onboarded flag could not be saved", patchErr);
				return me;
			}
		} catch (err) {
			console.error("Account creation failed", err);
			if (err instanceof ApiError) throw err;
			throw new ApiError(messageFromUnknown(err) || "Could not create account.", 0, err);
		}
	}, [login, hydrateProfile]);
	(0, import_react.useEffect)(() => {
		setUnauthorizedHandler(() => {
			clearTokens();
			setVendor(null);
			resetProfile();
			resetProducts();
			resetOrders();
			resetCustomers();
			resetWeeklySales();
			resetAppVisits();
			resetThreads();
			navigate({ to: "/login" });
		});
		return () => setUnauthorizedHandler(null);
	}, [
		navigate,
		resetProfile,
		resetProducts,
		resetOrders,
		resetCustomers,
		resetWeeklySales,
		resetAppVisits,
		resetThreads
	]);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		(async () => {
			if (!getAccessToken()) {
				if (!cancelled) setIsBootstrapping(false);
				return;
			}
			try {
				await refreshMe();
			} catch (err) {
				if (!cancelled) {
					clearTokens();
					setVendor(null);
					resetProfile();
					resetProducts();
					resetOrders();
					resetCustomers();
					resetWeeklySales();
					resetAppVisits();
					resetThreads();
					if (!(err instanceof ApiError && err.status === 401)) console.warn("Failed to restore session", err);
				}
			} finally {
				if (!cancelled) setIsBootstrapping(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [
		refreshMe,
		resetProfile,
		resetProducts,
		resetOrders,
		resetCustomers,
		resetWeeklySales,
		resetAppVisits,
		resetThreads
	]);
	const value = (0, import_react.useMemo)(() => ({
		vendor,
		isAuthenticated: Boolean(vendor),
		isBootstrapping,
		login,
		register,
		logout,
		refreshMe
	}), [
		vendor,
		isBootstrapping,
		login,
		register,
		logout,
		refreshMe
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthContext.Provider, {
		value,
		children
	});
}
function useAuth() {
	const ctx = (0, import_react.useContext)(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
	return ctx;
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$8 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "SalamaFarm Partner Agrovets" },
			{
				name: "description",
				content: "Vendor portal for SalamaFarm partner agrovets — inventory, M-Pesa sales, messaging, and customer follow-ups."
			},
			{
				name: "author",
				content: "SalamaFarm"
			},
			{
				property: "og:title",
				content: "SalamaFarm Partner Agrovets"
			},
			{
				property: "og:description",
				content: "Vendor portal for SalamaFarm partner agrovets — inventory, M-Pesa sales, messaging, and customer follow-ups."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}, {
			rel: "icon",
			href: "/favicon.png",
			type: "image/png",
			sizes: "any"
		}]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$8.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortalProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
			position: "top-right",
			richColors: true
		})] }) })
	});
}
var $$splitComponentImporter$7 = () => import("./routes-DJEAZgiI.mjs");
var Route$7 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Vendor Dashboard | SalamaFarm Partner Agrovets" },
		{
			name: "description",
			content: "Live revenue, stock alerts, farmer messages and follow-up metrics for your SalamaFarm partner agrovet store."
		},
		{
			property: "og:title",
			content: "Vendor Dashboard | SalamaFarm Partner Agrovets"
		},
		{
			property: "og:description",
			content: "Track sales trends, inventory health and customer follow-ups in one place."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./customers-B4qShHrs.mjs");
var Route$6 = createFileRoute("/customers")({
	head: () => ({ meta: [
		{ title: "Customer Follow-Up Hub | SalamaFarm Partner Agrovets" },
		{
			name: "description",
			content: "Send templated post-purchase follow-ups to farmers in-app or through the SalamaFarm Bulk SMS Gateway."
		},
		{
			property: "og:title",
			content: "Customer Follow-Up Hub | SalamaFarm Partner Agrovets"
		},
		{
			property: "og:description",
			content: "Templated pest, fertilizer and vaccine reminders for every buyer."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./inventory-UrxsK7kY.mjs");
var Route$5 = createFileRoute("/inventory")({
	head: () => ({ meta: [
		{ title: "Product Inventory | SalamaFarm Partner Agrovets" },
		{
			name: "description",
			content: "Add, edit and track agrovet stock levels, expiry dates and prices in KES from one inventory table."
		},
		{
			property: "og:title",
			content: "Product Inventory | SalamaFarm Partner Agrovets"
		},
		{
			property: "og:description",
			content: "Full inventory management for fertilizer, seeds, vet supplies and pesticides."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./login-D_E8Zx2L.mjs");
var Route$4 = createFileRoute("/login")({
	head: () => ({ meta: [{ title: "Sign In | SalamaFarm Partner Portal" }, {
		name: "description",
		content: "Sign in to your SalamaFarm partner agrovet account."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./messages-CWXN5rTe.mjs");
var Route$3 = createFileRoute("/messages")({
	head: () => ({ meta: [
		{ title: "Farmer Messages | SalamaFarm Partner Agrovets" },
		{
			name: "description",
			content: "In-app direct messaging with farmers, with real-time alerts and automatic SMS routing for offline customers."
		},
		{
			property: "og:title",
			content: "Farmer Messages | SalamaFarm Partner Agrovets"
		},
		{
			property: "og:description",
			content: "Reply to crop and livestock inquiries from your counter in real time."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./onboarding-CONbtRqi.mjs");
var Route$2 = createFileRoute("/onboarding")({
	head: () => ({ meta: [
		{ title: "Agrovet Sign Up | SalamaFarm Partner Portal" },
		{
			name: "description",
			content: "Register your agrovet store in one short form — store name, town, county, M-Pesa till and attendant phone. Instant access, no permits required."
		},
		{
			property: "og:title",
			content: "Agrovet Sign Up | SalamaFarm Partner Portal"
		},
		{
			property: "og:description",
			content: "Instant onboarding for Kenyan agrovet stores joining SalamaFarm."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./orders-C1y_N3YE.mjs");
var Route$1 = createFileRoute("/orders")({
	head: () => ({ meta: [
		{ title: "Sales, Orders & M-Pesa Log | SalamaFarm Partner Agrovets" },
		{
			name: "description",
			content: "Match M-Pesa confirmation codes against pickups, download printable VAT receipts and export sales for tax filing."
		},
		{
			property: "og:title",
			content: "Sales, Orders & M-Pesa Log | SalamaFarm"
		},
		{
			property: "og:description",
			content: "Counter reconciliation, PDF receipts and accounting exports for your agrovet."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./settings-BRdCGTeY.mjs");
var Route = createFileRoute("/settings")({
	head: () => ({ meta: [{ title: "Store Settings | SalamaFarm Partner Portal" }, {
		name: "description",
		content: "Update your agrovet store name, location, till number, and attendant phone."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var rootRouteChildren = {
	IndexRoute: Route$7.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$8
	}),
	CustomersRoute: Route$6.update({
		id: "/customers",
		path: "/customers",
		getParentRoute: () => Route$8
	}),
	InventoryRoute: Route$5.update({
		id: "/inventory",
		path: "/inventory",
		getParentRoute: () => Route$8
	}),
	LoginRoute: Route$4.update({
		id: "/login",
		path: "/login",
		getParentRoute: () => Route$8
	}),
	MessagesRoute: Route$3.update({
		id: "/messages",
		path: "/messages",
		getParentRoute: () => Route$8
	}),
	OnboardingRoute: Route$2.update({
		id: "/onboarding",
		path: "/onboarding",
		getParentRoute: () => Route$8
	}),
	OrdersRoute: Route$1.update({
		id: "/orders",
		path: "/orders",
		getParentRoute: () => Route$8
	}),
	SettingsRoute: Route.update({
		id: "/settings",
		path: "/settings",
		getParentRoute: () => Route$8
	})
};
var routeTree = Route$8._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { VAT_RATE as a, stockStatus as c, prepareWeeklySalesChartRows as d, FOLLOW_UP_TEMPLATES as i, usePortal as l, useAuth as n, daysUntil as o, CATEGORIES as r, formatKES as s, router_exports as t, normalizeKenyaMsisdn as u };
