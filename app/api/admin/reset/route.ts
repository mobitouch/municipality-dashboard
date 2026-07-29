import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasSession } from "@/lib/auth";
import { writeDb } from "@/lib/db";
import { buildDb } from "@/scripts/seed.mjs";
import type { DB } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!hasSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  writeDb(buildDb() as DB);
  return NextResponse.json({ ok: true });
}
