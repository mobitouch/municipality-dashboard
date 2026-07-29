import type { DB } from "./types";
import { CLOSED_STATUSES } from "./constants";

const ACTIVE_STATUSES = ["Under Review", "Assigned", "In Progress"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function buildSummary(db: DB) {
  const { requests, departments } = db;
  const deptNameById = new Map(departments.map((d) => [d.id, d.name]));

  const newCount = requests.filter((r) => r.status === "New").length;
  const inProgressCount = requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;
  const resolvedCount = requests.filter((r) => r.status === "Resolved" || r.status === "Closed").length;
  const urgentCount = requests.filter((r) => r.priority === "Urgent").length;

  const resolutionDurations = requests
    .filter((r) => r.resolvedAt)
    .map((r) => (new Date(r.resolvedAt as string).getTime() - new Date(r.dateSubmitted).getTime()) / 86400000);
  const avgResolutionDays = resolutionDurations.length
    ? Math.round((resolutionDurations.reduce((a, b) => a + b, 0) / resolutionDurations.length) * 10) / 10
    : 0;

  const byDepartmentMap = new Map<string, number>();
  requests.forEach((r) => {
    const key = r.departmentId ? (deptNameById.get(r.departmentId) ?? r.departmentId) : "Unassigned";
    byDepartmentMap.set(key, (byDepartmentMap.get(key) ?? 0) + 1);
  });
  const byDepartment = Array.from(byDepartmentMap, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count
  );

  const byCategoryMap = new Map<string, number>();
  requests.forEach((r) => {
    byCategoryMap.set(r.category, (byCategoryMap.get(r.category) ?? 0) + 1);
  });
  const byCategory = Array.from(byCategoryMap, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count
  );

  const byStatusMap = new Map<string, number>();
  requests.forEach((r) => {
    byStatusMap.set(r.status, (byStatusMap.get(r.status) ?? 0) + 1);
  });
  const byStatus = Array.from(byStatusMap, ([name, count]) => ({ name, count }));

  const resolutionByDeptMap = new Map<string, number[]>();
  requests
    .filter((r) => r.resolvedAt && r.departmentId)
    .forEach((r) => {
      const key = deptNameById.get(r.departmentId as string) ?? (r.departmentId as string);
      const days = (new Date(r.resolvedAt as string).getTime() - new Date(r.dateSubmitted).getTime()) / 86400000;
      const arr = resolutionByDeptMap.get(key) ?? [];
      arr.push(days);
      resolutionByDeptMap.set(key, arr);
    });
  const resolutionPerformance = Array.from(resolutionByDeptMap, ([name, durations]) => ({
    name,
    avgDays: Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10,
    resolvedCount: durations.length,
  })).sort((a, b) => a.avgDays - b.avgDays);

  const perMonthMap = new Map<string, number>();
  requests.forEach((r) => {
    const d = new Date(r.dateSubmitted);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    perMonthMap.set(key, (perMonthMap.get(key) ?? 0) + 1);
  });
  const perMonth = Array.from(perMonthMap, ([key, count]) => {
    const [year, month] = key.split("-");
    return { key, label: `${MONTH_LABELS[parseInt(month, 10) - 1]} ${year}`, count };
  }).sort((a, b) => (a.key < b.key ? -1 : 1));

  const urgentUnresolved = requests
    .filter((r) => r.priority === "Urgent" && !CLOSED_STATUSES.includes(r.status))
    .map((r) => ({
      id: r.id,
      referenceNumber: r.referenceNumber,
      citizenName: r.citizenName,
      category: r.category,
      departmentName: r.departmentId ? (deptNameById.get(r.departmentId) ?? r.departmentId) : "Unassigned",
      status: r.status,
      dateSubmitted: r.dateSubmitted,
    }))
    .sort((a, b) => (a.dateSubmitted < b.dateSubmitted ? -1 : 1));

  const mostCommonCategory = byCategory[0]?.name ?? "—";

  return {
    totals: {
      total: requests.length,
      new: newCount,
      inProgress: inProgressCount,
      resolved: resolvedCount,
      urgent: urgentCount,
      avgResolutionDays,
    },
    byDepartment,
    byCategory,
    byStatus,
    resolutionPerformance,
    perMonth,
    urgentUnresolved,
    mostCommonCategory,
  };
}

export type ReportSummary = ReturnType<typeof buildSummary>;
