import type { NextRequest } from "next/server";
import { N8N_API_KEY, SESSION_COOKIE } from "./constants";

export function hasSession(req: NextRequest): boolean {
  return req.cookies.get(SESSION_COOKIE)?.value === "active";
}

export function hasApiKey(req: NextRequest): boolean {
  return req.headers.get("x-api-key") === N8N_API_KEY;
}
