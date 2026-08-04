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

export const REQUEST_KINDS = ["request", "complaint"] as const;

export type RequestKind = (typeof REQUEST_KINDS)[number];

export const REQUEST_SOURCES = ["website", "chatbot", "phone", "walk-in", "email", "staff"] as const;

export type RequestSource = (typeof REQUEST_SOURCES)[number];

export const NOTIFICATION_CHANNELS = ["SMS", "Email", "App"] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const USER_ROLES = ["admin", "supervisor", "staff"] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Statuses that take a request out of the active queue. */
export const CLOSED_STATUSES: readonly RequestStatus[] = ["Resolved", "Closed", "Rejected"];

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
  email: string;
  categoryId: string;
  category: string;
  departmentId: string | null;
  departmentName: string | null;
  assignedStaffId: string | null;
  assignedStaffName: string | null;
  location: string;
  description: string;
  dateSubmitted: string;
  dueAt: string | null;
  priority: Priority;
  status: RequestStatus;
  attachedImage: string | null;
  source: RequestSource;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  noteCount: number;
}

export interface RequestDetail extends CitizenRequest {
  internalNotes: InternalNote[];
  activityHistory: ActivityEntry[];
}

export interface Department {
  id: string;
  name: string;
  headOfDepartment: string;
  description: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentWithStats extends Department {
  staffCount: number;
  activeRequestCount: number;
  totalRequestCount: number;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  departmentId: string;
  departmentName: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffWithStats extends Staff {
  activeRequestCount: number;
  totalRequestCount: number;
}

export interface Category {
  id: string;
  name: string;
  kind: RequestKind;
  defaultDepartmentId: string | null;
  defaultDepartmentName: string | null;
  isActive: boolean;
  sortOrder: number;
  requestCount: number;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  departmentName: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  timestamp: string;
  recipient: string;
  channel: NotificationChannel;
  message: string;
  relatedRequestId: string | null;
  relatedReferenceNumber: string | null;
}

export interface ApiKey {
  id: string;
  label: string;
  keyPreview: string;
  createdBy: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface AuditEntry {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  detail: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
