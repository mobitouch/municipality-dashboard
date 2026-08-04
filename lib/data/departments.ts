import "server-only";

import { all, bool, get, run } from "@/lib/db/client";
import { newId } from "@/lib/db/ids";
import { CLOSED_STATUSES } from "@/lib/types";
import type { Department, DepartmentWithStats } from "@/lib/types";

interface DepartmentRow {
  id: string;
  name: string;
  head_of_department: string;
  description: string;
  email: string;
  phone: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

function toDepartment(row: DepartmentRow): Department {
  return {
    id: row.id,
    name: row.name,
    headOfDepartment: row.head_of_department,
    description: row.description,
    email: row.email,
    phone: row.phone,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const CLOSED_LIST = CLOSED_STATUSES.map((status) => `'${status}'`).join(", ");

export function listDepartments(options: { includeInactive?: boolean } = {}): Department[] {
  const where = options.includeInactive ? "" : "WHERE is_active = 1";
  return all<DepartmentRow>(`SELECT * FROM departments ${where} ORDER BY name COLLATE NOCASE`).map(
    toDepartment
  );
}

/**
 * Counts are computed in one pass with correlated subqueries rather than
 * pulling every request into JS — this is the query the Departments page
 * renders from.
 */
export function listDepartmentsWithStats(): DepartmentWithStats[] {
  return all<DepartmentRow & { staff_count: number; active_count: number; total_count: number }>(
    `SELECT d.*,
            (SELECT COUNT(*) FROM staff s WHERE s.department_id = d.id AND s.is_active = 1) AS staff_count,
            (SELECT COUNT(*) FROM requests r WHERE r.department_id = d.id AND r.status NOT IN (${CLOSED_LIST})) AS active_count,
            (SELECT COUNT(*) FROM requests r WHERE r.department_id = d.id) AS total_count
       FROM departments d
      ORDER BY d.is_active DESC, d.name COLLATE NOCASE`
  ).map((row) => ({
    ...toDepartment(row),
    staffCount: row.staff_count,
    activeRequestCount: row.active_count,
    totalRequestCount: row.total_count,
  }));
}

export function getDepartment(id: string): Department | null {
  const row = get<DepartmentRow>("SELECT * FROM departments WHERE id = :id", { id });
  return row ? toDepartment(row) : null;
}

export function departmentNameTaken(name: string, exceptId?: string): boolean {
  const row = get<{ id: string }>(
    "SELECT id FROM departments WHERE name = :name COLLATE NOCASE AND id <> :exceptId",
    { name, exceptId: exceptId ?? "" }
  );
  return Boolean(row);
}

export interface DepartmentInput {
  name: string;
  headOfDepartment: string;
  description: string;
  email: string;
  phone: string;
  isActive: boolean;
}

export function createDepartment(input: DepartmentInput): Department {
  const now = new Date().toISOString();
  const id = newId("dept");
  run(
    `INSERT INTO departments (id, name, head_of_department, description, email, phone, is_active, created_at, updated_at)
     VALUES (:id, :name, :head, :description, :email, :phone, :isActive, :createdAt, :updatedAt)`,
    {
      id,
      name: input.name,
      head: input.headOfDepartment,
      description: input.description,
      email: input.email,
      phone: input.phone,
      isActive: bool(input.isActive),
      createdAt: now,
      updatedAt: now,
    }
  );
  return getDepartment(id)!;
}

export function updateDepartment(id: string, input: DepartmentInput): Department | null {
  run(
    `UPDATE departments
        SET name = :name, head_of_department = :head, description = :description,
            email = :email, phone = :phone, is_active = :isActive, updated_at = :updatedAt
      WHERE id = :id`,
    {
      id,
      name: input.name,
      head: input.headOfDepartment,
      description: input.description,
      email: input.email,
      phone: input.phone,
      isActive: bool(input.isActive),
      updatedAt: new Date().toISOString(),
    }
  );
  return getDepartment(id);
}

export interface DepartmentReferences {
  staff: number;
  requests: number;
  users: number;
  categories: number;
}

export function departmentReferences(id: string): DepartmentReferences {
  const row = get<DepartmentReferences>(
    `SELECT (SELECT COUNT(*) FROM staff WHERE department_id = :id) AS staff,
            (SELECT COUNT(*) FROM requests WHERE department_id = :id) AS requests,
            (SELECT COUNT(*) FROM users WHERE department_id = :id) AS users,
            (SELECT COUNT(*) FROM categories WHERE default_department_id = :id) AS categories`,
    { id }
  );
  return row ?? { staff: 0, requests: 0, users: 0, categories: 0 };
}

export function deleteDepartment(id: string): boolean {
  return run("DELETE FROM departments WHERE id = :id", { id }).changes > 0;
}
