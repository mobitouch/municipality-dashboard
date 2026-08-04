import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authenticate, requireSession, unauthorized } from "@/lib/auth/request-auth";
import { can } from "@/lib/auth/permissions";
import { listAllRequests, type RequestSort } from "@/lib/data/requests";
import { toCsv } from "@/lib/format";
import type { RequestKind } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Streams the current filter selection as a spreadsheet-ready CSV. */
export async function GET(request: NextRequest) {
  const caller = authenticate(request);
  if (!caller) return unauthorized();

  const user = requireSession(caller);
  if (!user || !can(user.role, "reports:export")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const requests = listAllRequests({
    kind: (params.get("kind") as RequestKind) || undefined,
    status: params.get("status") ?? undefined,
    departmentId: params.get("departmentId") ?? undefined,
    categoryId: params.get("categoryId") ?? undefined,
    assignedStaffId: params.get("assignedStaffId") ?? undefined,
    priority: params.get("priority") ?? undefined,
    q: params.get("q") ?? undefined,
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
    sort: (params.get("sort") as RequestSort) || undefined,
  });

  const csv = toCsv(
    requests.map((entry) => ({
      Reference: entry.referenceNumber,
      Type: entry.kind,
      Status: entry.status,
      Priority: entry.priority,
      Category: entry.category,
      Department: entry.departmentName ?? "Unassigned",
      "Assigned to": entry.assignedStaffName ?? "",
      Citizen: entry.citizenName,
      Phone: entry.phone,
      Email: entry.email,
      Location: entry.location,
      Description: entry.description,
      Source: entry.source,
      Submitted: entry.dateSubmitted,
      "Target date": entry.dueAt ?? "",
      Resolved: entry.resolvedAt ?? "",
    }))
  );

  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(`﻿${csv}`, {
    headers: {
      // The BOM makes Excel open UTF-8 correctly on Windows.
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="requests-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
