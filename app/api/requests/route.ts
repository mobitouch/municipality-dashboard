import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readDb, writeDb, nextReferenceNumber, newId } from "@/lib/db";
import { hasSession, hasApiKey } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { filterRequests } from "@/lib/requests";
import type { CitizenRequest, RequestSource } from "@/lib/types";

const VALID_SOURCES: RequestSource[] = ["website", "chatbot", "phone", "walk-in"];

function isValidSource(value: unknown): value is RequestSource {
  return typeof value === "string" && (VALID_SOURCES as string[]).includes(value);
}

// Mirrors scripts/seed.mjs's sourceLabel() so live-created requests read the
// same way as seeded demo ones.
function sourceLabel(source: RequestSource): string {
  if (source === "chatbot") return "Citizen (via chatbot)";
  if (source === "website") return "Citizen (via website)";
  if (source === "phone") return "Citizen (via phone)";
  return "Citizen (walk-in)";
}

export async function GET(request: NextRequest) {
  if (!hasSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = readDb();
  const params = request.nextUrl.searchParams;
  const results = filterRequests(db.requests, {
    kind: (params.get("kind") as CitizenRequest["kind"]) ?? undefined,
    status: params.get("status") ?? undefined,
    departmentId: params.get("departmentId") ?? undefined,
    category: params.get("category") ?? undefined,
    priority: params.get("priority") ?? undefined,
    q: params.get("q") ?? undefined,
    dateFrom: params.get("dateFrom") ?? undefined,
    dateTo: params.get("dateTo") ?? undefined,
  });

  return NextResponse.json({ requests: results });
}

export async function POST(request: NextRequest) {
  const authorized = hasSession(request) || hasApiKey(request);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.citizenName || !body.category || !body.description) {
    return NextResponse.json(
      { error: "citizenName, category, and description are required" },
      { status: 400 }
    );
  }

  const db = readDb();
  const categoryDef = CATEGORIES.find((c) => c.name === body.category);
  const now = new Date().toISOString();
  // An explicit, valid source (e.g. "website" from the live municipal site)
  // is always respected. Only fall back to inferring from the auth method
  // when the caller didn't specify one — this keeps n8n's existing default
  // ("chatbot", since it authenticates via API key with no session) intact.
  const source: RequestSource = isValidSource(body.source)
    ? body.source
    : hasApiKey(request) && !hasSession(request)
      ? "chatbot"
      : "website";

  const newRequest: CitizenRequest = {
    id: newId("req"),
    referenceNumber: nextReferenceNumber(db),
    kind: body.kind === "complaint" || body.kind === "request" ? body.kind : categoryDef?.kind ?? "request",
    citizenName: body.citizenName,
    phone: body.phone ?? "",
    category: body.category,
    departmentId: body.departmentId ?? null,
    location: body.location ?? "",
    description: body.description,
    dateSubmitted: now,
    priority: body.priority ?? "Normal",
    status: "New",
    assignedStaffId: null,
    attachedImage: body.attachedImage ?? null,
    internalNotes: [],
    activityHistory: [
      {
        id: newId("act"),
        timestamp: now,
        actor: sourceLabel(source),
        action: "Request submitted",
        detail: categoryDef
          ? `New request received and logged in the system (suggested department: ${categoryDef.defaultDepartmentId}).`
          : "New request received and logged in the system.",
      },
    ],
    source,
    resolvedAt: null,
  };

  db.requests.push(newRequest);
  db.notifications.unshift({
    id: newId("notif"),
    timestamp: now,
    recipient: newRequest.citizenName,
    channel: source === "phone" ? "SMS" : "Email",
    message: `Your request ${newRequest.referenceNumber} ("${newRequest.category}") has been received and logged.`,
    relatedRequestId: newRequest.id,
  });
  writeDb(db);

  return NextResponse.json({ request: newRequest }, { status: 201 });
}
