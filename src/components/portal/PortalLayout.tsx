import { Link, useRouterState } from "@tanstack/react-router";
import {
  BadgeCheck,
  Clock3,
  LayoutDashboard,
  MessagesSquare,
  Package,
  Receipt,
  Sprout,
  Store,
} from "lucide-react";
import { type ReactNode } from "react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { usePortal } from "@/lib/portal-store";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/customers", label: "Customer Care", icon: MessagesSquare },
  { to: "/mpesa", label: "M-Pesa Log", icon: Receipt },
  { to: "/onboarding", label: "Store Profile", icon: Store },
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
  const { profile, setProfile } = usePortal();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar px-3 py-5 lg:flex">
        <Brand />
        <nav className="mt-7 flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavItem key={item.to} {...item} active={pathname === item.to} />
          ))}
        </nav>
        <div className="rounded-xl bg-sidebar-accent/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-sidebar-foreground">Store status</span>
            <Switch checked={profile.open} onCheckedChange={(v) => setProfile({ open: v })} />
          </div>
          <p className="mt-1 text-[11px] text-sidebar-foreground/70">
            Counter is {profile.open ? "open to app customers" : "closed — hidden in app"}
          </p>
        </div>
      </aside>

      <div className="lg:pl-60">
        <StatusBanner />
        <header className="sticky top-0 z-20 border-b border-border bg-card/85 px-4 py-3 backdrop-blur sm:px-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </div>
        </header>

        <main className="px-4 pb-28 pt-5 sm:px-6 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card lg:hidden">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate px-1">{label}</span>
            </Link>
          );
        })}
      </nav>
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
}: {
  to: string;
  label: string;
  icon: typeof Store;
  active: boolean;
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
      <span className="truncate">{label}</span>
    </Link>
  );
}

function StatusBanner() {
  const { profile } = usePortal();
  const verified = profile.verified;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs font-medium sm:px-6",
        verified ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground",
      )}
    >
      {verified ? <BadgeCheck className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
      <span>{verified ? "Verified Merchant ✅" : "Pending Verification ⏳"}</span>
      <span className="opacity-80">
        {profile.name} · {profile.town}, {profile.county} · Till {profile.till}
      </span>
      {!verified && (
        <Link to="/onboarding" className="underline underline-offset-2">
          Complete verification
        </Link>
      )}
    </div>
  );
}
