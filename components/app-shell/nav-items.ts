import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  LayoutDashboard,
  MessageSquareWarning,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/auth/permissions";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  /** Groups the item under a heading in the sidebar. */
  section: "Work" | "Organisation" | "Insight";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard, permission: "requests:view", section: "Work" },
  { href: "/requests", label: "Citizen Requests", icon: ClipboardList, permission: "requests:view", section: "Work" },
  { href: "/complaints", label: "Complaints", icon: MessageSquareWarning, permission: "requests:view", section: "Work" },
  { href: "/departments", label: "Departments", icon: Building2, permission: "departments:view", section: "Organisation" },
  { href: "/staff", label: "Staff", icon: Users, permission: "staff:view", section: "Organisation" },
  { href: "/categories", label: "Categories", icon: Tags, permission: "categories:view", section: "Organisation" },
  { href: "/users", label: "User Accounts", icon: ShieldCheck, permission: "users:manage", section: "Organisation" },
  { href: "/reports", label: "Reports", icon: BarChart3, permission: "reports:view", section: "Insight" },
  { href: "/notifications", label: "Notifications", icon: Bell, permission: "notifications:view", section: "Insight" },
  { href: "/settings", label: "Settings", icon: Settings, permission: "requests:view", section: "Insight" },
];

export const NAV_SECTIONS = ["Work", "Organisation", "Insight"] as const;
