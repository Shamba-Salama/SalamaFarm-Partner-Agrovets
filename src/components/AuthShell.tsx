import type { ReactNode } from "react";

import { BrandLogo } from "@/components/BrandLogo";

type AuthShellProps = {
  headline: string;
  description: string;
  footer?: string;
  children: ReactNode;
};

/** Mobile: logo on the page background, no green. Desktop (lg+): green | white split. */
export function AuthShell({ headline, description, footer, children }: AuthShellProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="flex flex-col justify-between bg-transparent px-4 pb-0 pt-8 sm:px-8 lg:min-h-svh lg:bg-sidebar lg:p-12">
        {/* Mobile / tablet logo: sits on the page background, centered */}
        <div className="flex justify-center lg:hidden">
          <BrandLogo tone="plain" markClassName="h-16 object-center sm:h-20" />
        </div>

        {/* Desktop logo: on the green panel */}
        <div className="hidden lg:block">
          <BrandLogo tone="sidebar" markClassName="h-14" />
        </div>

        <div className="hidden max-w-md lg:mt-0 lg:block">
          <h2 className="text-3xl font-semibold leading-tight text-sidebar-foreground">
            {headline}
          </h2>
          <p className="mt-3 text-sm text-sidebar-foreground/75">{description}</p>
        </div>

        {footer ? (
          <p className="hidden text-sm text-sidebar-foreground/75 lg:block">{footer}</p>
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