import "server-only";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { RequestQuery, RequestSort } from "@/lib/data/requests";
import {
  PRIORITIES,
  REQUEST_KINDS,
  REQUEST_STATUSES,
  type RequestKind,
} from "@/lib/types";

const SORTS: readonly RequestSort[] = [
  "newest",
  "oldest",
  "priority",
  "status",
  "reference",
  "updated",
];

/**
 * `sort` is the one filter that reaches SQL as an identifier rather than a
 * bound value: `listRequests` looks it up in SORT_CLAUSES and splices the
 * result into `ORDER BY`. The lookup itself is safe — an unknown key can only
 * ever yield a value already in that table — but an unknown key yields
 * `undefined`, which produced `ORDER BY undefined` and a 500. `?sort=x`, or
 * `?sort=constructor`, was enough to error the requests list and the export
 * for any authenticated caller. Validating against the allowlist turns that
 * into a silent fall back to the default ordering.
 */
function parseSort(value: string | null): RequestSort | undefined {
  return SORTS.includes(value as RequestSort) ? (value as RequestSort) : undefined;
}

/**
 * The enum-shaped filters are bound parameters, so an unexpected value was
 * never injectable — it just silently matched nothing. Validating them anyway
 * means a typo'd filter returns the unfiltered list rather than a confusing
 * empty one, and keeps the API's contract honest.
 */
function parseFrom<T extends string>(allowed: readonly T[], value: string | null): T | undefined {
  return value && allowed.includes(value as T) ? (value as T) : undefined;
}

/** ISO date (YYYY-MM-DD) as produced by `<input type="date">`. */
function parseDate(value: string | null): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return Number.isNaN(new Date(value).getTime()) ? undefined : value;
}

function parseInteger(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

/**
 * Free-text search feeds a `LIKE :q` with `%...%` around it. Bound, so not
 * injectable, but `%` and `_` are wildcards inside LIKE — an unbounded string
 * of them makes SQLite walk the table pathologically. Capping the length and
 * stripping the wildcards keeps the search a search.
 */
function parseSearch(value: string | null): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/[%_\\]/g, " ").trim().slice(0, 120);
  return cleaned || undefined;
}

/**
 * Shared by the requests list and the CSV export, which previously each
 * parsed these params inline — and identically wrongly.
 */
export function parseRequestQuery(
  params: URLSearchParams,
  options: { paginated: boolean } = { paginated: true }
): RequestQuery {
  const query: RequestQuery = {
    kind: parseFrom<RequestKind>(REQUEST_KINDS, params.get("kind")),
    status: parseFrom(REQUEST_STATUSES, params.get("status")),
    priority: parseFrom(PRIORITIES, params.get("priority")),
    departmentId: params.get("departmentId")?.slice(0, 64) || undefined,
    categoryId: params.get("categoryId")?.slice(0, 64) || undefined,
    assignedStaffId: params.get("assignedStaffId")?.slice(0, 64) || undefined,
    q: parseSearch(params.get("q")),
    dateFrom: parseDate(params.get("dateFrom")),
    dateTo: parseDate(params.get("dateTo")),
    sort: parseSort(params.get("sort")),
  };

  if (options.paginated) {
    query.page = parseInteger(params.get("page"), 1, 1, 100_000);
    query.pageSize = parseInteger(params.get("pageSize"), DEFAULT_PAGE_SIZE, 1, 200);
  }

  return query;
}
