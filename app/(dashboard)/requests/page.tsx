import { readDb } from "@/lib/db";
import { filterRequests } from "@/lib/requests";
import { CATEGORIES } from "@/lib/constants";
import PageShell from "@/components/PageShell";
import RequestFilters from "@/components/RequestFilters";
import RequestsTable from "@/components/RequestsTable";

export const dynamic = "force-dynamic";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const db = readDb();
  const results = filterRequests(db.requests, { ...params, kind: "request" });
  const categories = CATEGORIES.filter((c) => c.kind === "request").map((c) => c.name);

  return (
    <PageShell
      title="Citizen Requests"
      subtitle={`${results.length} of ${db.requests.filter((r) => r.kind === "request").length} requests`}
    >
      <RequestFilters departments={db.departments} categories={categories} />
      <RequestsTable requests={results} departments={db.departments} basePath="/requests" />
    </PageShell>
  );
}
