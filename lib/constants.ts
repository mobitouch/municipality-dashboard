import type { Priority, RequestStatus, UserRole } from "./types";

export const SESSION_COOKIE = "mobitouch_session";

/** How long a staff session stays valid without re-authenticating. */
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

export const APP_NAME = "MobiTouch Municipality";
export const APP_SHORT_NAME = "MobiTouch";

/**
 * Status and priority colours are expressed against the shadcn token
 * palette so they track light/dark mode automatically.
 */
export const STATUS_STYLES: Record<RequestStatus, string> = {
  New: "bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  "Under Review": "bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  Assigned: "bg-violet-500/12 text-violet-700 ring-violet-500/25 dark:text-violet-300",
  "In Progress": "bg-primary/12 text-primary ring-primary/25",
  Resolved: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  Closed: "bg-muted text-muted-foreground ring-border",
  Rejected: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-300",
};

export const PRIORITY_STYLES: Record<Priority, string> = {
  Low: "bg-muted text-muted-foreground ring-border",
  Normal: "bg-teal-500/12 text-teal-700 ring-teal-500/25 dark:text-teal-300",
  High: "bg-orange-500/12 text-orange-700 ring-orange-500/25 dark:text-orange-300",
  Urgent: "bg-red-500/15 text-red-700 ring-red-500/30 dark:text-red-300",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  supervisor: "Supervisor",
  staff: "Staff",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Full access, including user accounts, categories, and system settings.",
  supervisor: "Manages requests, staff, and departments; can delete requests and export data.",
  staff: "Works the request queue — updates status, assigns, and adds internal notes.",
};

/** Statuses a request moves through, in the order the workflow expects. */
export const STATUS_FLOW_HINT: Record<RequestStatus, string> = {
  New: "Not yet triaged.",
  "Under Review": "Being assessed by the department.",
  Assigned: "Allocated to a staff member.",
  "In Progress": "Work has started.",
  Resolved: "Work complete, pending closure.",
  Closed: "Closed and archived.",
  Rejected: "Declined — out of scope or invalid.",
};

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;
