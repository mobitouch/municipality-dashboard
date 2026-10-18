import type { Request, Response } from "express";

import { SESSION_COOKIE } from "@/lib/constants";
import { verifyApiKey } from "./api-key";
import { headerValue, readCookie } from "./request-context";
import { resolveSession, type SessionUser } from "./session";

export type RequestCaller =
  | { kind: "session"; user: SessionUser }
  | { kind: "apiKey"; keyId: string; label: string };

/**
 * Route handlers accept either a signed-in staff session (the dashboard's
 * own fetches) or a valid integration key (the website, n8n). Everything
 * else is anonymous.
 */
export function authenticate(req: Request): RequestCaller | null {
  const token = readCookie(req, SESSION_COOKIE);
  const user = resolveSession(token);
  if (user) return { kind: "session", user };

  const key = verifyApiKey(headerValue(req, "x-api-key"));
  if (key) return { kind: "apiKey", keyId: key.id, label: key.label };

  return null;
}

export function unauthorized(res: Response): void {
  res
    .status(401)
    .json({ error: "Unauthorized. Provide a valid session cookie or x-api-key header." });
}

export function requireSession(caller: RequestCaller | null): SessionUser | null {
  return caller?.kind === "session" ? caller.user : null;
}
