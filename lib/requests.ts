import type { CitizenRequest, RequestKind } from "./types";

export interface RequestFilters {
  kind?: RequestKind;
  status?: string;
  departmentId?: string;
  category?: string;
  priority?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function filterRequests(requests: CitizenRequest[], filters: RequestFilters): CitizenRequest[] {
  let results = [...requests];

  if (filters.kind) results = results.filter((r) => r.kind === filters.kind);
  if (filters.status) results = results.filter((r) => r.status === filters.status);
  if (filters.departmentId) results = results.filter((r) => r.departmentId === filters.departmentId);
  if (filters.category) results = results.filter((r) => r.category === filters.category);
  if (filters.priority) results = results.filter((r) => r.priority === filters.priority);
  if (filters.dateFrom) results = results.filter((r) => r.dateSubmitted >= filters.dateFrom!);
  if (filters.dateTo) results = results.filter((r) => r.dateSubmitted <= filters.dateTo + "T23:59:59.999Z");
  if (filters.q) {
    const q = filters.q.toLowerCase();
    results = results.filter(
      (r) =>
        r.citizenName.toLowerCase().includes(q) ||
        r.referenceNumber.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }

  results.sort((a, b) => (a.dateSubmitted < b.dateSubmitted ? 1 : -1));
  return results;
}
