import { a as messageFromUnknown, n as clearTokens, o as setTokens, t as ApiError } from "./auth-storage-CRdHlSbd.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/supabase-adapter-FTQS1CAj.js
var client = null;
function getSupabase() {
	if (client) return client;
	client = createClient("https://gkroepnnxkvyayavvaij.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrcm9lcG5ueGt2eWF5YXZ2YWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMDE4NTMsImV4cCI6MjEwMTg3Nzg1M30.BqB8rX7MmYFk3eVa1UOh2JiIoJGXcCziBWHq_28RjTk");
	return client;
}
/**
* Real Supabase adapter that writes to the actual database.
* Replaces the temporary demo backend.
*/
function fail(error, fallback, status) {
	throw new ApiError(messageFromUnknown(error) || fallback, status, error);
}
async function supabaseRegister(payload) {
	const supabase = getSupabase();
	try {
		const { data: authData, error: authError } = await supabase.auth.signUp({
			email: payload.email,
			password: payload.password
		});
		if (authError) throw authError;
		if (!authData.user) throw new Error("User account not created");
		const { error: storeError } = await supabase.from("stores").insert([{
			owner_id: authData.user.id,
			name: payload.store?.name ?? "My Store",
			town: payload.store?.town ?? "",
			county: payload.store?.county ?? "",
			till: payload.store?.till ?? "",
			attendant_phone: payload.store?.attendant_phone ?? payload.phone ?? "",
			open: true,
			onboarded: false
		}]);
		if (storeError) throw storeError;
		return { ok: true };
	} catch (error) {
		fail(error, "Registration failed", 400);
	}
}
async function supabaseLogin(email, password) {
	const supabase = getSupabase();
	try {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});
		if (error) throw error;
		if (!data.session?.access_token) throw new Error("No session");
		setTokens(data.session.access_token, data.session.refresh_token ?? "");
		return {
			access: data.session.access_token,
			refresh: data.session.refresh_token ?? ""
		};
	} catch (error) {
		clearTokens();
		fail(error, "Login failed", 401);
	}
}
async function supabaseGetMe() {
	const supabase = getSupabase();
	try {
		const { data: userData, error } = await supabase.auth.getUser();
		if (error || !userData.user) throw error ?? /* @__PURE__ */ new Error("Not authenticated");
		const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userData.user.id).maybeSingle();
		if (profileError) throw profileError;
		const { data: store, error: storeError } = await supabase.from("stores").select("*").eq("owner_id", userData.user.id).maybeSingle();
		if (storeError) throw storeError;
		return {
			id: userData.user.id,
			email: profile?.email ?? userData.user.email ?? "",
			phone: profile?.phone ?? "",
			created_at: profile?.created_at ?? userData.user.created_at,
			store
		};
	} catch (error) {
		fail(error, "Failed to fetch user", 500);
	}
}
async function supabaseGetStore() {
	const supabase = getSupabase();
	try {
		const { data: userData, error: userError } = await supabase.auth.getUser();
		if (userError || !userData.user) throw userError ?? /* @__PURE__ */ new Error("Not authenticated");
		const { data, error } = await supabase.from("stores").select("*").eq("owner_id", userData.user.id).maybeSingle();
		if (error) throw error;
		return data;
	} catch (error) {
		fail(error, "Failed to fetch store", 500);
	}
}
async function supabasePatchStore(patch) {
	const supabase = getSupabase();
	try {
		const { data: userData, error: userError } = await supabase.auth.getUser();
		if (userError || !userData.user) throw userError ?? /* @__PURE__ */ new Error("Not authenticated");
		const { data, error } = await supabase.from("stores").update(patch).eq("owner_id", userData.user.id).select().maybeSingle();
		if (error) throw error;
		return data;
	} catch (error) {
		fail(error, "Failed to update store", 500);
	}
}
async function supabaseGetProducts() {
	const supabase = getSupabase();
	try {
		const { data: userData, error: userError } = await supabase.auth.getUser();
		if (userError || !userData.user) throw userError ?? /* @__PURE__ */ new Error("Not authenticated");
		const { data: store, error: storeError } = await supabase.from("stores").select("id").eq("owner_id", userData.user.id).maybeSingle();
		if (storeError || !store) throw storeError ?? /* @__PURE__ */ new Error("Store not found");
		const { data, error } = await supabase.from("products").select("*").eq("store_id", store.id).order("created_at", { ascending: false });
		if (error) throw error;
		return data ?? [];
	} catch (error) {
		fail(error, "Failed to fetch products", 500);
	}
}
async function supabaseCreateProduct(product) {
	const supabase = getSupabase();
	try {
		const { data: userData, error: userError } = await supabase.auth.getUser();
		if (userError || !userData.user) throw userError ?? /* @__PURE__ */ new Error("Not authenticated");
		const { data: store, error: storeError } = await supabase.from("stores").select("id").eq("owner_id", userData.user.id).maybeSingle();
		if (storeError || !store) throw storeError ?? /* @__PURE__ */ new Error("Store not found");
		const { data, error } = await supabase.from("products").insert([{
			...product,
			store_id: store.id
		}]).select().single();
		if (error) throw error;
		return data;
	} catch (error) {
		fail(error, "Failed to create product", 500);
	}
}
async function supabaseGetOrders() {
	const supabase = getSupabase();
	try {
		const { data: userData, error: userError } = await supabase.auth.getUser();
		if (userError || !userData.user) throw userError ?? /* @__PURE__ */ new Error("Not authenticated");
		const { data: store, error: storeError } = await supabase.from("stores").select("id").eq("owner_id", userData.user.id).maybeSingle();
		if (storeError || !store) throw storeError ?? /* @__PURE__ */ new Error("Store not found");
		const { data, error } = await supabase.from("orders").select("*").eq("store_id", store.id).order("created_at", { ascending: false });
		if (error) throw error;
		return data ?? [];
	} catch (error) {
		fail(error, "Failed to fetch orders", 500);
	}
}
async function supabaseGetThreads() {
	const supabase = getSupabase();
	try {
		const { data: userData, error: userError } = await supabase.auth.getUser();
		if (userError || !userData.user) throw userError ?? /* @__PURE__ */ new Error("Not authenticated");
		const { data: store, error: storeError } = await supabase.from("stores").select("id").eq("owner_id", userData.user.id).maybeSingle();
		if (storeError || !store) throw storeError ?? /* @__PURE__ */ new Error("Store not found");
		const { data, error } = await supabase.from("threads").select("*").eq("store_id", store.id).order("updated_at", { ascending: false });
		if (error) throw error;
		return data ?? [];
	} catch (error) {
		fail(error, "Failed to fetch threads", 500);
	}
}
async function supabaseLogout() {
	try {
		await getSupabase().auth.signOut();
	} catch {}
	clearTokens();
}
//#endregion
export { supabaseCreateProduct, supabaseGetMe, supabaseGetOrders, supabaseGetProducts, supabaseGetStore, supabaseGetThreads, supabaseLogin, supabaseLogout, supabasePatchStore, supabaseRegister };
