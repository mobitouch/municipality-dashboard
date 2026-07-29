import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";
import PageShell from "@/components/PageShell";
import RequestDetail from "@/components/RequestDetail";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDb();
  const request = db.requests.find((r) => r.id === id);
  if (!request) notFound();

  return (
    <PageShell title="Request Details" subtitle={request.referenceNumber}>
      <RequestDetail
        request={request}
        departments={db.departments}
        staff={db.staff}
        basePath="/requests"
        backLabel="Back to Citizen Requests"
      />
    </PageShell>
  );
}
