import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authenticate, unauthorized } from "@/lib/auth/request-auth";
import { can } from "@/lib/auth/permissions";
import { findCategoryByName } from "@/lib/data/categories";
import { createRequest, listRequests, type RequestSort } from "@/lib/data/requests";
import { externalRequestSchema } from "@/lib/validation";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { RequestKind } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const caller = authenticate(request);
  if (!caller) return unauthorized();

  const params = request.nextUrl.searchParams;
  const results = listRequests({
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
    page: Number(params.get("page")) || 1,
    pageSize: Number(params.get("pageSize")) || DEFAULT_PAGE_SIZE,
  });

  return NextResponse.json(results);
}

/**
 * The intake endpoint. The municipal website's Contact and "Report an
 * Issue" forms post here server-to-server, as does the n8n chatbot flow.
 */
export async function POST(request: NextRequest) {
  const caller = authenticate(request);
  if (!caller) return unauthorized();

  if (caller.kind === "session" && !can(caller.user.role, "requests:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const parsed = externalRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const category = findCategoryByName(parsed.data.category);
  if (!category) {
    return NextResponse.json(
      { error: `Unknown category "${parsed.data.category}".` },
      { status: 400 }
    );
  }
  if (!category.isActive) {
    return NextResponse.json(
      { error: `Category "${category.name}" is no longer accepting submissions.` },
      { status: 400 }
    );
  }

  // An explicit source always wins; otherwise key-authenticated callers are
  // the chatbot by convention, matching the existing n8n workflow.
  const source =
    parsed.data.source ?? (caller.kind === "apiKey" ? "chatbot" : "staff");

  const actor =
    caller.kind === "session" ? caller.user.name : `Integration (${caller.label})`;

  const created = createRequest(
    {
      kind: parsed.data.kind ?? category.kind,
      citizenName: parsed.data.citizenName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      categoryId: category.id,
      location: parsed.data.location,
      description: parsed.data.description,
      priority: parsed.data.priority,
      source,
      attachedImage: parsed.data.attachedImage ?? null,
    },
    actor
  );

  return NextResponse.json({ request: created }, { status: 201 });
}
