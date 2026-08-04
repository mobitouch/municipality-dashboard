"use client";

import { Menu } from "lucide-react";
import LogoutButton from "./LogoutButton";
import { useSidebar } from "./SidebarContext";

export default function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { open } = useSidebar();

  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6 sm:py-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          onClick={open}
          aria-label="Open menu"
          className="-ml-1.5 shrink-0 rounded-lg p-2 text-koura-text hover:bg-koura-bg md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-koura-text sm:text-lg">{title}</h1>
          {subtitle && <p className="hidden truncate text-sm text-slate-500 sm:block">{subtitle}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-800">Admin User</p>
          <p className="text-xs text-slate-500">Municipal Staff</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-koura-primary/10 text-sm font-semibold text-koura-primary">
          AU
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
