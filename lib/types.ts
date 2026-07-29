export const REQUEST_STATUSES = [
  "New",
  "Under Review",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed",
  "Rejected",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const PRIORITIES = ["Low", "Normal", "High", "Urgent"] as const;

export type Priority = (typeof PRIORITIES)[number];

export type RequestKind = "request" | "complaint";

export type RequestSource = "website" | "chatbot" | "phone" | "walk-in";

export interface ActivityEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
}

export interface InternalNote {
  id: string;
  author: string;
  timestamp: string;
  note: string;
}

export interface CitizenRequest {
  id: string;
  referenceNumber: string;
  kind: RequestKind;
  citizenName: string;
  phone: string;
  category: string;
  departmentId: string | null;
  location: string;
  description: string;
  dateSubmitted: string;
  priority: Priority;
  status: RequestStatus;
  assignedStaffId: string | null;
  attachedImage: string | null;
  internalNotes: InternalNote[];
  activityHistory: ActivityEntry[];
  source: RequestSource;
  resolvedAt: string | null;
}

export interface Department {
  id: string;
  name: string;
  headOfDepartment: string;
  description: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  departmentId: string;
  email: string;
  phone: string;
}

export interface Notification {
  id: string;
  timestamp: string;
  recipient: string;
  channel: "SMS" | "Email" | "App";
  message: string;
  relatedRequestId?: string;
}

export interface DB {
  departments: Department[];
  staff: Staff[];
  requests: CitizenRequest[];
  notifications: Notification[];
}
