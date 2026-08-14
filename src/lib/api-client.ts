import { ApiError, messageFromUnknown } from "./api-error";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./auth-storage";
import { demoApiRequest, isSupabaseBackendEnabled } from "./supabase-demo";

export { ApiError } from "./api-error";

const DEFAULT_BASE = "http://127.0.0.1:8000/api/v1";

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || DEFAULT_BASE;
}

let loggedBackend = false;
function logBackendOnce() {
  if (loggedBackend || typeof console === "undefined") return;
  loggedBackend = true;
  if (isSupabaseBackendEnabled()) {
    console.info("[api] Using the Supabase backend.");
  } else {
    console.info(`[api] Using Django at ${getApiBaseUrl()} (VITE_USE_SUPABASE=false).`);
  }
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let refreshInFlight: Promise<boolean> | null = null;

/** Register logout/redirect when refresh fails (set by AuthProvider). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  /** Skip 401→refresh retry (used for refresh itself). */
  skipRefresh?: boolean;
};

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function tryRefreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return false;

    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh }),
      });
      const data = (await parseBody(res)) as { access?: string } | null;
      if (!res.ok || !data?.access) {
        clearTokens();
        return false;
      }
      // Keep existing refresh; SimpleJWT only returns a new access when rotation is off.
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

async function supabaseApiRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const {
    supabaseRegister,
    supabaseLogin,
    supabaseGetMe,
    supabaseGetStore,
    supabasePatchStore,
    supabaseGetProducts,
    supabaseCreateProduct,
    supabaseGetOrders,
    supabaseGetThreads,
    supabaseLogout,
  } = await import("./supabase-adapter");

  const method = (options.method ?? "GET").toUpperCase();
  const body = options.body;

  if (path === "/auth/register/" && method === "POST") {
    return (await supabaseRegister(body as {
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
    })) as T;
  }
  if (path === "/auth/token/" && method === "POST") {
    const payload = typeof body === "string" ? JSON.parse(body) : body;
    return (await supabaseLogin(payload.email, payload.password)) as T;
  }
  if (path === "/auth/me/" && method === "GET") {
    return (await supabaseGetMe()) as T;
  }
  if (path === "/auth/logout/" && method === "POST") {
    await supabaseLogout();
    return { ok: true } as T;
  }
  if (path === "/store/" && method === "GET") {
    return (await supabaseGetStore()) as T;
  }
  if (path === "/store/" && method === "PATCH") {
    return (await supabasePatchStore((body ?? {}) as Record<string, unknown>)) as T;
  }
  if (path === "/products/" && method === "GET") {
    return (await supabaseGetProducts()) as T;
  }
  if (path === "/products/" && method === "POST") {
    const payload = typeof body === "string" ? JSON.parse(body) : body;
    return (await supabaseCreateProduct(payload as Record<string, unknown>)) as T;
  }
  if (path === "/orders/" && method === "GET") {
    return (await supabaseGetOrders()) as T;
  }
  if (path === "/threads/" && method === "GET") {
    return (await supabaseGetThreads()) as T;
  }

  return (await demoApiRequest(path, options)) as T;
}

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  logBackendOnce();
  if (isSupabaseBackendEnabled()) {
    try {
      return await supabaseApiRequest<T>(path, options);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(messageFromUnknown(error) || "Backend request failed.", 500, error);
    }
  }

  const { method = "GET", body, auth = true, headers = {}, skipRefresh = false } = options;
  const url = path.startsWith("http") ? path : `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const reqHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      payload = body;
    } else {
      reqHeaders["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  if (auth) {
    const token = getAccessToken();
    if (token) reqHeaders.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { method, headers: reqHeaders, body: payload });
  } catch (error) {
    throw new ApiError(
      `Could not reach API at ${url}: ${messageFromUnknown(error) || "network error"}`,
      0,
      error,
    );
  }

  if (res.status === 401 && auth && !skipRefresh) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
    clearTokens();
    unauthorizedHandler?.();
    const errBody = await parseBody(res);
    throw new ApiError("Session expired. Please log in again.", 401, errBody);
  }

  const parsed = await parseBody(res);
  if (!res.ok) {
    const detail =
      typeof parsed === "object" &&
      parsed &&
      "detail" in parsed &&
      typeof (parsed as { detail: unknown }).detail === "string"
        ? (parsed as { detail: string }).detail
        : `Request failed (${res.status})`;
    throw new ApiError(detail, res.status, parsed);
  }

  return parsed as T;
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    apiRequest<T>(path, { ...opts, method: "DELETE" }),
};
