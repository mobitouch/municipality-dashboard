import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authenticate, unauthorized } from "@/lib/auth/request-auth";
import { getRequestForTracking } from "@/lib/data/requests";

export const dynamic = "force-dynamic";

/**
 * Public complaint-tracking lookup. Authenticated the same way as the
 * intake endpoint (session or integration key) so only the website's
 * server-to-server call can reach it — the citizen never talks to this
 * app directly. Requires both the reference number and the phone/email on
 * file so a guessed reference alone can't pull up someone else's case.
 */
export async function GET(request: NextRequest) {
  const caller = authenticate(request);
  if (!caller) return unauthorized();

  const params = request.nextUrl.searchParams;
  const reference = params.get("reference") ?? "";
  const contact = params.get("contact") ?? "";

  if (!reference.trim() || !contact.trim()) {
    return NextResponse.json({ error: "reference and contact are required." }, { status: 400 });
  }

  const status = getRequestForTracking(reference, contact);
  if (!status) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ status });
}
