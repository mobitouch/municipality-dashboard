import "server-only";

import { all, get, type SqlValue } from "@/lib/db/client";
import { CLOSED_STATUSES, type RequestStatus } from "@/lib/types";

const CLOSED_LIST = CLOSED_STATUSES.map((status) => `'${status}'`).join(", ");
const ACTIVE_LIST = ["Under Review", "Assigned", "In Progress"].map((s) => `'${s}'`).join(", ");

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export interface ReportRange {
  dateFrom?: string;
  dateTo?: string;
}

function rangeClause(range: ReportRange, alias = "r"): {
  sql: string;
  params: Record<string, SqlValue>;
} {
  const conditions: string[] = [];
  const params: Record<string, SqlValue> = {};
  if (range.dateFrom) {
    conditions.push(`${alias}.date_submitted >= :dateFrom`);
    params.dateFrom = range.dateFrom;
  }
  if (range.dateTo) {
    conditions.push(`${alias}.date_submitted <= :dateTo`);
    params.dateTo = `${range.dateTo}T23:59:59.999Z`;
  }
  return { sql: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", params };
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface ReportSummary {
  totals: {
    total: number;
    new: number;
    inProgress: number;
    resolved: number;
    urgent: number;
    unassigned: number;
    overdue: number;
    avgResolutionDays: number;
  };
  byDepartment: NamedCount[];
  byCategory: NamedCount[];
  byStatus: NamedCount[];
  byPriority: NamedCount[];
  bySource: NamedCount[];
  resolutionPerformance: Array<{ name: string; avgDays: number; resolvedCount: number }>;
  perMonth: Array<{ key: string; label: string; count: number; resolved: number }>;
  urgentUnresolved: Array<{
    id: string;
    referenceNumber: string;
    citizenName: string;
    category: string;
    departmentName: string;
    status: RequestStatus;
    dateSubmitted: string;
    ageDays: number;
  }>;
  mostCommonCategory: string;
}

/**
 * Every figure on the Reports and Overview screens comes from these
 * aggregates. They run as GROUP BY queries against indexed columns rather
 * than loading the request table into memory, so the page cost stays flat
 * as the archive grows.
 */
export function buildSummary(range: ReportRange = {}): ReportSummary {
  const { sql: where, params } = rangeClause(range);

  const totals =
    get<{
      total: number;
      new_count: number;
      in_progress: number;
      resolved: number;
      urgent: number;
      unassigned: number;
      overdue: number;
      avg_resolution: number | null;
    }>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN r.status = 'New' THEN 1 ELSE 0 END) AS new_count,
              SUM(CASE WHEN r.status IN (${ACTIVE_LIST}) THEN 1 ELSE 0 END) AS in_progress,
              SUM(CASE WHEN r.status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) AS resolved,
              SUM(CASE WHEN r.priority = 'Urgent' THEN 1 ELSE 0 END) AS urgent,
              SUM(CASE WHEN r.department_id IS NULL OR r.assigned_staff_id IS NULL THEN 1 ELSE 0 END) AS unassigned,
              SUM(CASE WHEN r.due_at IS NOT NULL AND r.due_at < :now
                        AND r.status NOT IN (${CLOSED_LIST}) THEN 1 ELSE 0 END) AS overdue,
              AVG(CASE WHEN r.resolved_at IS NOT NULL
                       THEN julianday(r.resolved_at) - julianday(r.date_submitted) END) AS avg_resolution
         FROM requests r ${where}`,
      { ...params, now: new Date().toISOString() }
    ) ?? null;

  const byDepartment = all<NamedCount>(
    `SELECT COALESCE(d.name, 'Unassigned') AS name, COUNT(*) AS count
       FROM requests r
       LEFT JOIN departments d ON d.id = r.department_id
       ${where}
      GROUP BY name
      ORDER BY count DESC`,
    params
  );

  const byCategory = all<NamedCount>(
    `SELECT c.name AS name, COUNT(*) AS count
       FROM requests r
       JOIN categories c ON c.id = r.category_id
       ${where}
      GROUP BY c.id
      ORDER BY count DESC`,
    params
  );

  const byStatus = all<NamedCount>(
    `SELECT r.status AS name, COUNT(*) AS count FROM requests r ${where} GROUP BY r.status`,
    params
  );

  const byPriority = all<NamedCount>(
    `SELECT r.priority AS name, COUNT(*) AS count FROM requests r ${where} GROUP BY r.priority`,
    params
  );

  const bySource = all<NamedCount>(
    `SELECT r.source AS name, COUNT(*) AS count FROM requests r ${where} GROUP BY r.source ORDER BY count DESC`,
    params
  );

  const resolutionPerformance = all<{ name: string; avg_days: number; resolved_count: number }>(
    `SELECT COALESCE(d.name, 'Unassigned') AS name,
            AVG(julianday(r.resolved_at) - julianday(r.date_submitted)) AS avg_days,
            COUNT(*) AS resolved_count
       FROM requests r
       LEFT JOIN departments d ON d.id = r.department_id
       ${where ? `${where} AND` : "WHERE"} r.resolved_at IS NOT NULL
      GROUP BY name
      ORDER BY avg_days ASC`,
    params
  ).map((row) => ({
    name: row.name,
    avgDays: Math.round((row.avg_days ?? 0) * 10) / 10,
    resolvedCount: row.resolved_count,
  }));

  const perMonth = all<{ key: string; count: number; resolved: number }>(
    `SELECT substr(r.date_submitted, 1, 7) AS key,
            COUNT(*) AS count,
            SUM(CASE WHEN r.resolved_at IS NOT NULL THEN 1 ELSE 0 END) AS resolved
       FROM requests r ${where}
      GROUP BY key
      ORDER BY key ASC`,
    params
  ).map((row) => {
    const [year, month] = row.key.split("-");
    return {
      key: row.key,
      label: `${MONTH_LABELS[Number(month) - 1] ?? month} ${year}`,
      count: row.count,
      resolved: row.resolved,
    };
  });

  const urgentUnresolved = all<{
    id: string;
    reference_number: string;
    citizen_name: string;
    category_name: string;
    department_name: string | null;
    status: RequestStatus;
    date_submitted: string;
    age_days: number;
  }>(
    `SELECT r.id, r.reference_number, r.citizen_name, r.status, r.date_submitted,
            c.name AS category_name, d.name AS department_name,
            julianday('now') - julianday(r.date_submitted) AS age_days
       FROM requests r
       JOIN categories c ON c.id = r.category_id
       LEFT JOIN departments d ON d.id = r.department_id
       ${where ? `${where} AND` : "WHERE"} r.priority = 'Urgent' AND r.status NOT IN (${CLOSED_LIST})
      ORDER BY r.date_submitted ASC
      LIMIT 50`,
    params
  ).map((row) => ({
    id: row.id,
    referenceNumber: row.reference_number,
    citizenName: row.citizen_name,
    category: row.category_name,
    departmentName: row.department_name ?? "Unassigned",
    status: row.status,
    dateSubmitted: row.date_submitted,
    ageDays: Math.floor(row.age_days ?? 0),
  }));

  return {
    totals: {
      total: totals?.total ?? 0,
      new: totals?.new_count ?? 0,
      inProgress: totals?.in_progress ?? 0,
      resolved: totals?.resolved ?? 0,
      urgent: totals?.urgent ?? 0,
      unassigned: totals?.unassigned ?? 0,
      overdue: totals?.overdue ?? 0,
      avgResolutionDays: Math.round((totals?.avg_resolution ?? 0) * 10) / 10,
    },
    byDepartment,
    byCategory,
    byStatus,
    byPriority,
    bySource,
    resolutionPerformance,
    perMonth,
    urgentUnresolved,
    mostCommonCategory: byCategory[0]?.name ?? "—",
  };
}

/** Feeds the “recent activity” panel on the Overview screen. */
export function recentActivity(limit = 8) {
  return all<{
    id: string;
    request_id: string;
    reference_number: string;
    actor: string;
    action: string;
    detail: string;
    created_at: string;
  }>(
    `SELECT a.*, r.reference_number
       FROM request_activity a
       JOIN requests r ON r.id = a.request_id
      ORDER BY a.created_at DESC
      LIMIT :limit`,
    { limit }
  ).map((row) => ({
    id: row.id,
    requestId: row.request_id,
    referenceNumber: row.reference_number,
    actor: row.actor,
    action: row.action,
    detail: row.detail,
    timestamp: row.created_at,
  }));
}
