import { all, run } from "@/lib/db/client";
import { newId } from "@/lib/db/ids";
import type { AuditEntry } from "@/lib/types";

export interface AuditInput {
  actorId: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId?: string;
  detail?: string;
}

/**
 * Records who changed what. Requests keep their own richer per-item
 * timeline in `request_activity`; this table covers everything else
 * (departments, staff, users, categories, keys) in one queryable place.
 */
export function recordAudit(input: AuditInput): void {
  run(
    `INSERT INTO audit_log (id, actor_id, actor_name, action, entity_type, entity_id, detail, created_at)
     VALUES (:id, :actorId, :actorName, :action, :entityType, :entityId, :detail, :createdAt)`,
    {
      id: newId("audit"),
      actorId: input.actorId,
      actorName: input.actorName,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? "",
      detail: input.detail ?? "",
      createdAt: new Date().toISOString(),
    }
  );
}

export function listAudit(limit = 100): AuditEntry[] {
  return all<{
    id: string;
    actor_name: string;
    action: string;
    entity_type: string;
    entity_id: string;
    detail: string;
    created_at: string;
  }>("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT :limit", { limit }).map((row) => ({
    id: row.id,
    actorName: row.actor_name,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    detail: row.detail,
    createdAt: row.created_at,
  }));
}
