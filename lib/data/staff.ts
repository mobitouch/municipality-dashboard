import "server-only";

import { all, bool, get, run } from "@/lib/db/client";
import { newId } from "@/lib/db/ids";
import { CLOSED_STATUSES } from "@/lib/types";
import type { Staff, StaffWithStats } from "@/lib/types";

interface StaffRow {
  id: string;
  name: string;
  role: string;
  department_id: string;
  department_name: string;
  email: string;
  phone: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

function toStaff(row: StaffRow): Staff {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    departmentId: row.department_id,
    departmentName: row.department_name,
    email: row.email,
    phone: row.phone,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const CLOSED_LIST = CLOSED_STATUSES.map((status) => `'${status}'`).join(", ");

const BASE_SELECT = `
  SELECT s.*, d.name AS department_name
    FROM staff s
    JOIN departments d ON d.id = s.department_id
`;

export interface StaffQuery {
  q?: string;
  departmentId?: string;
  includeInactive?: boolean;
}

export function listStaff(query: StaffQuery = {}): StaffWithStats[] {
  const conditions: string[] = [];
  const params: Record<string, string | number> = {};

  if (!query.includeInactive) conditions.push("s.is_active = 1");
  if (query.departmentId) {
    conditions.push("s.department_id = :departmentId");
    params.departmentId = query.departmentId;
  }
  if (query.q) {
    conditions.push("(s.name LIKE :q OR s.email LIKE :q OR s.role LIKE :q)");
    params.q = `%${query.q}%`;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  return all<StaffRow & { active_count: number; total_count: number }>(
    `SELECT s.*, d.name AS department_name,
            (SELECT COUNT(*) FROM requests r WHERE r.assigned_staff_id = s.id AND r.status NOT IN (${CLOSED_LIST})) AS active_count,
            (SELECT COUNT(*) FROM requests r WHERE r.assigned_staff_id = s.id) AS total_count
       FROM staff s
       JOIN departments d ON d.id = s.department_id
       ${where}
      ORDER BY s.is_active DESC, s.name COLLATE NOCASE`,
    params
  ).map((row) => ({
    ...toStaff(row),
    activeRequestCount: row.active_count,
    totalRequestCount: row.total_count,
  }));
}

export function getStaff(id: string): Staff | null {
  const row = get<StaffRow>(`${BASE_SELECT} WHERE s.id = :id`, { id });
  return row ? toStaff(row) : null;
}

export function staffEmailTaken(email: string, exceptId?: string): boolean {
  if (!email) return false;
  const row = get<{ id: string }>(
    "SELECT id FROM staff WHERE email = :email COLLATE NOCASE AND id <> :exceptId",
    { email, exceptId: exceptId ?? "" }
  );
  return Boolean(row);
}

export interface StaffInput {
  name: string;
  role: string;
  departmentId: string;
  email: string;
  phone: string;
  isActive: boolean;
}

export function createStaff(input: StaffInput): Staff {
  const now = new Date().toISOString();
  const id = newId("staff");
  run(
    `INSERT INTO staff (id, name, role, department_id, email, phone, is_active, created_at, updated_at)
     VALUES (:id, :name, :role, :departmentId, :email, :phone, :isActive, :createdAt, :updatedAt)`,
    {
      id,
      name: input.name,
      role: input.role,
      departmentId: input.departmentId,
      email: input.email,
      phone: input.phone,
      isActive: bool(input.isActive),
      createdAt: now,
      updatedAt: now,
    }
  );
  return getStaff(id)!;
}

export function updateStaff(id: string, input: StaffInput): Staff | null {
  run(
    `UPDATE staff
        SET name = :name, role = :role, department_id = :departmentId,
            email = :email, phone = :phone, is_active = :isActive, updated_at = :updatedAt
      WHERE id = :id`,
    {
      id,
      name: input.name,
      role: input.role,
      departmentId: input.departmentId,
      email: input.email,
      phone: input.phone,
      isActive: bool(input.isActive),
      updatedAt: new Date().toISOString(),
    }
  );
  return getStaff(id);
}

export function staffAssignmentCount(id: string): { active: number; total: number } {
  const row = get<{ active: number; total: number }>(
    `SELECT (SELECT COUNT(*) FROM requests WHERE assigned_staff_id = :id AND status NOT IN (${CLOSED_LIST})) AS active,
            (SELECT COUNT(*) FROM requests WHERE assigned_staff_id = :id) AS total`,
    { id }
  );
  return row ?? { active: 0, total: 0 };
}

/**
 * Deleting a staff member leaves their historical requests intact — the
 * foreign key nulls the assignment rather than cascading the delete, so a
 * departure never erases the record of who did the work.
 */
export function deleteStaff(id: string): boolean {
  return run("DELETE FROM staff WHERE id = :id", { id }).changes > 0;
}
