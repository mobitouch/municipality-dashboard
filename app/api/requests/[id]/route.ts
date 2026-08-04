import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authenticate, requireSession, unauthorized } from "@/lib/auth/request-auth";
import { can } from "@/lib/auth/permissions";
import { deleteRequest, getRequestDetail, updateRequest } from "@/lib/data/requests";
import { PRIORITIES, REQUEST_STATUSES, type Priority, type RequestStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const caller = authenticate(request);
  if (!caller) return unauthorized();

  const { id } = await params;
  const found = getRequestDetail(id);
  if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ request: found });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const caller = authenticate(request);
  if (!caller) return unauthorized();

  // Updating an existing case is a staff action, not something an
  // integration key should be able to do.
  const user = requireSession(caller);
  if (!user || !can(user.role, "requests:update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (body.status && !REQUEST_STATUSES.includes(body.status as RequestStatus)) {
    return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  }
  if (body.priority && !PRIORITIES.includes(body.priority as Priority)) {
    return NextResponse.json({ error: "Unknown priority." }, { status: 400 });
  }

  const updated = updateRequest(id, body, user.name);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ request: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const caller = authenticate(request);
  if (!caller) return unauthorized();

  const user = requireSession(caller);
  if (!user || !can(user.role, "requests:delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!deleteRequest(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
