import { supabase } from "./supabase-client";
import { setTokens, clearTokens } from "./auth-storage";
import { ApiError } from "./api-client";

/**
 * Real Supabase adapter that writes to the actual database.
 * Replaces the temporary demo backend.
 */

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
  try {
    // Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("User account not created");

    // Create store record
    const { error: storeError } = await supabase.from("stores").insert([
      {
        owner_id: authData.user.id,
        name: payload.store?.name ?? "My Store",
        town: payload.store?.town ?? "",
        county: payload.store?.county ?? "",
        till: payload.store?.till ?? "",
        attendant_phone: payload.store?.attendant_phone ?? "",
        open: true,
        onboarded: false,
      },
    ]);

    if (storeError) throw storeError;

    // Get session
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (sessionError) throw sessionError;
    if (!sessionData.session?.access_token) throw new Error("No session created");

    // Store tokens
    setTokens(sessionData.session.access_token, sessionData.session.refresh_token ?? "");

    return {
      id: authData.user.id,
      email: authData.user.email ?? payload.email,
      phone: payload.phone,
      created_at: authData.user.created_at ?? new Date().toISOString(),
      store: {
        id: authData.user.id,
        name: payload.store?.name ?? "My Store",
        town: payload.store?.town ?? "",
        county: payload.store?.county ?? "",
        till: payload.store?.till ?? "",
        attendant_phone: payload.store?.attendant_phone ?? "",
        open: true,
        onboarded: false,
      },
    };
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : "Registration failed",
      400,
      error
    );
  }
}

export async function supabaseLogin(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session?.access_token) throw new Error("No session");

    setTokens(data.session.access_token, data.session.refresh_token ?? "");
    return data.session;
  } catch (error) {
    clearTokens();
    throw new ApiError(
      error instanceof Error ? error.message : "Login failed",
      401,
      error
    );
  }
}

export async function supabaseGetMe() {
  try {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) throw error ?? new Error("Not authenticated");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();

    if (profileError) throw profileError;

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", userData.user.id)
      .maybeSingle();

    if (storeError) throw storeError;

    return {
      id: userData.user.id,
      email: profile.email,
      phone: profile.phone,
      created_at: profile.created_at,
      store,
    };
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to fetch user",
      500,
      error
    );
  }
}

export async function supabaseGetStore() {
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
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to fetch store",
      500,
      error
    );
  }
}

export async function supabasePatchStore(patch: Record<string, any>) {
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
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to update store",
      500,
      error
    );
  }
}

export async function supabaseGetProducts() {
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
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to fetch products",
      500,
      error
    );
  }
}

export async function supabaseCreateProduct(product: any) {
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
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to create product",
      500,
      error
    );
  }
}

export async function supabaseGetOrders() {
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
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to fetch orders",
      500,
      error
    );
  }
}

export async function supabaseGetThreads() {
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
    throw new ApiError(
      error instanceof Error ? error.message : "Failed to fetch threads",
      500,
      error
    );
  }
}

export async function supabaseLogout() {
  try {
    await supabase.auth.signOut();
    clearTokens();
  } catch (error) {
    clearTokens();
  }
}
