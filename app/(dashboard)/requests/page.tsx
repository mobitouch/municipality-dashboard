import type { Metadata } from "next";

import { RequestListPage, type SearchParams } from "@/components/requests/request-list-page";

export const metadata: Metadata = { title: "Citizen Requests" };
export const dynamic = "force-dynamic";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <RequestListPage
      kind="request"
      basePath="/requests"
      title="Citizen Requests"
      subtitle="Service requests raised by residents."
      searchParams={await searchParams}
    />
  );
}
