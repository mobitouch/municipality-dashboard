import "server-only";

import { all, bool, get, run } from "@/lib/db/client";
import { newId } from "@/lib/db/ids";
import type { Category, RequestKind } from "@/lib/types";

interface CategoryRow {
  id: string;
  name: string;
  kind: RequestKind;
  default_department_id: string | null;
  default_department_name: string | null;
  is_active: number;
  sort_order: number;
  request_count: number;
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    defaultDepartmentId: row.default_department_id,
    defaultDepartmentName: row.default_department_name,
    isActive: row.is_active === 1,
    sortOrder: row.sort_order,
    requestCount: row.request_count ?? 0,
  };
}

const BASE_SELECT = `
  SELECT c.*, d.name AS default_department_name,
         (SELECT COUNT(*) FROM requests r WHERE r.category_id = c.id) AS request_count
    FROM categories c
    LEFT JOIN departments d ON d.id = c.default_department_id
`;

export function listCategories(
  options: { kind?: RequestKind; includeInactive?: boolean } = {}
): Category[] {
  const conditions: string[] = [];
  const params: Record<string, string> = {};

  if (!options.includeInactive) conditions.push("c.is_active = 1");
  if (options.kind) {
    conditions.push("c.kind = :kind");
    params.kind = options.kind;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return all<CategoryRow>(
    `${BASE_SELECT} ${where} ORDER BY c.sort_order, c.name COLLATE NOCASE`,
    params
  ).map(toCategory);
}

export function getCategory(id: string): Category | null {
  const row = get<CategoryRow>(`${BASE_SELECT} WHERE c.id = :id`, { id });
  return row ? toCategory(row) : null;
}

export function findCategoryByName(name: string): Category | null {
  const row = get<CategoryRow>(`${BASE_SELECT} WHERE c.name = :name COLLATE NOCASE`, { name });
  return row ? toCategory(row) : null;
}

export function categoryNameTaken(name: string, exceptId?: string): boolean {
  const row = get<{ id: string }>(
    "SELECT id FROM categories WHERE name = :name COLLATE NOCASE AND id <> :exceptId",
    { name, exceptId: exceptId ?? "" }
  );
  return Boolean(row);
}

export interface CategoryInput {
  name: string;
  kind: RequestKind;
  defaultDepartmentId: string | null;
  isActive: boolean;
  sortOrder: number;
}

export function createCategory(input: CategoryInput): Category {
  const now = new Date().toISOString();
  const id = newId("cat");
  run(
    `INSERT INTO categories (id, name, kind, default_department_id, is_active, sort_order, created_at, updated_at)
     VALUES (:id, :name, :kind, :defaultDepartmentId, :isActive, :sortOrder, :createdAt, :updatedAt)`,
    {
      id,
      name: input.name,
      kind: input.kind,
      defaultDepartmentId: input.defaultDepartmentId,
      isActive: bool(input.isActive),
      sortOrder: input.sortOrder,
      createdAt: now,
      updatedAt: now,
    }
  );
  return getCategory(id)!;
}

export function updateCategory(id: string, input: CategoryInput): Category | null {
  run(
    `UPDATE categories
        SET name = :name, kind = :kind, default_department_id = :defaultDepartmentId,
            is_active = :isActive, sort_order = :sortOrder, updated_at = :updatedAt
      WHERE id = :id`,
    {
      id,
      name: input.name,
      kind: input.kind,
      defaultDepartmentId: input.defaultDepartmentId,
      isActive: bool(input.isActive),
      sortOrder: input.sortOrder,
      updatedAt: new Date().toISOString(),
    }
  );
  return getCategory(id);
}

export function categoryRequestCount(id: string): number {
  return (
    get<{ count: number }>("SELECT COUNT(*) AS count FROM requests WHERE category_id = :id", { id })
      ?.count ?? 0
  );
}

export function deleteCategory(id: string): boolean {
  return run("DELETE FROM categories WHERE id = :id", { id }).changes > 0;
}
