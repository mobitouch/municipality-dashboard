import { Link } from "@/components/link";
import { usePathname } from "@/lib/client/navigation";
import { Landmark } from "lucide-react";

import { NAV_ITEMS, NAV_SECTIONS } from "./nav-items";
import { useAllowedHrefs, useSession } from "@/lib/client/session";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { session } = useSession();
  const organisationName = session?.settings.organisationName ?? "";
  const allowed = new Set(useAllowedHrefs());
  const items = NAV_ITEMS.filter((item) => allowed.has(item.href));

  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">
      <div className="border-sidebar-border flex items-center gap-3 border-b px-5 py-4">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Landmark className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm leading-tight font-semibold">{organisationName}</p>
          <p className="text-sidebar-foreground/60 truncate text-xs leading-tight">
            Staff Dashboard
          </p>
        </div>
      </div>

      <nav className="scrollbar-stable flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => {
          const sectionItems = items.filter((item) => item.section === section);
          if (!sectionItems.length) return null;

          return (
            <div key={section} className="mb-5 last:mb-0">
              <p className="text-sidebar-foreground/45 px-3 pb-1.5 text-[0.6875rem] font-medium tracking-wider uppercase">
                {section}
              </p>
              <ul className="space-y-0.5">
                {sectionItems.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
