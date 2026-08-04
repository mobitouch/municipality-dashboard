/**
 * The structural starting point for a brand-new database: the departments
 * and categories a municipality needs before it can accept a single
 * request. Everything here is editable from the dashboard afterwards —
 * these are defaults, not fixed configuration.
 */
export interface DefaultDepartment {
  id: string;
  name: string;
  headOfDepartment: string;
  description: string;
}

export const DEFAULT_DEPARTMENTS: DefaultDepartment[] = [
  {
    id: "dept-public-works",
    name: "Public Works",
    headOfDepartment: "",
    description: "Roads, street lighting, and public infrastructure maintenance.",
  },
  {
    id: "dept-sanitation",
    name: "Sanitation Services",
    headOfDepartment: "",
    description: "Waste collection, street cleaning, and illegal dumping response.",
  },
  {
    id: "dept-water",
    name: "Water & Sewage Authority",
    headOfDepartment: "",
    description: "Water supply, leakage repair, and sewage network maintenance.",
  },
  {
    id: "dept-parks",
    name: "Parks & Environment",
    headOfDepartment: "",
    description: "Parks, green spaces, and tree maintenance.",
  },
  {
    id: "dept-code-enforcement",
    name: "Code Enforcement",
    headOfDepartment: "",
    description: "Noise, zoning, and municipal code compliance.",
  },
  {
    id: "dept-permits",
    name: "Permits & Licensing Office",
    headOfDepartment: "",
    description: "Building permits, business licenses, and municipal authorizations.",
  },
  {
    id: "dept-public-safety",
    name: "Public Safety",
    headOfDepartment: "",
    description: "Emergency response coordination and public safety concerns.",
  },
  {
    id: "dept-admin",
    name: "Administration",
    headOfDepartment: "",
    description: "General administration and citizen services coordination.",
  },
];

export interface DefaultCategory {
  id: string;
  name: string;
  kind: "request" | "complaint";
  defaultDepartmentId: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { id: "cat-street-lighting", name: "Street Lighting", kind: "request", defaultDepartmentId: "dept-public-works" },
  { id: "cat-roads-potholes", name: "Roads & Potholes", kind: "request", defaultDepartmentId: "dept-public-works" },
  { id: "cat-waste-collection", name: "Waste Collection", kind: "complaint", defaultDepartmentId: "dept-sanitation" },
  { id: "cat-illegal-dumping", name: "Illegal Dumping", kind: "complaint", defaultDepartmentId: "dept-sanitation" },
  { id: "cat-water-sewage", name: "Water & Sewage", kind: "request", defaultDepartmentId: "dept-water" },
  { id: "cat-parks-trees", name: "Parks & Trees", kind: "request", defaultDepartmentId: "dept-parks" },
  { id: "cat-noise-complaints", name: "Noise Complaints", kind: "complaint", defaultDepartmentId: "dept-code-enforcement" },
  { id: "cat-permits-licensing", name: "Permits & Licensing", kind: "request", defaultDepartmentId: "dept-permits" },
  { id: "cat-health-environment", name: "Health & Environment", kind: "complaint", defaultDepartmentId: "dept-sanitation" },
  { id: "cat-general-inquiry", name: "General Inquiry", kind: "request", defaultDepartmentId: "dept-admin" },
];
