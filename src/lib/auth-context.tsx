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
  const { refreshStore, resetProfile, hydrateProfile } = usePortal();
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

  const logout = useCallback(() => {
    clearTokens();
    setVendor(null);
    resetProfile();
    void navigate({ to: "/login" });
  }, [navigate, resetProfile]);

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
    return me;
  }, [loadStoreProfile, hydrateProfile]);

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
      return me;
    },
    [loadStoreProfile, hydrateProfile],
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
      // Register does not return JWT — obtain tokens then mark store onboarded.
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
      void navigate({ to: "/login" });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate, resetProfile]);

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
  }, [refreshMe, resetProfile]);

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
