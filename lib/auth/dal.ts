import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/constants";
import { env } from "@/lib/env";
import { can, type Permission } from "./permissions";
import { readCookie, requestContext } from "./request-context";
import { resolveSession, type SessionUser } from "./session";

/**
 * The Data Access Layer. Every action and route handler resolves the caller
 * through here; the browser-side route guard is only a convenience, never an
 * authorization boundary. The lookup is memoized on the request context, so
 * calling it from several places costs one query per request.
 */
export function getSessionToken(): string | undefined {
  return readCookie(requestContext().req, SESSION_COOKIE);
}

export function getCurrentUser(): SessionUser | null {
  const context = requestContext();
  if (context.user === undefined) {
    context.user = resolveSession(getSessionToken());
  }
  return context.user;
}

export class AccessDeniedError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export class NotAuthenticatedError extends Error {
  constructor(message = "Your session has expired. Please sign in again.") {
    super(message);
    this.name = "NotAuthenticatedError";
  }
}

/** Throws instead of redirecting so the form can show the reason. */
export function requireActionUser(): SessionUser {
  const user = getCurrentUser();
  if (!user) throw new NotAuthenticatedError();
  return user;
}

export function requirePermission(permission: Permission): SessionUser {
  const user = requireActionUser();
  if (!can(user.role, permission)) throw new AccessDeniedError();
  return user;
}

export function setSessionCookie(token: string, expiresAt: Date): void {
  const context = requestContext();
  context.user = undefined;
  context.res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    expires: expiresAt,
    // Express takes milliseconds here.
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
}

export function clearSessionCookie(): void {
  const context = requestContext();
  context.user = undefined;
  context.res.clearCookie(SESSION_COOKIE, { path: "/" });
}
