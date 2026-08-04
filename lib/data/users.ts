import "server-only";

import { all, bool, get, run } from "@/lib/db/client";
import { newId } from "@/lib/db/ids";
import { hashPassword } from "@/lib/auth/password";
import { destroyAllSessionsForUser } from "@/lib/auth/session";
import type { AppUser, UserRole } from "@/lib/types";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department_id: string | null;
  department_name: string | null;
  is_active: number;
  must_change_password: number;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

function toUser(row: UserRow): AppUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    departmentId: row.department_id,
    departmentName: row.department_name,
    isActive: row.is_active === 1,
    mustChangePassword: row.must_change_password === 1,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const BASE_SELECT = `
  SELECT u.id, u.name, u.email, u.role, u.department_id, u.is_active,
         u.must_change_password, u.last_login_at, u.created_at, u.updated_at,
         d.name AS department_name
    FROM users u
    LEFT JOIN departments d ON d.id = u.department_id
`;

export function listUsers(): AppUser[] {
  return all<UserRow>(
    `${BASE_SELECT} ORDER BY u.is_active DESC, u.name COLLATE NOCASE`
  ).map(toUser);
}

export function getUser(id: string): AppUser | null {
  const row = get<UserRow>(`${BASE_SELECT} WHERE u.id = :id`, { id });
  return row ? toUser(row) : null;
}

/** Includes the password hash — only for the login path. */
export function getUserCredentials(
  email: string
): { id: string; passwordHash: string; isActive: boolean } | null {
  const row = get<{ id: string; password_hash: string; is_active: number }>(
    "SELECT id, password_hash, is_active FROM users WHERE email = :email COLLATE NOCASE",
    { email }
  );
  return row ? { id: row.id, passwordHash: row.password_hash, isActive: row.is_active === 1 } : null;
}

export function getPasswordHash(userId: string): string | null {
  return (
    get<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = :id", { id: userId })
      ?.password_hash ?? null
  );
}

export function emailTaken(email: string, exceptId?: string): boolean {
  const row = get<{ id: string }>(
    "SELECT id FROM users WHERE email = :email COLLATE NOCASE AND id <> :exceptId",
    { email, exceptId: exceptId ?? "" }
  );
  return Boolean(row);
}

export function userCount(): number {
  return get<{ count: number }>("SELECT COUNT(*) AS count FROM users")?.count ?? 0;
}

export function activeAdminCount(exceptId?: string): number {
  return (
    get<{ count: number }>(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = 1 AND id <> :exceptId",
      { exceptId: exceptId ?? "" }
    )?.count ?? 0
  );
}

export interface UserInput {
  name: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  isActive: boolean;
}

export async function createUser(
  input: UserInput & { password: string; mustChangePassword?: boolean }
): Promise<AppUser> {
  const now = new Date().toISOString();
  const id = newId("user");
  run(
    `INSERT INTO users (id, name, email, password_hash, role, department_id, is_active,
                        must_change_password, created_at, updated_at)
     VALUES (:id, :name, :email, :passwordHash, :role, :departmentId, :isActive,
             :mustChange, :createdAt, :updatedAt)`,
    {
      id,
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      departmentId: input.departmentId,
      isActive: bool(input.isActive),
      mustChange: bool(input.mustChangePassword ?? true),
      createdAt: now,
      updatedAt: now,
    }
  );
  return getUser(id)!;
}

export function updateUser(id: string, input: UserInput): AppUser | null {
  run(
    `UPDATE users
        SET name = :name, email = :email, role = :role, department_id = :departmentId,
            is_active = :isActive, updated_at = :updatedAt
      WHERE id = :id`,
    {
      id,
      name: input.name,
      email: input.email,
      role: input.role,
      departmentId: input.departmentId,
      isActive: bool(input.isActive),
      updatedAt: new Date().toISOString(),
    }
  );
  // A deactivated or demoted account must not keep browsing on an old cookie.
  if (!input.isActive) destroyAllSessionsForUser(id);
  return getUser(id);
}

export async function setUserPassword(
  id: string,
  password: string,
  options: { mustChange?: boolean; revokeSessions?: boolean } = {}
): Promise<void> {
  run(
    `UPDATE users
        SET password_hash = :passwordHash, must_change_password = :mustChange, updated_at = :updatedAt
      WHERE id = :id`,
    {
      id,
      passwordHash: await hashPassword(password),
      mustChange: bool(options.mustChange ?? false),
      updatedAt: new Date().toISOString(),
    }
  );
  if (options.revokeSessions) destroyAllSessionsForUser(id);
}

export function recordLogin(id: string): void {
  run("UPDATE users SET last_login_at = :now WHERE id = :id", {
    id,
    now: new Date().toISOString(),
  });
}

export function deleteUser(id: string): boolean {
  destroyAllSessionsForUser(id);
  return run("DELETE FROM users WHERE id = :id", { id }).changes > 0;
}
