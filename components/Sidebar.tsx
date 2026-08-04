"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquareWarning,
  Building2,
  Users,
  BarChart3,
  Bell,
  Settings,
  Landmark,
  X,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

const NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/requests", label: "Citizen Requests", icon: ClipboardList },
  { href: "/complaints", label: "Complaints", icon: MessageSquareWarning },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  return (
    <>
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity duration-200 md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-64 max-w-[80vw] shrink-0 flex-col border-r border-black/10 bg-koura-text text-koura-bg transition-transform duration-200 ease-in-out md:static md:inset-auto md:z-auto md:max-w-none md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-koura-primary">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">MobiTouch</p>
            <p className="truncate text-xs leading-tight text-koura-bg/60">Municipality Dashboard</p>
          </div>
          <button
            onClick={close}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-koura-bg/70 hover:bg-white/10 hover:text-koura-bg md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-koura-primary text-white"
                    : "text-koura-bg/70 hover:bg-white/5 hover:text-koura-bg"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-5 py-4 text-xs text-koura-bg/40">
          Demo build — not for production use
        </div>
      </aside>
    </>
  );
}
