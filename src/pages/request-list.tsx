import { DownloadIcon, PlusIcon } from "lucide-react";

import { RequestFilters } from "@/components/requests/request-filters";
import { RequestFormDialog } from "@/components/requests/request-form-dialog";
import { RequestsTable } from "@/components/requests/requests-table";
import { AutoRefresh } from "@/components/auto-refresh";
import { PageShell } from "@/components/app-shell/page-shell";
import { PageSkeleton } from "@/components/app-shell/page-skeleton";
import { Pagination } from "@/components/pagination";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSearchParams } from "@/lib/client/navigation";
import { useCan, useSession } from "@/lib/client/session";
import { useDocumentTitle } from "@/lib/client/use-document-title";
import { usePageData } from "@/lib/client/use-page-data";
import type { RequestListData } from "@/lib/page-data";
import type { RequestKind } from "@/lib/types";
import { pluralize } from "@/lib/format";

export function RequestListPage({
  kind,
  basePath,
  title,
  subtitle,
}: {
  kind: RequestKind;
  basePath: string;
  title: string;
  subtitle: string;
}) {
  useDocumentTitle(title);
  const searchParams = useSearchParams();
  const { session } = useSession();
  const canCreate = useCan("requests:create");
  const canExport = useCan("reports:export");

  // Only the filter params belong in pagination links — `page` is replaced.
  const linkParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key !== "page" && value) linkParams[key] = value;
  });

  const query = new URLSearchParams(searchParams);
  query.set("kind", kind);
  const { data } = usePageData<RequestListData>(`/api/app/pages/requests?${query.toString()}`);

  if (!data) return <PageSkeleton />;

  const { results, departments, categories, staff } = data;

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
      <AutoRefresh intervalSeconds={session?.settings.autoRefreshSeconds} />

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
