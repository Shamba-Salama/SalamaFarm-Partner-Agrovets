import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BellOff,
  FileDown,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  Package,
  Receipt,
  Smartphone,
  Sprout,
  Store,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { formatApiError } from "@/lib/format-api-error";
import { usePortal } from "@/lib/portal-store";
import { ChatDrawer } from "@/components/portal/ChatDrawer";
import { StkPushDialog } from "@/components/portal/StkPushDialog";
import { ExportSalesDialog } from "@/components/portal/ExportSalesDialog";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard, badge: "none" },
  { to: "/inventory", label: "Inventory", icon: Package, badge: "none" },
  { to: "/messages", label: "Messages", icon: MessagesSquare, badge: "messages" },
  { to: "/orders", label: "Orders", icon: Receipt, badge: "orders" },
  { to: "/customers", label: "Follow-Ups", icon: Users, badge: "none" },
  { to: "/settings", label: "Settings", icon: Store, badge: "none" },
] as const;

export function PortalLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isAuthenticated, isBootstrapping, logout, vendor } = useAuth();
  const { profile, toggleStoreOpen, unreadMessages, newOrderCount, openChat, lastIncoming, soundOn, setSoundOn, enablePush } =
    usePortal();
  const [stkOpen, setStkOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [togglingOpen, setTogglingOpen] = useState(false);

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated) {
      void navigate({ to: "/login" });
    }
  }, [isAuthenticated, isBootstrapping, navigate]);

  useEffect(() => {
    enablePush();
  }, [enablePush]);

  useEffect(() => {
    if (!lastIncoming) return;
    const { thread, text } = lastIncoming;
    toast(`New inquiry from ${thread.farmer}`, {
      description: `${thread.topic} — ${text}`,
      action: { label: "Reply Now", onClick: () => openChat(thread.id) },
      duration: 12000,
    });
  }, [lastIncoming, openChat]);

  const badgeFor = (kind: string) =>
    kind === "messages" ? unreadMessages : kind === "orders" ? newOrderCount : 0;

  const onToggleOpen = async () => {
    if (togglingOpen) return;
    setTogglingOpen(true);
    try {
      await toggleStoreOpen();
    } catch (err) {
      toast.error(err instanceof ApiError ? formatApiError(err) : "Could not update store status.");
    } finally {
      setTogglingOpen(false);
    }
  };

  if (isBootstrapping || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        {isBootstrapping ? "Loading…" : "Redirecting to sign in…"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar px-3 py-5 lg:flex">
        <Brand />
        <nav className="mt-7 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              count={badgeFor(item.badge)}
              active={pathname === item.to}
            />
          ))}
        </nav>
        <div className="space-y-3">
          {vendor?.email ? (
            <p className="truncate px-2 text-[11px] text-sidebar-foreground/70">{vendor.email}</p>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
          <div className="rounded-xl bg-sidebar-accent/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-sidebar-foreground">Alert sounds</span>
              <Switch checked={soundOn} onCheckedChange={setSoundOn} />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-sidebar-foreground/70">
              {soundOn ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
              Chime + push on new farmer messages
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-60">
        <WelcomeBanner />
        <header className="sticky top-0 z-20 border-b border-border bg-card/85 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[140px] flex-1">
              <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={togglingOpen}
                onClick={() => void onToggleOpen()}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  profile.open
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-destructive/40 bg-destructive/10 text-destructive",
                  togglingOpen && "opacity-70",
                )}
              >
                Store Status: {profile.open ? "Open 🟢" : "Closed 🔴"}
              </button>
              <Button size="sm" onClick={() => setStkOpen(true)}>
                <Smartphone className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Counter M-Pesa</span> STK Push
              </Button>
              <Button size="sm" variant="outline" onClick={() => setExportOpen(true)}>
                <FileDown className="mr-1.5 h-4 w-4" />
                <span className="hidden md:inline">Export Sales Report</span>
                <span className="md:hidden">Export</span>
              </Button>
              <Button size="sm" variant="outline" className="lg:hidden" onClick={() => logout()}>
                <LogOut className="h-4 w-4" />
              </Button>
              {actions}
            </div>
          </div>
        </header>

        <main className="px-4 pb-28 pt-5 sm:px-6 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-border bg-card lg:hidden">
        {nav.map(({ to, label, icon: Icon, badge }) => {
          const active = pathname === to;
          const count = badgeFor(badge);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute right-1/4 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {count}
                </span>
              )}
              <span className="truncate px-0.5">{label}</span>
            </Link>
          );
        })}
      </nav>

      <ChatDrawer />
      <StkPushDialog open={stkOpen} onOpenChange={setStkOpen} />
      <ExportSalesDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 px-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
        <Sprout className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-sidebar-foreground">SalamaFarm</span>
        <span className="block truncate text-[11px] text-sidebar-foreground/70">
          Partner Agrovets
        </span>
      </span>
    </Link>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
  count,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  count: number;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}

function WelcomeBanner() {
  const { profile } = usePortal();
  const verified = profile.onboarded;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs font-medium sm:px-6",
        verified
          ? "bg-success text-success-foreground"
          : "bg-amber-600 text-white",
      )}
    >
      <Sprout className="h-4 w-4" />
      <span>
        {verified ? "Verified Merchant ✅" : "Pending Verification ⏳"}
      </span>
      <span className="opacity-90">
        {profile.name || "Your store"}
        {profile.town || profile.county
          ? ` · ${[profile.town, profile.county].filter(Boolean).join(", ")}`
          : ""}
        {profile.till ? ` · Till ${profile.till}` : ""}
      </span>
    </div>
  );
}
