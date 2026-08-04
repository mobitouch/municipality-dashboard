import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/constants";
import { env } from "@/lib/env";
import { can, type Permission } from "./permissions";
import { resolveSession, type SessionUser } from "./session";

/**
 * The Data Access Layer. Every server component, server action, and route
 * handler resolves the caller through here rather than trusting the proxy —
 * the proxy only does an optimistic cookie check, so it is not an
 * authorization boundary. `cache` memoizes the lookup for the duration of
 * a single render pass, so hitting it from ten components costs one query.
 */
export const getSessionToken = cache(async (): Promise<string | undefined> => {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
});

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = await getSessionToken();
  return resolveSession(token);
});

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

/** For pages and layouts: bounces unauthenticated visitors to the login screen. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For server actions: throws instead of redirecting so the form can show the reason. */
export async function requireActionUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new NotAuthenticatedError();
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireActionUser();
  if (!can(user.role, permission)) throw new AccessDeniedError();
  return user;
}

export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser();
  return user ? can(user.role, permission) : false;
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
