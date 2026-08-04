import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authenticate, requireSession, unauthorized } from "@/lib/auth/request-auth";
import { listStaff } from "@/lib/data/staff";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const caller = authenticate(request);
  if (!caller) return unauthorized();

  // Staff contact details are internal, so integration keys don't get them.
  if (!requireSession(caller)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  return NextResponse.json({
    staff: listStaff({
      departmentId: params.get("departmentId") ?? undefined,
      q: params.get("q") ?? undefined,
      includeInactive: params.get("includeInactive") === "true",
    }),
  });
}
