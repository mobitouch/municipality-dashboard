import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readDb } from "@/lib/db";
import { hasSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!hasSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = readDb();
  return NextResponse.json({ departments: db.departments });
}
