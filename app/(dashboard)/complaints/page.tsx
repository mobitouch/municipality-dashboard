import { readDb } from "@/lib/db";
import { filterRequests } from "@/lib/requests";
import { CATEGORIES } from "@/lib/constants";
import PageShell from "@/components/PageShell";
import RequestFilters from "@/components/RequestFilters";
import RequestsTable from "@/components/RequestsTable";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const db = readDb();
  const results = filterRequests(db.requests, { ...params, kind: "complaint" });
  const categories = CATEGORIES.filter((c) => c.kind === "complaint").map((c) => c.name);

  return (
    <PageShell
      title="Complaints"
      subtitle={`${results.length} of ${db.requests.filter((r) => r.kind === "complaint").length} complaints`}
    >
      <AutoRefresh />
      <RequestFilters departments={db.departments} categories={categories} />
      <RequestsTable requests={results} departments={db.departments} basePath="/complaints" />
    </PageShell>
  );
}
