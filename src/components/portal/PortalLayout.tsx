import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BellOff,
  FileDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Package,
  Receipt,
  Smartphone,
  Store,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/BrandLogo";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const nav = [
  { to: "/", label: "Overview", shortLabel: "Home", icon: LayoutDashboard, badge: "none" },
  { to: "/inventory", label: "Inventory", shortLabel: "Stock", icon: Package, badge: "none" },
  {
    to: "/messages",
    label: "Messages",
    shortLabel: "Chat",
    icon: MessagesSquare,
    badge: "messages",
  },
  { to: "/orders", label: "Orders", shortLabel: "Orders", icon: Receipt, badge: "orders" },
  { to: "/customers", label: "Follow-Ups", shortLabel: "Follow", icon: Users, badge: "none" },
  { to: "/settings", label: "Settings", shortLabel: "Settings", icon: Store, badge: "none" },
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
  const {
    profile,
    toggleStoreOpen,
    unreadMessages,
    newOrderCount,
    openChat,
    lastIncoming,
    soundOn,
    setSoundOn,
    enablePush,
  } = usePortal();
  const [stkOpen, setStkOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-svh overflow-x-clip bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar px-3 py-5 lg:flex">
        <Brand />
        <nav className="mt-7 flex flex-1 flex-col gap-1">
          <SidebarNav pathname={pathname} badgeFor={badgeFor} />
        </nav>
        <SidebarFooter
          email={vendor?.email}
          logout={() => logout()}
          soundOn={soundOn}
          setSoundOn={setSoundOn}
        />
      </aside>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-72 max-w-[85vw] border-sidebar-border bg-sidebar p-3 text-sidebar-foreground"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation menu</SheetTitle>
            <SheetDescription>Navigate the merchant portal.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <Brand />
            <nav className="mt-7 flex flex-1 flex-col gap-1">
              <SidebarNav
                pathname={pathname}
                badgeFor={badgeFor}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </nav>
            <SidebarFooter
              email={vendor?.email}
              logout={() => logout()}
              soundOn={soundOn}
              setSoundOn={setSoundOn}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="min-w-0 lg:pl-60">
        <WelcomeBanner />
        <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-3 py-3 backdrop-blur sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
                ) : null}
              </div>
            </div>

            <div className="-mx-3 flex items-center gap-2 overflow-x-auto px-3 pb-0.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              <button
                type="button"
                disabled={togglingOpen}
                onClick={() => void onToggleOpen()}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  profile.open
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-destructive/30 bg-destructive/10 text-destructive",
                  togglingOpen && "opacity-70",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    profile.open ? "bg-success" : "bg-destructive",
                  )}
                />
                <span className="whitespace-nowrap">Store {profile.open ? "Open" : "Closed"}</span>
              </button>
              <Button size="sm" className="shrink-0" onClick={() => setStkOpen(true)}>
                <Smartphone className="h-4 w-4 sm:mr-1.5" />
                <span className="sm:hidden">Sale</span>
                <span className="hidden sm:inline">Counter sale</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={() => setExportOpen(true)}
              >
                <FileDown className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden md:inline">Export Sales Report</span>
                <span className="md:hidden">Export</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 lg:hidden"
                onClick={() => logout()}
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              {actions}
            </div>
          </div>
        </header>

        <main className="min-w-0 px-3 pb-6 pt-4 sm:px-6 sm:pt-5 lg:pb-10">{children}</main>
      </div>

      <ChatDrawer />
      <StkPushDialog open={stkOpen} onOpenChange={setStkOpen} />
      <ExportSalesDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}

function SidebarNav({
  pathname,
  badgeFor,
  onNavigate,
}: {
  pathname: string;
  badgeFor: (kind: string) => number;
  onNavigate?: () => void;
}) {
  return (
    <>
      {nav.map((item) => (
        <NavItem
          key={item.to}
          to={item.to}
          label={item.label}
          icon={item.icon}
          count={badgeFor(item.badge)}
          active={pathname === item.to}
          onClick={onNavigate}
        />
      ))}
    </>
  );
}

function SidebarFooter({
  email,
  logout,
  soundOn,
  setSoundOn,
}: {
  email?: string;
  logout: () => void;
  soundOn: boolean;
  setSoundOn: (enabled: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      {email ? (
        <p className="truncate px-2 text-[11px] text-sidebar-foreground/70">{email}</p>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        onClick={logout}
      >
        <LogOut className="h-4 w-4" />
        Log out
      </Button>
      <div className="rounded-md border border-sidebar-border bg-sidebar-accent/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-sidebar-foreground">Alert sounds</span>
          <Switch checked={soundOn} onCheckedChange={setSoundOn} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-sidebar-foreground/70">
          {soundOn ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
          Chime + push on new farmer messages
        </p>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="block px-2">
      <BrandLogo tone="sidebar" markClassName="h-11" />
    </Link>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
  count,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  count: number;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
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
        "flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 py-2 text-xs font-medium sm:px-6",
        verified
          ? "border-success/20 bg-success/10 text-success"
          : "border-amber-600/20 bg-amber-50 text-amber-900",
      )}
    >
      <span className="shrink-0 font-semibold">
        {verified ? "Verified Merchant" : "Pending Verification"}
      </span>
      <span className="min-w-0 flex-1 truncate opacity-80">
        {profile.name || "Your store"}
        {profile.town || profile.county
          ? ` · ${[profile.town, profile.county].filter(Boolean).join(", ")}`
          : ""}
        {profile.till ? ` · Till ${profile.till}` : ""}
      </span>
    </div>
  );
}
