import { DownloadIcon, PlusIcon } from "lucide-react";

import { RequestFilters } from "./request-filters";
import { RequestFormDialog } from "./request-form-dialog";
import { RequestsTable } from "./requests-table";
import { AutoRefresh } from "@/components/auto-refresh";
import { PageShell } from "@/components/app-shell/page-shell";
import { Pagination } from "@/components/pagination";
import { Button, buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { listCategories } from "@/lib/data/categories";
import { listDepartments } from "@/lib/data/departments";
import { listRequests, type RequestSort } from "@/lib/data/requests";
import { getSettings } from "@/lib/data/settings";
import { listStaff } from "@/lib/data/staff";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { RequestKind } from "@/lib/types";
import { pluralize } from "@/lib/format";

const SORTS: RequestSort[] = ["newest", "oldest", "priority", "status", "reference", "updated"];

export type SearchParams = Record<string, string | string[] | undefined>;

function single(params: SearchParams, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export async function RequestListPage({
  kind,
  basePath,
  title,
  subtitle,
  searchParams,
}: {
  kind: RequestKind;
  basePath: string;
  title: string;
  subtitle: string;
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const settings = getSettings();

  const sortParam = single(searchParams, "sort");
  const page = Number(single(searchParams, "page")) || 1;

  const query = {
    kind,
    status: single(searchParams, "status"),
    departmentId: single(searchParams, "departmentId"),
    categoryId: single(searchParams, "categoryId"),
    assignedStaffId: single(searchParams, "assignedStaffId"),
    priority: single(searchParams, "priority"),
    q: single(searchParams, "q"),
    dateFrom: single(searchParams, "dateFrom"),
    dateTo: single(searchParams, "dateTo"),
    sort: (SORTS as string[]).includes(sortParam) ? (sortParam as RequestSort) : "newest",
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  };

  const [results, departments, categories, staff] = [
    listRequests(query),
    listDepartments(),
    listCategories({ includeInactive: false }),
    listStaff(),
  ];

  const canCreate = can(user.role, "requests:create");
  const canExport = can(user.role, "reports:export");

  // Only the filter params belong in pagination links — `page` is replaced.
  const linkParams = Object.fromEntries(
    Object.entries(searchParams)
      .filter(([key, value]) => key !== "page" && typeof value === "string" && value)
      .map(([key, value]) => [key, value as string])
  );

  const exportQuery = new URLSearchParams({ ...linkParams, kind });

  return (
    <PageShell
      title={title}
      subtitle={`${pluralize(results.total, kind === "complaint" ? "complaint" : "request")} match the current filters`}
      actions={
        <>
          {canExport && (
            <a
              href={`/api/requests/export?${exportQuery.toString()}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <DownloadIcon />
              <span className="hidden sm:inline">Export CSV</span>
            </a>
          )}
          {canCreate && (
            <RequestFormDialog
              trigger={
                <Button size="sm">
                  <PlusIcon />
                  <span className="hidden sm:inline">New {kind}</span>
                </Button>
              }
              departments={departments}
              categories={categories}
              staff={staff}
              defaultKind={kind}
            />
          )}
        </>
      }
    >
      <AutoRefresh intervalSeconds={settings.autoRefreshSeconds} />

      <RequestFilters departments={departments} categories={categories} staff={staff} />

      <RequestsTable
        requests={results.items}
        basePath={basePath}
        emptyTitle={
          Object.keys(linkParams).length
            ? "No matches"
            : `No ${kind === "complaint" ? "complaints" : "requests"} yet`
        }
        emptyDescription={
          Object.keys(linkParams).length
            ? "Try widening the filters, or clear them to see everything."
            : `${subtitle} Submissions from the website and chatbot appear here automatically.`
        }
      />

      <Pagination
        basePath={basePath}
        params={linkParams}
        page={results.page}
        pageCount={results.pageCount}
        total={results.total}
        pageSize={results.pageSize}
        itemLabel={kind === "complaint" ? "complaints" : "requests"}
      />
    </PageShell>
  );
}
