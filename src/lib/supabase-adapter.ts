import { ApiError, messageFromUnknown } from "./api-error";
import { clearTokens, setTokens } from "./auth-storage";
import { getSupabase } from "./supabase-client";

/**
 * Supabase Auth + Postgres adapter (the app backend).
 */

function fail(error: unknown, fallback: string, status: number): never {
  throw new ApiError(messageFromUnknown(error) || fallback, status, error);
}

export async function supabaseRegister(payload: {
  email: string;
  password: string;
  phone?: string;
  store?: {
    name?: string;
    town?: string;
    county?: string;
    till?: string;
    attendant_phone?: string;
  };
}) {
  const supabase = getSupabase();
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("User account not created");

    const { error: storeError } = await supabase.from("stores").insert([
      {
        owner_id: authData.user.id,
        name: payload.store?.name ?? "My Store",
        town: payload.store?.town ?? "",
        county: payload.store?.county ?? "",
        till: payload.store?.till ?? "",
        attendant_phone: payload.store?.attendant_phone ?? payload.phone ?? "",
        open: true,
        onboarded: false,
      },
    ]);

    if (storeError) throw storeError;

    return { ok: true };
  } catch (error) {
    fail(error, "Registration failed", 400);
  }
}

export async function supabaseLogin(email: string, password: string) {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session?.access_token) throw new Error("No session");

    setTokens(data.session.access_token, data.session.refresh_token ?? "");
    return {
      access: data.session.access_token,
      refresh: data.session.refresh_token ?? "",
    };
  } catch (error) {
    clearTokens();
    fail(error, "Login failed", 401);
  }
}

export async function supabaseGetMe() {
  const supabase = getSupabase();
  try {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) throw error ?? new Error("Not authenticated");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", userData.user.id)
      .maybeSingle();

    if (storeError) throw storeError;

    return {
      id: userData.user.id,
      email: profile?.email ?? userData.user.email ?? "",
      phone: profile?.phone ?? "",
      created_at: profile?.created_at ?? userData.user.created_at,
      store,
    };
  } catch (error) {
    fail(error, "Failed to fetch user", 500);
  }
}

export async function supabaseGetStore() {
  const supabase = getSupabase();
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError ?? new Error("Not authenticated");

    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", userData.user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    fail(error, "Failed to fetch store", 500);
  }
}

export async function supabasePatchStore(patch: Record<string, unknown>) {
  const supabase = getSupabase();
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError ?? new Error("Not authenticated");

    const { data, error } = await supabase
      .from("stores")
      .update(patch)
      .eq("owner_id", userData.user.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    fail(error, "Failed to update store", 500);
  }
}

export async function supabaseGetProducts() {
  const supabase = getSupabase();
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError ?? new Error("Not authenticated");

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", userData.user.id)
      .maybeSingle();

    if (storeError || !store) throw storeError ?? new Error("Store not found");

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    fail(error, "Failed to fetch products", 500);
  }
}

export async function supabaseCreateProduct(product: Record<string, unknown>) {
  const supabase = getSupabase();
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError ?? new Error("Not authenticated");

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", userData.user.id)
      .maybeSingle();

    if (storeError || !store) throw storeError ?? new Error("Store not found");

    const { data, error } = await supabase
      .from("products")
      .insert([{ ...product, store_id: store.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    fail(error, "Failed to create product", 500);
  }
}

export async function supabaseGetOrders() {
  const supabase = getSupabase();
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError ?? new Error("Not authenticated");

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", userData.user.id)
      .maybeSingle();

    if (storeError || !store) throw storeError ?? new Error("Store not found");

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    fail(error, "Failed to fetch orders", 500);
  }
}

export async function supabaseGetThreads() {
  const supabase = getSupabase();
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError ?? new Error("Not authenticated");

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", userData.user.id)
      .maybeSingle();

    if (storeError || !store) throw storeError ?? new Error("Store not found");

    const { data, error } = await supabase
      .from("threads")
      .select("*")
      .eq("store_id", store.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch (error) {
    fail(error, "Failed to fetch threads", 500);
  }
}

export async function supabaseLogout() {
  try {
    await getSupabase().auth.signOut();
  } catch {
    // still clear local tokens
  }
  clearTokens();
}
