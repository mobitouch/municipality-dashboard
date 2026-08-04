import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authenticate, unauthorized } from "@/lib/auth/request-auth";
import { listDepartments } from "@/lib/data/departments";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const caller = authenticate(request);
  if (!caller) return unauthorized();

  const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
  return NextResponse.json({ departments: listDepartments({ includeInactive }) });
}
