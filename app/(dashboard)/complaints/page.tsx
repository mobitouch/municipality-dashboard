import type { Metadata } from "next";

import { RequestListPage, type SearchParams } from "@/components/requests/request-list-page";

export const metadata: Metadata = { title: "Complaints" };
export const dynamic = "force-dynamic";

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <RequestListPage
      kind="complaint"
      basePath="/complaints"
      title="Complaints"
      subtitle="Issues residents have reported for the municipality to address."
      searchParams={await searchParams}
    />
  );
}
