import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  badge?: { icon: LucideIcon; label: string };
};

export function AuthCard({ title, description, badge, children, className }: AuthCardProps) {
  const BadgeIcon = badge?.icon;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/12 bg-card/95 shadow-[0_12px_40px_-12px_oklch(0.22_0.04_152/0.18)] backdrop-blur-sm",
        className,
      )}
    >
      <div
        className="h-1 w-full bg-gradient-to-r from-primary via-success to-primary/50"
        aria-hidden
      />
      <div className="space-y-5 p-6 sm:p-8">
        <div className="space-y-2">
          {badge && BadgeIcon ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary-soft/80 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-accent-foreground uppercase">
              <BadgeIcon className="h-3.5 w-3.5 text-primary" aria-hidden />
              {badge.label}
            </span>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Shared field chrome for auth forms — calm, roomy, farm-market friendly. */
export const authFieldClass =
  "h-10 rounded-lg border-border/70 bg-background shadow-none transition-[border-color,box-shadow] focus-visible:border-primary/45 focus-visible:ring-2 focus-visible:ring-primary/15";

export const authLabelClass = "text-[13px] font-medium text-foreground/90";
