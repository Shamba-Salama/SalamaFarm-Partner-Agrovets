import logoSrc from "@/assets/salamafarm-logo.jpg";
import { cn } from "@/lib/utils";

/** Bundled logo URL (hashed in production so Vercel CDN cannot serve a stale public file). */
export const SALAMAFARM_LOGO_SRC = logoSrc;

type BrandLogoProps = {
  className?: string;
  /** Applied to the logo image. */
  markClassName?: string;
  /** Extra line under the official wordmark (logo already includes SALAMA FARM). */
  showPartnerLabel?: boolean;
  /**
   * `sidebar` = logo on dark/green panels → white pad.
   * `light` = logo on white/light panels → brand-color pad.
   */
  tone?: "sidebar" | "light";
};

export function BrandLogo({
  className,
  markClassName,
  showPartnerLabel = false,
  tone = "sidebar",
}: BrandLogoProps) {
  const subtitleClass =
    tone === "sidebar" ? "text-sidebar-foreground/70" : "text-muted-foreground";

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div
        className={cn(
          "inline-flex w-fit max-w-full items-center justify-center rounded-lg p-2 shadow-sm",
          tone === "sidebar" ? "bg-white" : "bg-primary",
        )}
      >
        <img
          src={SALAMAFARM_LOGO_SRC}
          alt="Salama Farm"
          className={cn(
            "h-12 w-auto max-w-full shrink-0 object-contain object-left",
            markClassName,
          )}
        />
      </div>
      {showPartnerLabel ? (
        <span className={cn("truncate text-[11px] font-medium tracking-wide", subtitleClass)}>
          Partner Agrovets
        </span>
      ) : null}
    </div>
  );
}
