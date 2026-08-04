export const SESSION_COOKIE = "mobitouch_session";

export const DEMO_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME ?? "admin@mobitouch.demo",
  password: process.env.ADMIN_PASSWORD ?? "Demo@2026",
};

// Shared secret external callers send as `x-api-key` when posting a new
// request — the n8n chatbot workflow, and the live municipal website's
// Contact/Report an Issue forms. Set API_KEY in the environment on both
// this app and the website so they agree; falls back to the demo value
// so a local checkout still works untouched.
export const N8N_API_KEY = process.env.API_KEY ?? "mobitouch-demo-key";

export interface CategoryDef {
  id: string;
  name: string;
  defaultDepartmentId: string;
  kind: "request" | "complaint";
}

// Categories and departments below are realistic placeholders pending
// confirmation with Jean-Jacques (see prompt.txt) — edit here and in
// scripts/seed.mjs if the real list differs, then re-run `npm run seed`.
export const CATEGORIES: CategoryDef[] = [
  { id: "street-lighting", name: "Street Lighting", defaultDepartmentId: "dept-public-works", kind: "request" },
  { id: "roads-potholes", name: "Roads & Potholes", defaultDepartmentId: "dept-public-works", kind: "request" },
  { id: "waste-collection", name: "Waste Collection", defaultDepartmentId: "dept-sanitation", kind: "complaint" },
  { id: "illegal-dumping", name: "Illegal Dumping", defaultDepartmentId: "dept-sanitation", kind: "complaint" },
  { id: "water-sewage", name: "Water & Sewage", defaultDepartmentId: "dept-water", kind: "request" },
  { id: "parks-trees", name: "Parks & Trees", defaultDepartmentId: "dept-parks", kind: "request" },
  { id: "noise-complaints", name: "Noise Complaints", defaultDepartmentId: "dept-code-enforcement", kind: "complaint" },
  { id: "permits-licensing", name: "Permits & Licensing", defaultDepartmentId: "dept-permits", kind: "request" },
  { id: "health-environment", name: "Health & Environment", defaultDepartmentId: "dept-sanitation", kind: "complaint" },
  { id: "general-inquiry", name: "General Inquiry", defaultDepartmentId: "dept-admin", kind: "request" },
];

export const STATUS_COLORS: Record<string, string> = {
  New: "bg-sky-100 text-sky-700 ring-sky-600/20",
  "Under Review": "bg-amber-100 text-amber-700 ring-amber-600/20",
  Assigned: "bg-violet-100 text-violet-700 ring-violet-600/20",
  "In Progress": "bg-koura-primary/10 text-koura-primary ring-koura-primary/20",
  Resolved: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  Closed: "bg-slate-200 text-slate-700 ring-slate-600/20",
  Rejected: "bg-rose-100 text-rose-700 ring-rose-600/20",
};

export const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Normal: "bg-teal-100 text-teal-700 ring-teal-600/20",
  High: "bg-orange-100 text-orange-700 ring-orange-600/20",
  Urgent: "bg-red-100 text-red-700 ring-red-600/20",
};

export const CLOSED_STATUSES = ["Resolved", "Closed", "Rejected"];
