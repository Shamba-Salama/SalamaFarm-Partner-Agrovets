import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";

import { api, ApiError, setUnauthorizedHandler } from "@/lib/api-client";
import { clearTokens, getAccessToken, setTokens } from "@/lib/auth-storage";
import { usePortal } from "@/lib/portal-store";
import { apiStoreToProfile, type ApiStore } from "@/lib/store-api";

export type StoreSummary = {
  id: number;
  name: string;
  town: string;
  county: string;
  till: string;
  attendant_phone: string;
  open: boolean;
  onboarded: boolean;
};

export type VendorMe = {
  id: number;
  email: string;
  phone: string;
  created_at: string;
  store: StoreSummary | null;
};

type TokenPair = { access: string; refresh: string };

type RegisterInput = {
  email: string;
  password: string;
  phone?: string;
  store: {
    name: string;
    town: string;
    county: string;
    till: string;
    attendant_phone: string;
  };
};

type AuthCtx = {
  vendor: VendorMe | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<VendorMe>;
  register: (input: RegisterInput) => Promise<VendorMe>;
  logout: () => void;
  refreshMe: () => Promise<VendorMe | null>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    refreshStore,
    resetProfile,
    hydrateProfile,
    refreshProducts,
    resetProducts,
    refreshOrders,
    resetOrders,
    refreshCustomers,
    resetCustomers,
    refreshWeeklySales,
    resetWeeklySales,
  } = usePortal();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorMe | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const loadStoreProfile = useCallback(async () => {
    try {
      await refreshStore();
    } catch (err) {
      console.warn("Failed to load store profile", err);
      throw err;
    }
  }, [refreshStore]);

  const loadProducts = useCallback(async () => {
    try {
      await refreshProducts();
    } catch (err) {
      console.warn("Failed to load products", err);
    }
  }, [refreshProducts]);

  const loadOrders = useCallback(async () => {
    try {
      await refreshOrders();
    } catch (err) {
      console.warn("Failed to load orders", err);
    }
  }, [refreshOrders]);

  const loadCustomers = useCallback(async () => {
    try {
      await refreshCustomers();
    } catch (err) {
      console.warn("Failed to load customers", err);
    }
  }, [refreshCustomers]);

  const loadWeeklySales = useCallback(async () => {
    try {
      await refreshWeeklySales();
    } catch (err) {
      console.warn("Failed to load weekly sales", err);
    }
  }, [refreshWeeklySales]);

  const logout = useCallback(() => {
    clearTokens();
    setVendor(null);
    resetProfile();
    resetProducts();
    resetOrders();
    resetCustomers();
    resetWeeklySales();
    void navigate({ to: "/login" });
  }, [navigate, resetProfile, resetProducts, resetOrders, resetCustomers, resetWeeklySales]);

  const refreshMe = useCallback(async () => {
    if (!getAccessToken()) {
      setVendor(null);
      return null;
    }
    const me = await api.get<VendorMe>("/auth/me/");
    setVendor(me);
    try {
      await loadStoreProfile();
    } catch {
      if (me.store) {
        hydrateProfile(
          apiStoreToProfile({
            id: me.store.id,
            name: me.store.name,
            town: me.store.town,
            county: me.store.county,
            till: me.store.till,
            attendant_phone: me.store.attendant_phone,
            open: me.store.open,
            onboarded: me.store.onboarded,
          }),
        );
      }
    }
    await loadProducts();
    await loadOrders();
    await loadCustomers();
    await loadWeeklySales();
    return me;
  }, [loadStoreProfile, hydrateProfile, loadProducts, loadOrders, loadCustomers, loadWeeklySales]);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await api.post<TokenPair>(
        "/auth/token/",
        { email, password },
        { auth: false },
      );
      setTokens(tokens.access, tokens.refresh);
      const me = await api.get<VendorMe>("/auth/me/");
      setVendor(me);
      try {
        await loadStoreProfile();
      } catch {
        if (me.store) {
          hydrateProfile(
            apiStoreToProfile({
              id: me.store.id,
              name: me.store.name,
              town: me.store.town,
              county: me.store.county,
              till: me.store.till,
              attendant_phone: me.store.attendant_phone,
              open: me.store.open,
              onboarded: me.store.onboarded,
            }),
          );
        }
      }
      await loadProducts();
      await loadOrders();
      await loadCustomers();
      await loadWeeklySales();
      return me;
    },
    [loadStoreProfile, hydrateProfile, loadProducts, loadOrders, loadCustomers, loadWeeklySales],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      await api.post(
        "/auth/register/",
        {
          email: input.email,
          password: input.password,
          phone: input.phone || input.store.attendant_phone,
          store: input.store,
        },
        { auth: false },
      );
      const me = await login(input.email, input.password);
      try {
        const store = await api.patch<ApiStore>("/store/", { onboarded: true });
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
            onboarded: store.onboarded,
          },
        };
        setVendor(next);
        return next;
      } catch {
        return me;
      }
    },
    [login, hydrateProfile],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearTokens();
      setVendor(null);
      resetProfile();
      resetProducts();
      resetOrders();
      resetCustomers();
      resetWeeklySales();
      void navigate({ to: "/login" });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate, resetProfile, resetProducts, resetOrders, resetCustomers, resetWeeklySales]);

  useEffect(() => {
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
          if (!(err instanceof ApiError && err.status === 401)) {
            console.warn("Failed to restore session", err);
          }
        }
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMe, resetProfile, resetProducts, resetOrders, resetCustomers, resetWeeklySales]);

  const value = useMemo<AuthCtx>(
    () => ({
      vendor,
      isAuthenticated: Boolean(vendor),
      isBootstrapping,
      login,
      register,
      logout,
      refreshMe,
    }),
    [vendor, isBootstrapping, login, register, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
