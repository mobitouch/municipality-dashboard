import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authenticate, requireSession, unauthorized } from "@/lib/auth/request-auth";
import { listNotifications } from "@/lib/data/notifications";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const caller = authenticate(request);
  if (!caller) return unauthorized();
  if (!requireSession(caller)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  return NextResponse.json(
    listNotifications({
      channel: params.get("channel") ?? undefined,
      requestId: params.get("requestId") ?? undefined,
      q: params.get("q") ?? undefined,
      page: Number(params.get("page")) || 1,
      pageSize: Number(params.get("pageSize")) || DEFAULT_PAGE_SIZE,
    })
  );
}
