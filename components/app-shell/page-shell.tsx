import * as React from "react";

import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { useCurrentUser } from "@/lib/client/session";
import { cn } from "@/lib/utils";

/**
 * The header + scroll container every screen renders inside. The page body
 * is the only scrolling region, which keeps the sidebar and header fixed
 * on long tables without any scroll-position bookkeeping.
 */
export function PageShell({
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
  const user = useCurrentUser();

  return (
    <>
      <header className="bg-card flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <MobileNav />
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
          "scrollbar-stable animate-in fade-in-0 flex-1 overflow-y-auto p-3 duration-300 sm:p-5 lg:p-6",
          contentClassName
        )}
      >
        {children}
      </main>
    </>
  );
}
