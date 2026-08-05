import "server-only";

import { all, get, run, transaction, type SqlValue } from "@/lib/db/client";
import { newId } from "@/lib/db/ids";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  CLOSED_STATUSES,
  type ActivityEntry,
  type CitizenRequest,
  type InternalNote,
  type Paginated,
  type Priority,
  type RequestDetail,
  type RequestKind,
  type RequestSource,
  type RequestStatus,
} from "@/lib/types";

const CLOSED_LIST = CLOSED_STATUSES.map((status) => `'${status}'`).join(", ");

interface RequestRow {
  id: string;
  reference_number: string;
  kind: RequestKind;
  citizen_name: string;
  phone: string;
  email: string;
  category_id: string;
  category_name: string;
  department_id: string | null;
  department_name: string | null;
  assigned_staff_id: string | null;
  assigned_staff_name: string | null;
  location: string;
  description: string;
  priority: Priority;
  status: RequestStatus;
  source: RequestSource;
  attached_image: string | null;
  date_submitted: string;
  due_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  note_count: number;
}

function toRequest(row: RequestRow): CitizenRequest {
  return {
    id: row.id,
    referenceNumber: row.reference_number,
    kind: row.kind,
    citizenName: row.citizen_name,
    phone: row.phone,
    email: row.email,
    categoryId: row.category_id,
    category: row.category_name,
    departmentId: row.department_id,
    departmentName: row.department_name,
    assignedStaffId: row.assigned_staff_id,
    assignedStaffName: row.assigned_staff_name,
    location: row.location,
    description: row.description,
    dateSubmitted: row.date_submitted,
    dueAt: row.due_at,
    priority: row.priority,
    status: row.status,
    attachedImage: row.attached_image,
    source: row.source,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    noteCount: row.note_count ?? 0,
  };
}

const SELECT_COLUMNS = `
  r.*,
  c.name AS category_name,
  d.name AS department_name,
  s.name AS assigned_staff_name,
  (SELECT COUNT(*) FROM request_notes n WHERE n.request_id = r.id) AS note_count
`;

const FROM_JOINS = `
  FROM requests r
  JOIN categories c ON c.id = r.category_id
  LEFT JOIN departments d ON d.id = r.department_id
  LEFT JOIN staff s ON s.id = r.assigned_staff_id
`;

export type RequestSort = "newest" | "oldest" | "priority" | "status" | "reference" | "updated";

export interface RequestQuery {
  kind?: RequestKind;
  status?: string;
  departmentId?: string;
  categoryId?: string;
  assignedStaffId?: string;
  priority?: string;
  source?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  /** Only requests with no department or no assignee. */
  unassigned?: boolean;
  /** Excludes Resolved/Closed/Rejected. */
  openOnly?: boolean;
  sort?: RequestSort;
  page?: number;
  pageSize?: number;
}

const SORT_CLAUSES: Record<RequestSort, string> = {
  newest: "r.date_submitted DESC",
  oldest: "r.date_submitted ASC",
  updated: "r.updated_at DESC",
  reference: "r.reference_number DESC",
  status: "r.status COLLATE NOCASE, r.date_submitted DESC",
  // Urgent first, then High, Normal, Low — a CASE keeps the ordering
  // semantic instead of alphabetical.
  priority: `CASE r.priority
               WHEN 'Urgent' THEN 0 WHEN 'High' THEN 1
               WHEN 'Normal' THEN 2 ELSE 3 END, r.date_submitted DESC`,
};

function buildWhere(query: RequestQuery): { sql: string; params: Record<string, SqlValue> } {
  const conditions: string[] = [];
  const params: Record<string, SqlValue> = {};

  if (query.kind) {
    conditions.push("r.kind = :kind");
    params.kind = query.kind;
  }
  if (query.status) {
    conditions.push("r.status = :status");
    params.status = query.status;
  }
  if (query.departmentId) {
    conditions.push("r.department_id = :departmentId");
    params.departmentId = query.departmentId;
  }
  if (query.categoryId) {
    conditions.push("r.category_id = :categoryId");
    params.categoryId = query.categoryId;
  }
  if (query.assignedStaffId) {
    conditions.push("r.assigned_staff_id = :assignedStaffId");
    params.assignedStaffId = query.assignedStaffId;
  }
  if (query.priority) {
    conditions.push("r.priority = :priority");
    params.priority = query.priority;
  }
  if (query.source) {
    conditions.push("r.source = :source");
    params.source = query.source;
  }
  if (query.unassigned) {
    conditions.push("(r.department_id IS NULL OR r.assigned_staff_id IS NULL)");
  }
  if (query.openOnly) {
    conditions.push(`r.status NOT IN (${CLOSED_LIST})`);
  }
  if (query.dateFrom) {
    conditions.push("r.date_submitted >= :dateFrom");
    params.dateFrom = query.dateFrom;
  }
  if (query.dateTo) {
    conditions.push("r.date_submitted <= :dateTo");
    params.dateTo = `${query.dateTo}T23:59:59.999Z`;
  }
  if (query.q) {
    conditions.push(
      `(r.citizen_name LIKE :q OR r.reference_number LIKE :q OR r.location LIKE :q
        OR r.description LIKE :q OR r.phone LIKE :q OR r.email LIKE :q)`
    );
    params.q = `%${query.q}%`;
  }

  return {
    sql: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export function listRequests(query: RequestQuery = {}): Paginated<CitizenRequest> {
  const { sql: where, params } = buildWhere(query);
  const pageSize = Math.min(Math.max(query.pageSize ?? DEFAULT_PAGE_SIZE, 1), 200);
  const total = get<{ count: number }>(`SELECT COUNT(*) AS count ${FROM_JOINS} ${where}`, params)
    ?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(query.page ?? 1, 1), pageCount);
  const order = SORT_CLAUSES[query.sort ?? "newest"];

  const items = all<RequestRow>(
    `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} ${where}
      ORDER BY ${order}
      LIMIT :limit OFFSET :offset`,
    { ...params, limit: pageSize, offset: (page - 1) * pageSize }
  ).map(toRequest);

  return { items, total, page, pageSize, pageCount };
}

/** Unpaginated variant used by CSV export. */
export function listAllRequests(query: RequestQuery = {}): CitizenRequest[] {
  const { sql: where, params } = buildWhere(query);
  const order = SORT_CLAUSES[query.sort ?? "newest"];
  return all<RequestRow>(
    `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} ${where} ORDER BY ${order} LIMIT 20000`,
    params
  ).map(toRequest);
}

export function getRequest(id: string): CitizenRequest | null {
  const row = get<RequestRow>(`SELECT ${SELECT_COLUMNS} ${FROM_JOINS} WHERE r.id = :id`, { id });
  return row ? toRequest(row) : null;
}

export function getRequestDetail(id: string): RequestDetail | null {
  const base = getRequest(id);
  if (!base) return null;

  const internalNotes = all<{
    id: string;
    author: string;
    note: string;
    created_at: string;
  }>("SELECT * FROM request_notes WHERE request_id = :id ORDER BY created_at ASC", { id }).map(
    (row): InternalNote => ({
      id: row.id,
      author: row.author,
      note: row.note,
      timestamp: row.created_at,
    })
  );

  const activityHistory = all<{
    id: string;
    actor: string;
    action: string;
    detail: string;
    created_at: string;
  }>("SELECT * FROM request_activity WHERE request_id = :id ORDER BY created_at ASC", { id }).map(
    (row): ActivityEntry => ({
      id: row.id,
      actor: row.actor,
      action: row.action,
      detail: row.detail,
      timestamp: row.created_at,
    })
  );

  return { ...base, internalNotes, activityHistory };
}

export function nextReferenceNumber(kind: RequestKind = "request"): string {
  const prefix = `${kind === "complaint" ? "CMP" : "REQ"}-${new Date().getFullYear()}-`;
  const row = get<{ max_ref: string | null }>(
    "SELECT MAX(reference_number) AS max_ref FROM requests WHERE reference_number LIKE :prefix",
    { prefix: `${prefix}%` }
  );
  const lastNumber = row?.max_ref ? parseInt(row.max_ref.slice(prefix.length), 10) : 0;
  const next = (Number.isNaN(lastNumber) ? 0 : lastNumber) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

function logActivity(
  requestId: string,
  actor: string,
  action: string,
  detail: string,
  timestamp: string
): void {
  run(
    `INSERT INTO request_activity (id, request_id, actor, action, detail, created_at)
     VALUES (:id, :requestId, :actor, :action, :detail, :createdAt)`,
    { id: newId("act"), requestId, actor, action, detail, createdAt: timestamp }
  );
}

function notify(
  requestId: string,
  recipient: string,
  channel: "SMS" | "Email" | "App",
  message: string,
  timestamp: string
): void {
  run(
    `INSERT INTO notifications (id, request_id, recipient, channel, message, created_at)
     VALUES (:id, :requestId, :recipient, :channel, :message, :createdAt)`,
    { id: newId("notif"), requestId, recipient, channel, message, createdAt: timestamp }
  );
}

export interface CreateRequestInput {
  kind?: RequestKind;
  citizenName: string;
  phone?: string;
  email?: string;
  categoryId: string;
  departmentId?: string | null;
  assignedStaffId?: string | null;
  location?: string;
  description: string;
  priority?: Priority;
  status?: RequestStatus;
  source?: RequestSource;
  attachedImage?: string | null;
  dueAt?: string | null;
  dateSubmitted?: string;
}

export function createRequest(input: CreateRequestInput, actor: string): RequestDetail {
  return transaction(() => {
    const category = get<{ id: string; name: string; kind: RequestKind; default_department_id: string | null }>(
      "SELECT id, name, kind, default_department_id FROM categories WHERE id = :id",
      { id: input.categoryId }
    );
    if (!category) throw new Error("Unknown category.");

    const kind = input.kind ?? category.kind;
    const now = new Date().toISOString();
    const submitted = input.dateSubmitted ?? now;
    const id = newId("req");
    const reference = nextReferenceNumber(kind);
    // An explicit department wins; otherwise the category's default routes
    // the request without anyone having to triage it by hand.
    const departmentId =
      input.departmentId !== undefined ? input.departmentId : category.default_department_id;
    const status = input.status ?? "New";

    run(
      `INSERT INTO requests (
         id, reference_number, kind, citizen_name, phone, email, category_id, department_id,
         assigned_staff_id, location, description, priority, status, source, attached_image,
         date_submitted, due_at, resolved_at, created_at, updated_at)
       VALUES (
         :id, :reference, :kind, :citizenName, :phone, :email, :categoryId, :departmentId,
         :assignedStaffId, :location, :description, :priority, :status, :source, :attachedImage,
         :dateSubmitted, :dueAt, :resolvedAt, :createdAt, :updatedAt)`,
      {
        id,
        reference,
        kind,
        citizenName: input.citizenName,
        phone: input.phone ?? "",
        email: input.email ?? "",
        categoryId: category.id,
        departmentId: departmentId ?? null,
        assignedStaffId: input.assignedStaffId ?? null,
        location: input.location ?? "",
        description: input.description,
        priority: input.priority ?? "Normal",
        status,
        source: input.source ?? "staff",
        attachedImage: input.attachedImage ?? null,
        dateSubmitted: submitted,
        dueAt: input.dueAt ?? null,
        resolvedAt: CLOSED_STATUSES.includes(status) ? now : null,
        createdAt: now,
        updatedAt: now,
      }
    );

    logActivity(
      id,
      actor,
      "Request submitted",
      departmentId
        ? `Logged under ${category.name} and routed to the assigned department.`
        : `Logged under ${category.name}, awaiting department assignment.`,
      now
    );

    notify(
      id,
      input.citizenName,
      input.phone ? "SMS" : "Email",
      `Your ${kind} ${reference} ("${category.name}") has been received and logged.`,
      now
    );

    return getRequestDetail(id)!;
  });
}

export interface UpdateRequestInput {
  citizenName?: string;
  phone?: string;
  email?: string;
  categoryId?: string;
  departmentId?: string | null;
  assignedStaffId?: string | null;
  location?: string;
  description?: string;
  priority?: Priority;
  status?: RequestStatus;
  dueAt?: string | null;
  attachedImage?: string | null;
  kind?: RequestKind;
}

/**
 * Applies only the fields present on `input`, writes one activity entry per
 * meaningful change, and emits a citizen notification for the events a
 * citizen would expect to hear about. All of it in one transaction so a
 * failure can't leave a request updated but its history missing.
 */
export function updateRequest(
  id: string,
  input: UpdateRequestInput,
  actor: string
): RequestDetail | null {
  return transaction(() => {
    const current = getRequest(id);
    if (!current) return null;

    const now = new Date().toISOString();
    const sets: string[] = [];
    const params: Record<string, SqlValue> = { id, updatedAt: now };
    const activities: Array<{ action: string; detail: string }> = [];
    const notifications: Array<{ channel: "SMS" | "Email" | "App"; message: string }> = [];

    const channel: "SMS" | "Email" = current.phone ? "SMS" : "Email";

    if (input.citizenName !== undefined && input.citizenName !== current.citizenName) {
      sets.push("citizen_name = :citizenName");
      params.citizenName = input.citizenName;
      activities.push({
        action: "Citizen details updated",
        detail: `Name: ${current.citizenName} → ${input.citizenName}`,
      });
    }
    if (input.phone !== undefined && input.phone !== current.phone) {
      sets.push("phone = :phone");
      params.phone = input.phone;
      activities.push({ action: "Citizen details updated", detail: "Phone number changed." });
    }
    if (input.email !== undefined && input.email !== current.email) {
      sets.push("email = :email");
      params.email = input.email;
      activities.push({ action: "Citizen details updated", detail: "Email address changed." });
    }
    if (input.location !== undefined && input.location !== current.location) {
      sets.push("location = :location");
      params.location = input.location;
      activities.push({
        action: "Location updated",
        detail: `${current.location || "—"} → ${input.location || "—"}`,
      });
    }
    if (input.description !== undefined && input.description !== current.description) {
      sets.push("description = :description");
      params.description = input.description;
      activities.push({ action: "Description updated", detail: "The request text was edited." });
    }
    if (input.attachedImage !== undefined && input.attachedImage !== current.attachedImage) {
      sets.push("attached_image = :attachedImage");
      params.attachedImage = input.attachedImage;
      activities.push({
        action: input.attachedImage ? "Attachment added" : "Attachment removed",
        detail: input.attachedImage ?? "",
      });
    }
    if (input.kind !== undefined && input.kind !== current.kind) {
      sets.push("kind = :kind");
      params.kind = input.kind;
      activities.push({ action: "Type changed", detail: `${current.kind} → ${input.kind}` });
    }

    if (input.categoryId !== undefined && input.categoryId !== current.categoryId) {
      const category = get<{ name: string }>("SELECT name FROM categories WHERE id = :id", {
        id: input.categoryId,
      });
      if (!category) throw new Error("Unknown category.");
      sets.push("category_id = :categoryId");
      params.categoryId = input.categoryId;
      activities.push({
        action: "Category changed",
        detail: `${current.category} → ${category.name}`,
      });
    }

    if (input.departmentId !== undefined && input.departmentId !== current.departmentId) {
      const name = input.departmentId
        ? get<{ name: string }>("SELECT name FROM departments WHERE id = :id", {
            id: input.departmentId,
          })?.name ?? input.departmentId
        : "Unassigned";
      sets.push("department_id = :departmentId");
      params.departmentId = input.departmentId;
      activities.push({
        action: "Department assigned",
        detail: `${current.departmentName ?? "Unassigned"} → ${name}`,
      });
      if (input.departmentId) {
        notifications.push({
          channel,
          message: `Your ${current.kind} ${current.referenceNumber} has been routed to ${name}.`,
        });
      }
    }

    if (input.assignedStaffId !== undefined && input.assignedStaffId !== current.assignedStaffId) {
      const name = input.assignedStaffId
        ? get<{ name: string }>("SELECT name FROM staff WHERE id = :id", {
            id: input.assignedStaffId,
          })?.name ?? input.assignedStaffId
        : "Unassigned";
      sets.push("assigned_staff_id = :assignedStaffId");
      params.assignedStaffId = input.assignedStaffId;
      activities.push({
        action: "Staff assigned",
        detail: `${current.assignedStaffName ?? "Unassigned"} → ${name}`,
      });
    }

    if (input.priority !== undefined && input.priority !== current.priority) {
      sets.push("priority = :priority");
      params.priority = input.priority;
      activities.push({
        action: "Priority changed",
        detail: `${current.priority} → ${input.priority}`,
      });
    }

    if (input.dueAt !== undefined && input.dueAt !== current.dueAt) {
      sets.push("due_at = :dueAt");
      params.dueAt = input.dueAt;
      activities.push({
        action: "Target date changed",
        detail: `${current.dueAt ?? "none"} → ${input.dueAt ?? "none"}`,
      });
    }

    if (input.status !== undefined && input.status !== current.status) {
      sets.push("status = :status");
      params.status = input.status;
      activities.push({
        action: "Status changed",
        detail: `${current.status} → ${input.status}`,
      });

      const nowClosed = CLOSED_STATUSES.includes(input.status);
      // Re-opening a closed request clears the resolution timestamp so
      // resolution-time reporting stays honest.
      sets.push("resolved_at = :resolvedAt");
      params.resolvedAt = nowClosed ? current.resolvedAt ?? now : null;

      notifications.push({
        channel,
        message: `Your ${current.kind} ${current.referenceNumber} is now "${input.status}".`,
      });
    }

    if (!sets.length) return getRequestDetail(id);

    sets.push("updated_at = :updatedAt");
    run(`UPDATE requests SET ${sets.join(", ")} WHERE id = :id`, params);

    for (const activity of activities) {
      logActivity(id, actor, activity.action, activity.detail, now);
    }
    for (const notification of notifications) {
      notify(id, current.citizenName, notification.channel, notification.message, now);
    }

    return getRequestDetail(id);
  });
}

export function addInternalNote(id: string, note: string, author: string): RequestDetail | null {
  return transaction(() => {
    const current = getRequest(id);
    if (!current) return null;

    const now = new Date().toISOString();
    run(
      `INSERT INTO request_notes (id, request_id, author, note, created_at)
       VALUES (:id, :requestId, :author, :note, :createdAt)`,
      { id: newId("note"), requestId: id, author, note, createdAt: now }
    );
    logActivity(id, author, "Internal note added", note, now);
    run("UPDATE requests SET updated_at = :updatedAt WHERE id = :id", { id, updatedAt: now });

    return getRequestDetail(id);
  });
}

export function deleteNote(noteId: string): boolean {
  return run("DELETE FROM request_notes WHERE id = :id", { id: noteId }).changes > 0;
}

export function deleteRequest(id: string): boolean {
  // request_notes and request_activity cascade; notifications keep their
  // row with a null request_id so the citizen-contact record survives.
  return run("DELETE FROM requests WHERE id = :id", { id }).changes > 0;
}

export interface PublicTrackingEvent {
  action: string;
  detail: string;
  timestamp: string;
}

export interface PublicTrackingStatus {
  referenceNumber: string;
  kind: RequestKind;
  category: string;
  departmentName: string | null;
  status: RequestStatus;
  priority: Priority;
  dateSubmitted: string;
  updatedAt: string;
  resolvedAt: string | null;
  timeline: PublicTrackingEvent[];
}

// Only activity types safe to show a citizen — excludes internal notes,
// staff-assignment names, and other back-office bookkeeping.
const PUBLIC_ACTIVITY_ACTIONS = new Set(["Request submitted", "Status changed", "Department assigned"]);

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Public-facing lookup for the "track your complaint" page: finds a request
 * by its reference number, but only returns anything if the caller also
 * supplies the phone or email on file — the reference number alone isn't
 * treated as a secret, so this prevents scraping other citizens' cases.
 */
export function getRequestForTracking(reference: string, contact: string): PublicTrackingStatus | null {
  const normalizedRef = reference.trim().toUpperCase();
  const trimmedContact = contact.trim();
  if (!normalizedRef || !trimmedContact) return null;

  const row = get<RequestRow>(
    `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} WHERE r.reference_number = :reference`,
    { reference: normalizedRef }
  );
  if (!row) return null;

  const request = toRequest(row);
  const phoneMatch =
    !!request.phone && normalizePhone(request.phone) !== "" && normalizePhone(request.phone) === normalizePhone(trimmedContact);
  const emailMatch = !!request.email && request.email.toLowerCase() === trimmedContact.toLowerCase();
  if (!phoneMatch && !emailMatch) return null;

  const timeline = all<{ action: string; detail: string; created_at: string }>(
    "SELECT action, detail, created_at FROM request_activity WHERE request_id = :id ORDER BY created_at ASC",
    { id: request.id }
  )
    .filter((entry) => PUBLIC_ACTIVITY_ACTIONS.has(entry.action))
    .map((entry): PublicTrackingEvent => ({
      action: entry.action,
      detail: entry.detail,
      timestamp: entry.created_at,
    }));

  return {
    referenceNumber: request.referenceNumber,
    kind: request.kind,
    category: request.category,
    departmentName: request.departmentName,
    status: request.status,
    priority: request.priority,
    dateSubmitted: request.dateSubmitted,
    updatedAt: request.updatedAt,
    resolvedAt: request.resolvedAt,
    timeline,
  };
}

export function countRequests(query: RequestQuery = {}): number {
  const { sql: where, params } = buildWhere(query);
  return get<{ count: number }>(`SELECT COUNT(*) AS count ${FROM_JOINS} ${where}`, params)?.count ?? 0;
}
