import { NextResponse } from "next/server";

import { get } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/**
 * Unauthenticated liveness probe for a load balancer or uptime monitor. It
 * touches the database so a healthy response means the app can actually
 * serve requests, not merely that the process is up. No data is exposed.
 */
export async function GET() {
  try {
    get<{ ok: number }>("SELECT 1 AS ok");
    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { status: "error", timestamp: new Date().toISOString() },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
