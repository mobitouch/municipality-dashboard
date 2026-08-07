import "server-only";

import fs from "node:fs";
import path from "node:path";

import {
  env,
  assertBootstrapAdminSafe,
  assertProductionSafety,
  usingDefaultAdminPassword,
} from "@/lib/env";
import { hashPassword } from "@/lib/auth/password";
import { createApiKey, apiKeyCount } from "@/lib/auth/api-key";
import { all, get, run, transaction } from "./client";
import { newId } from "./ids";
import { DEFAULT_CATEGORIES, DEFAULT_DEPARTMENTS } from "./defaults";
import { CLOSED_STATUSES } from "@/lib/types";

function count(table: string): number {
  return get<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`)?.count ?? 0;
}

function seedStructure(now: string): void {
  if (count("departments") === 0) {
    for (const department of DEFAULT_DEPARTMENTS) {
      run(
        `INSERT INTO departments (id, name, head_of_department, description, email, phone, is_active, created_at, updated_at)
         VALUES (:id, :name, :head, :description, '', '', 1, :now, :now)`,
        {
          id: department.id,
          name: department.name,
          head: department.headOfDepartment,
          description: department.description,
          now,
        }
      );
    }
  }

  if (count("categories") === 0) {
    DEFAULT_CATEGORIES.forEach((category, index) => {
      run(
        `INSERT INTO categories (id, name, kind, default_department_id, is_active, sort_order, created_at, updated_at)
         VALUES (:id, :name, :kind, :departmentId, 1, :sortOrder, :now, :now)`,
        {
          id: category.id,
          name: category.name,
          kind: category.kind,
          departmentId: category.defaultDepartmentId,
          sortOrder: index,
          now,
        }
      );
    });
  }
}

interface LegacyDb {
  departments?: Array<{ id: string; name: string; headOfDepartment?: string; description?: string }>;
  staff?: Array<{
    id: string;
    name: string;
    role?: string;
    departmentId: string;
    email?: string;
    phone?: string;
  }>;
  requests?: Array<Record<string, unknown>>;
  notifications?: Array<Record<string, unknown>>;
}

function readLegacyDb(): LegacyDb | null {
  const file = path.join(process.cwd(), "data", "db.json");
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf-8")) as LegacyDb;
  } catch {
    return null;
  }
}

/**
 * One-time import of the JSON-file dataset this dashboard used before it
 * moved to SQLite. Runs only against an empty requests table, so it can
 * never overwrite live data — and it is skipped entirely when
 * SEED_DEMO_DATA is off.
 */
function importLegacyData(now: string): number {
  const legacy = readLegacyDb();
  if (!legacy?.requests?.length) return 0;

  for (const department of legacy.departments ?? []) {
    run(
      `INSERT INTO departments (id, name, head_of_department, description, email, phone, is_active, created_at, updated_at)
       VALUES (:id, :name, :head, :description, '', '', 1, :now, :now)
       ON CONFLICT (id) DO UPDATE SET head_of_department = excluded.head_of_department`,
      {
        id: department.id,
        name: department.name,
        head: department.headOfDepartment ?? "",
        description: department.description ?? "",
        now,
      }
    );
  }

  for (const person of legacy.staff ?? []) {
    const departmentExists = get<{ id: string }>("SELECT id FROM departments WHERE id = :id", {
      id: person.departmentId,
    });
    if (!departmentExists) continue;
    run(
      `INSERT INTO staff (id, name, role, department_id, email, phone, is_active, created_at, updated_at)
       VALUES (:id, :name, :role, :departmentId, :email, :phone, 1, :now, :now)
       ON CONFLICT (id) DO NOTHING`,
      {
        id: person.id,
        name: person.name,
        role: person.role ?? "",
        departmentId: person.departmentId,
        email: person.email ?? "",
        phone: person.phone ?? "",
        now,
      }
    );
  }

  const categoryIdByName = new Map(
    all<{ id: string; name: string }>("SELECT id, lower(name) AS name FROM categories").map(
      (row) => [row.name, row.id] as const
    )
  );

  const fallbackCategoryId = categoryIdByName.get("general inquiry") ?? DEFAULT_CATEGORIES[0].id;
  let imported = 0;

  for (const legacyRequest of legacy.requests) {
    const request = legacyRequest as {
      id: string;
      referenceNumber: string;
      kind: string;
      citizenName: string;
      phone?: string;
      category: string;
      departmentId: string | null;
      location?: string;
      description: string;
      dateSubmitted: string;
      priority: string;
      status: string;
      assignedStaffId: string | null;
      attachedImage: string | null;
      internalNotes?: Array<{ id: string; author: string; timestamp: string; note: string }>;
      activityHistory?: Array<{
        id: string;
        timestamp: string;
        actor: string;
        action: string;
        detail: string;
      }>;
      source?: string;
      resolvedAt: string | null;
    };

    const categoryId =
      categoryIdByName.get(request.category?.toLowerCase() ?? "") ?? fallbackCategoryId;
    const staffExists =
      request.assignedStaffId &&
      get<{ id: string }>("SELECT id FROM staff WHERE id = :id", { id: request.assignedStaffId });

    run(
      `INSERT INTO requests (
         id, reference_number, kind, citizen_name, phone, email, category_id, department_id,
         assigned_staff_id, location, description, priority, status, source, attached_image,
         date_submitted, due_at, resolved_at, created_at, updated_at)
       VALUES (
         :id, :reference, :kind, :citizenName, :phone, '', :categoryId, :departmentId,
         :assignedStaffId, :location, :description, :priority, :status, :source, :attachedImage,
         :dateSubmitted, NULL, :resolvedAt, :dateSubmitted, :now)
       ON CONFLICT (id) DO NOTHING`,
      {
        id: request.id,
        reference: request.referenceNumber,
        kind: request.kind === "complaint" ? "complaint" : "request",
        citizenName: request.citizenName,
        phone: request.phone ?? "",
        categoryId,
        departmentId: request.departmentId ?? null,
        assignedStaffId: staffExists ? request.assignedStaffId : null,
        location: request.location ?? "",
        description: request.description,
        priority: request.priority,
        status: request.status,
        source: request.source ?? "website",
        attachedImage: request.attachedImage,
        dateSubmitted: request.dateSubmitted,
        resolvedAt:
          request.resolvedAt ??
          (CLOSED_STATUSES.includes(request.status as never) ? request.dateSubmitted : null),
        now,
      }
    );

    for (const note of request.internalNotes ?? []) {
      run(
        `INSERT INTO request_notes (id, request_id, author, note, created_at)
         VALUES (:id, :requestId, :author, :note, :createdAt) ON CONFLICT (id) DO NOTHING`,
        {
          id: note.id,
          requestId: request.id,
          author: note.author,
          note: note.note,
          createdAt: note.timestamp,
        }
      );
    }

    for (const activity of request.activityHistory ?? []) {
      run(
        `INSERT INTO request_activity (id, request_id, actor, action, detail, created_at)
         VALUES (:id, :requestId, :actor, :action, :detail, :createdAt) ON CONFLICT (id) DO NOTHING`,
        {
          id: activity.id,
          requestId: request.id,
          actor: activity.actor,
          action: activity.action,
          detail: activity.detail,
          createdAt: activity.timestamp,
        }
      );
    }

    imported += 1;
  }

  for (const raw of legacy.notifications ?? []) {
    const notification = raw as {
      id: string;
      timestamp: string;
      recipient: string;
      channel: string;
      message: string;
      relatedRequestId?: string;
    };
    const requestExists =
      notification.relatedRequestId &&
      get<{ id: string }>("SELECT id FROM requests WHERE id = :id", {
        id: notification.relatedRequestId,
      });

    run(
      `INSERT INTO notifications (id, request_id, recipient, channel, message, created_at)
       VALUES (:id, :requestId, :recipient, :channel, :message, :createdAt)
       ON CONFLICT (id) DO NOTHING`,
      {
        id: notification.id,
        requestId: requestExists ? notification.relatedRequestId! : null,
        recipient: notification.recipient,
        channel: notification.channel,
        message: notification.message,
        createdAt: notification.timestamp,
      }
    );
  }

  return imported;
}

/**
 * Idempotent first-boot setup. Safe to call on every server start: each
 * step checks whether it has already run.
 */
export async function ensureBootstrapped(): Promise<void> {
  const now = new Date().toISOString();

  const needsAdmin = count("users") === 0;
  if (needsAdmin) assertBootstrapAdminSafe();

  const passwordHash = needsAdmin ? await hashPassword(env.ADMIN_PASSWORD) : "";
  // Outside production the default password is allowed, but the account is
  // flagged so the first sign-in is forced through the change-password screen
  // rather than landing straight on the dashboard.
  const mustChangePassword = usingDefaultAdminPassword() ? 1 : 0;

  transaction(() => {
    seedStructure(now);

    if (needsAdmin) {
      run(
        `INSERT INTO users (id, name, email, password_hash, role, department_id, is_active,
                            must_change_password, created_at, updated_at)
         VALUES (:id, :name, :email, :passwordHash, 'admin', NULL, 1, :mustChangePassword, :now, :now)`,
        {
          id: newId("user"),
          name: env.ADMIN_NAME,
          email: env.ADMIN_EMAIL,
          passwordHash,
          mustChangePassword,
          now,
        }
      );
      console.info(`[bootstrap] Created administrator account ${env.ADMIN_EMAIL}`);
    }

    if (env.seedDemoData && count("requests") === 0) {
      const imported = importLegacyData(now);
      if (imported > 0) {
        console.info(`[bootstrap] Imported ${imported} sample requests from data/db.json`);
      }
    }

    if (env.API_KEY && apiKeyCount() === 0) {
      createApiKey("Website & chatbot integration", "bootstrap", env.API_KEY);
      console.info("[bootstrap] Registered the API_KEY value as the first integration key");
    }
  });

  for (const warning of assertProductionSafety()) {
    console.warn(`[bootstrap] ${warning}`);
  }
}
