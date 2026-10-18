import { useParams } from "react-router";

import { PageShell } from "@/components/app-shell/page-shell";
import { PageSkeleton } from "@/components/app-shell/page-skeleton";
import { RequestDetailView } from "@/components/requests/request-detail-view";
import { useCan } from "@/lib/client/session";
import { useDocumentTitle } from "@/lib/client/use-document-title";
import { usePageData } from "@/lib/client/use-page-data";
import type { RequestDetailData } from "@/lib/page-data";
import type { RequestKind } from "@/lib/types";
import { NotFoundPage } from "./not-found";

const COPY: Record<RequestKind, { title: string; basePath: string; backLabel: string; missing: string }> = {
  request: {
    title: "Request details",
    basePath: "/requests",
    backLabel: "Back to Citizen Requests",
    missing: "Request not found",
  },
  complaint: {
    title: "Complaint details",
    basePath: "/complaints",
    backLabel: "Back to Complaints",
    missing: "Complaint not found",
  },
};

export function RequestDetailPage({ kind }: { kind: RequestKind }) {
  const copy = COPY[kind];
  const { id = "" } = useParams();
  const canUpdate = useCan("requests:update");
  const canAssign = useCan("requests:assign");
  const canDelete = useCan("requests:delete");

  const { data, notFound } = usePageData<RequestDetailData>(
    `/api/app/pages/requests/${encodeURIComponent(id)}`
  );
  useDocumentTitle(data ? data.request.referenceNumber : notFound ? copy.missing : copy.title);

  if (notFound) return <NotFoundPage />;
  if (!data) return <PageSkeleton />;

  const { request, departments, categories, staff } = data;

  return (
    <PageShell title={copy.title} subtitle={request.referenceNumber}>
      <RequestDetailView
        request={request}
        departments={departments}
        categories={categories}
        staff={staff}
        basePath={copy.basePath}
        backLabel={copy.backLabel}
        canEdit={canUpdate}
        canAssign={canAssign || canUpdate}
        canDelete={canDelete}
      />
    </PageShell>
  );
}
