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

function applyStoreToPortal(
  setProfile: (p: Partial<{ name: string; town: string; county: string; till: string; attendantPhone: string; open: boolean; onboarded: boolean }>) => void,
  store: StoreSummary | null | undefined,
) {
  if (!store) return;
  setProfile({
    name: store.name,
    town: store.town,
    county: store.county,
    till: store.till,
    attendantPhone: store.attendant_phone,
    open: store.open,
    onboarded: store.onboarded,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setProfile } = usePortal();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorMe | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const logout = useCallback(() => {
    clearTokens();
    setVendor(null);
    setProfile({ onboarded: false });
    void navigate({ to: "/login" });
  }, [navigate, setProfile]);

  const refreshMe = useCallback(async () => {
    if (!getAccessToken()) {
      setVendor(null);
      return null;
    }
    const me = await api.get<VendorMe>("/auth/me/");
    setVendor(me);
    applyStoreToPortal(setProfile, me.store);
    return me;
  }, [setProfile]);

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
      applyStoreToPortal(setProfile, me.store);
      return me;
    },
    [setProfile],
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
        const store = await api.patch<StoreSummary>("/store/", { onboarded: true });
        const next = { ...me, store: { ...store } };
        setVendor(next);
        applyStoreToPortal(setProfile, store);
        return next;
      } catch {
        return me;
      }
    },
    [login, setProfile],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearTokens();
      setVendor(null);
      void navigate({ to: "/login" });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

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
  }, [refreshMe]);

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
