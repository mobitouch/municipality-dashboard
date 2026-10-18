import { createHash, randomBytes } from "node:crypto";

import { all, get, run, transaction } from "@/lib/db/client";
import { SESSION_TTL_SECONDS } from "@/lib/constants";
import type { AppUser, UserRole } from "@/lib/types";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  departmentName: string | null;
  mustChangePassword: boolean;
}

/**
 * Only the hash of the session token is persisted, so a leaked database
 * snapshot cannot be replayed as a set of live sessions.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function createSession(userId: string, userAgent: string): { token: string; expiresAt: Date } {
  const token = createSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);

  run(
    `INSERT INTO sessions (id, user_id, created_at, expires_at, user_agent)
     VALUES (:id, :userId, :createdAt, :expiresAt, :userAgent)`,
    {
      id: hashToken(token),
      userId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      userAgent: userAgent.slice(0, 255),
    }
  );

  // Opportunistic cleanup keeps the table from growing without bound
  // without needing a scheduled job.
  run("DELETE FROM sessions WHERE expires_at < :now", { now: now.toISOString() });

  return { token, expiresAt };
}

interface SessionRow {
  expires_at: string;
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  department_id: string | null;
  department_name: string | null;
  must_change_password: number;
  is_active: number;
}

export function resolveSession(token: string | undefined): SessionUser | null {
  if (!token) return null;

  const row = get<SessionRow>(
    `SELECT s.expires_at,
            u.id AS user_id, u.name, u.email, u.role, u.department_id,
            u.must_change_password, u.is_active,
            d.name AS department_name
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN departments d ON d.id = u.department_id
      WHERE s.id = :id`,
    { id: hashToken(token) }
  );

  if (!row) return null;

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    run("DELETE FROM sessions WHERE id = :id", { id: hashToken(token) });
    return null;
  }

  // A deactivated account loses access immediately, without waiting for
  // the cookie to expire.
  if (row.is_active !== 1) {
    run("DELETE FROM sessions WHERE user_id = :userId", { userId: row.user_id });
    return null;
  }

  return {
    id: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    departmentId: row.department_id,
    departmentName: row.department_name,
    mustChangePassword: row.must_change_password === 1,
  };
}

export function destroySession(token: string | undefined): void {
  if (!token) return;
  run("DELETE FROM sessions WHERE id = :id", { id: hashToken(token) });
}

export function destroyAllSessionsForUser(userId: string): void {
  run("DELETE FROM sessions WHERE user_id = :userId", { userId });
}

export interface ActiveSession {
  id: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string;
  isCurrent: boolean;
}

export function listSessionsForUser(userId: string, currentToken?: string): ActiveSession[] {
  const currentId = currentToken ? hashToken(currentToken) : "";
  return all<{ id: string; created_at: string; expires_at: string; user_agent: string }>(
    `SELECT id, created_at, expires_at, user_agent
       FROM sessions
      WHERE user_id = :userId AND expires_at > :now
      ORDER BY created_at DESC`,
    { userId, now: new Date().toISOString() }
  ).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    userAgent: row.user_agent,
    isCurrent: row.id === currentId,
  }));
}

/**
 * Simple per-identifier throttle for the login endpoint. Attempts are kept
 * in SQLite rather than memory so the limit survives a restart and applies
 * across every worker sharing the database file.
 *
 * Identifiers are of two kinds, and both are needed. Keying only on the email
 * address — the original behaviour — stops someone grinding one account, but
 * does nothing about password spraying: one guess each against a hundred
 * different addresses never trips a per-email counter. The `ip:` identifier
 * caps total failures from one source regardless of which accounts are named.
 */
const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_MAX_ATTEMPTS = 8;
/** Looser, because one NAT'd office can legitimately hold several people. */
const LOGIN_MAX_ATTEMPTS_PER_IP = 30;

export function ipIdentifier(ip: string): string {
  return `ip:${ip}`;
}

export function loginAttemptsExceeded(identifier: string): boolean {
  const since = new Date(Date.now() - LOGIN_WINDOW_SECONDS * 1000).toISOString();
  const row = get<{ count: number }>(
    "SELECT COUNT(*) AS count FROM login_attempts WHERE identifier = :identifier AND created_at > :since",
    { identifier: identifier.toLowerCase(), since }
  );
  const max = identifier.startsWith("ip:") ? LOGIN_MAX_ATTEMPTS_PER_IP : LOGIN_MAX_ATTEMPTS;
  return (row?.count ?? 0) >= max;
}

export function recordLoginFailure(identifier: string): void {
  const now = new Date();
  transaction(() => {
    run("INSERT INTO login_attempts (identifier, created_at) VALUES (:identifier, :createdAt)", {
      identifier: identifier.toLowerCase(),
      createdAt: now.toISOString(),
    });
    run("DELETE FROM login_attempts WHERE created_at < :cutoff", {
      cutoff: new Date(now.getTime() - LOGIN_WINDOW_SECONDS * 1000).toISOString(),
    });
  });
}

export function clearLoginFailures(identifier: string): void {
  run("DELETE FROM login_attempts WHERE identifier = :identifier", {
    identifier: identifier.toLowerCase(),
  });
}

export function toAppUserShape(user: SessionUser): Pick<AppUser, "id" | "name" | "email" | "role"> {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
