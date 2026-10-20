import type { ReactNode } from "react";

import { BrandLogo } from "@/components/BrandLogo";

type AuthShellProps = {
  headline: string;
  description: string;
  footer?: string;
  children: ReactNode;
};

/** Split auth layout: compact brand strip on mobile, full-height green | white on desktop. */
export function AuthShell({ headline, description, footer, children }: AuthShellProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="flex flex-col justify-between bg-sidebar px-5 py-4 sm:px-8 sm:py-4 md:py-8 lg:min-h-svh lg:p-12">
        <BrandLogo tone="sidebar" markClassName="h-12 sm:h-14" />
        <div className="mt-5 hidden max-w-md md:block lg:mt-0">
          <h2 className="text-xl font-semibold leading-tight text-sidebar-foreground sm:text-2xl lg:text-3xl">
            {headline}
          </h2>
          <p className="mt-2 text-sm text-sidebar-foreground/75 sm:mt-3">{description}</p>
        </div>
        {footer ? (
          <p className="mt-6 hidden text-sm text-sidebar-foreground/75 lg:mt-0 lg:block">
            {footer}
          </p>
        ) : (
          <span className="hidden lg:block" aria-hidden />
        )}
      </aside>

      <main className="flex flex-col justify-start bg-background px-4 py-4 sm:px-8 sm:py-6 md:justify-center md:py-10 lg:min-h-svh lg:px-12">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
