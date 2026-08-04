import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PageShell } from "@/components/app-shell/page-shell";
import { RequestDetailView } from "@/components/requests/request-detail-view";
import { requireUser } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { listCategories } from "@/lib/data/categories";
import { listDepartments } from "@/lib/data/departments";
import { getRequestDetail } from "@/lib/data/requests";
import { listStaff } from "@/lib/data/staff";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const request = getRequestDetail(id);
  return { title: request ? request.referenceNumber : "Complaint not found" };
}

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const request = getRequestDetail(id);
  if (!request) notFound();

  return (
    <PageShell title="Complaint details" subtitle={request.referenceNumber}>
      <RequestDetailView
        request={request}
        departments={listDepartments()}
        categories={listCategories()}
        staff={listStaff()}
        basePath="/complaints"
        backLabel="Back to Complaints"
        canEdit={can(user.role, "requests:update")}
        canAssign={can(user.role, "requests:assign") || can(user.role, "requests:update")}
        canDelete={can(user.role, "requests:delete")}
      />
    </PageShell>
  );
}
