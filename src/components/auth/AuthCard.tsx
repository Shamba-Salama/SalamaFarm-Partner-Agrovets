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
        "relative overflow-hidden rounded-2xl border border-white/75 bg-card/60 shadow-[0_20px_60px_-24px_color-mix(in_oklch,var(--primary)_30%,transparent)] backdrop-blur-xl",
        className,
      )}
    >
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
  "h-10 rounded-lg border-primary/15 bg-background/60 shadow-none backdrop-blur-md transition-[border-color,box-shadow] focus-visible:border-primary/45 focus-visible:ring-2 focus-visible:ring-primary/15";

export const authLabelClass = "text-[13px] font-medium text-foreground/90";
