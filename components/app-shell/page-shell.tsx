import * as React from "react";

import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { getSettings } from "@/lib/data/settings";
import { requireUser } from "@/lib/auth/dal";
import { permissionsFor } from "@/lib/auth/permissions";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

export async function allowedNavHrefs(): Promise<string[]> {
  const user = await requireUser();
  const granted = new Set(permissionsFor(user.role));
  return NAV_ITEMS.filter((item) => granted.has(item.permission)).map((item) => item.href);
}

/**
 * The header + scroll container every screen renders inside. The page body
 * is the only scrolling region, which keeps the sidebar and header fixed
 * on long tables without any scroll-position bookkeeping.
 */
export async function PageShell({
  title,
  subtitle,
  actions,
  children,
  contentClassName,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  const user = await requireUser();
  const settings = getSettings();
  const hrefs = await allowedNavHrefs();

  return (
    <>
      <header className="bg-card flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <MobileNav allowedHrefs={hrefs} organisationName={settings.organisationName} />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
            {subtitle && (
              <div className="text-muted-foreground hidden truncate text-sm sm:block">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <UserMenu name={user.name} email={user.email} role={user.role} />
        </div>
      </header>

      <main
        className={cn(
          "scrollbar-stable flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6",
          contentClassName
        )}
      >
        {children}
      </main>
    </>
  );
}
