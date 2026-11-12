import { MapPin, MessageCircle, Smartphone, Sprout, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  headline?: string;
  description?: string;
  footer?: string;
  children: ReactNode;
  /** Width of the form column (register uses a wider card). */
  contentClassName?: string;
  /** `split` = green story panel + form; `centered` = form only (sign-in). */
  variant?: "split" | "centered";
};

const HIGHLIGHTS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Sprout,
    title: "Stock on the shelf",
    text: "List seeds, feeds, and vet supplies farmers can order in minutes.",
  },
  {
    icon: MessageCircle,
    title: "Chat at the counter",
    text: "Answer farmer questions without leaving your POS.",
  },
  {
    icon: Smartphone,
    title: "M-Pesa at checkout",
    text: "STK push and till payouts when you are ready.",
  },
];

function AuthBackdrop() {
  return (
    <>
      <div className="auth-backdrop-base pointer-events-none absolute inset-0" aria-hidden />
      <div className="auth-backdrop-glow pointer-events-none absolute inset-0" aria-hidden />
    </>
  );
}

function FieldPanel({
  headline,
  description,
  footer,
}: Pick<AuthShellProps, "headline" | "description" | "footer">) {
  return (
    <div className="relative flex min-h-full flex-col justify-between overflow-hidden p-8 lg:p-12 xl:p-14">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/5 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-black/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[18%] right-[8%] hidden h-32 w-32 rounded-full border border-white/10 lg:block"
        aria-hidden
      />

      <div className="relative space-y-10">
        <BrandLogo tone="sidebar" showPartnerLabel markClassName="h-12 sm:h-14" />

        <div className="max-w-md space-y-4">
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-sidebar-foreground/60 uppercase">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            Built for Kenyan agrovets
          </p>
          <h2 className="text-3xl font-semibold leading-[1.15] tracking-tight text-sidebar-foreground xl:text-[2rem]">
            {headline}
          </h2>
          <p className="text-base leading-relaxed text-sidebar-foreground/78">{description}</p>
        </div>

        <ul className="hidden max-w-md space-y-4 lg:block">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/12 text-sidebar-foreground">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-sidebar-foreground/70">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {footer ? (
        <p className="relative mt-8 hidden text-sm text-sidebar-foreground/65 lg:block">{footer}</p>
      ) : (
        <span className="hidden lg:block" aria-hidden />
      )}
    </div>
  );
}

function CenteredAuthLayout({
  children,
  contentClassName,
  footer,
}: Pick<AuthShellProps, "children" | "contentClassName" | "footer">) {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center px-4 py-10 sm:px-6">
      <div className="mb-7 flex w-full max-w-[26rem] flex-col items-center gap-1.5 text-center sm:mb-8">
        <BrandLogo tone="plain" showPartnerLabel markClassName="h-14 sm:h-16" />
      </div>
      <div className={cn("w-full max-w-[26rem]", contentClassName)}>{children}</div>
      {footer ? (
        <p
          className={cn(
            "mt-6 max-w-[26rem] text-center text-xs text-muted-foreground",
            contentClassName,
          )}
        >
          {footer}
        </p>
      ) : null}
    </main>
  );
}

/** Auth layout: warm field tones + green story panel on desktop. */
export function AuthShell({
  headline = "",
  description = "",
  footer,
  children,
  contentClassName,
  variant = "split",
}: AuthShellProps) {
  return (
    <div className="relative min-h-svh overflow-x-clip">
      <AuthBackdrop />

      {variant === "centered" ? (
        <CenteredAuthLayout contentClassName={contentClassName} footer={footer}>
          {children}
        </CenteredAuthLayout>
      ) : (
        <div className="relative grid min-h-svh lg:grid-cols-2">
          <aside className={cn("relative bg-primary lg:min-h-svh")}>
            <div className="lg:hidden">
              <MobileHero headline={headline} description={description} />
            </div>
            <div className="hidden lg:block lg:min-h-svh">
              <FieldPanel headline={headline} description={description} footer={footer} />
            </div>
          </aside>

          <main className="flex flex-col justify-start px-4 py-6 sm:px-8 sm:py-8 md:justify-center md:py-12 lg:min-h-svh lg:px-10 xl:px-14">
            <div className={cn("mx-auto w-full max-w-[26rem]", contentClassName)}>{children}</div>
            {footer ? (
              <p
                className={cn(
                  "mx-auto mt-6 max-w-[26rem] text-center text-xs text-muted-foreground lg:hidden",
                  contentClassName,
                )}
              >
                {footer}
              </p>
            ) : null}
          </main>
        </div>
      )}
    </div>
  );
}

function MobileHero({ headline, description }: Pick<AuthShellProps, "headline" | "description">) {
  return (
    <div className="px-5 pb-6 pt-8 text-sidebar-foreground sm:px-8">
      <div className="flex justify-center pb-5">
        <BrandLogo tone="sidebar" showPartnerLabel markClassName="h-14" />
      </div>
      <h2 className="text-center text-lg font-semibold leading-snug tracking-tight">{headline}</h2>
      <p className="mx-auto mt-2 max-w-sm text-center text-sm text-sidebar-foreground/75">
        {description}
      </p>
    </div>
  );
}

/** Full-page loader matching auth chrome. */
export function AuthLoadingScreen({ message = "Checking session…" }: { message?: string }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4">
      <AuthBackdrop />
      <p className="relative text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
