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
} from "lucide-react";

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

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-black/10 bg-koura-text text-koura-bg">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-koura-primary">
          <Landmark className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">MobiTouch</p>
          <p className="text-xs leading-tight text-koura-bg/60">Municipality Dashboard</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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
  );
}
