import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/constants";
import { verifyApiKey } from "./api-key";
import { resolveSession, type SessionUser } from "./session";

export type RequestCaller =
  | { kind: "session"; user: SessionUser }
  | { kind: "apiKey"; keyId: string; label: string };

/**
 * Route handlers accept either a signed-in staff session (the dashboard's
 * own fetches) or a valid integration key (the website, n8n). Everything
 * else is anonymous.
 */
export function authenticate(request: NextRequest): RequestCaller | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = resolveSession(token);
  if (user) return { kind: "session", user };

  const key = verifyApiKey(request.headers.get("x-api-key"));
  if (key) return { kind: "apiKey", keyId: key.id, label: key.label };

  return null;
}

export function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: "Unauthorized. Provide a valid session cookie or x-api-key header." },
    { status: 401 }
  );
}

export function requireSession(caller: RequestCaller | null): SessionUser | null {
  return caller?.kind === "session" ? caller.user : null;
}
