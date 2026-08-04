import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { all, get, run } from "@/lib/db/client";
import { newId } from "@/lib/db/ids";
import type { ApiKey } from "@/lib/types";

const PREFIX = "mtk_";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): string {
  return PREFIX + randomBytes(24).toString("base64url");
}

interface ApiKeyRow {
  id: string;
  label: string;
  key_preview: string;
  created_by: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

function toApiKey(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    label: row.label,
    keyPreview: row.key_preview,
    createdBy: row.created_by,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
  };
}

export function listApiKeys(): ApiKey[] {
  return all<ApiKeyRow>(
    "SELECT * FROM api_keys ORDER BY revoked_at IS NOT NULL, created_at DESC"
  ).map(toApiKey);
}

/** Returns the plaintext key once — it is never recoverable afterwards. */
export function createApiKey(label: string, createdBy: string, key = generateApiKey()): {
  apiKey: ApiKey;
  plaintext: string;
} {
  const now = new Date().toISOString();
  const id = newId("key");
  const preview = `${key.slice(0, PREFIX.length + 4)}…${key.slice(-4)}`;

  run(
    `INSERT INTO api_keys (id, label, key_hash, key_preview, created_by, created_at)
     VALUES (:id, :label, :keyHash, :keyPreview, :createdBy, :createdAt)`,
    { id, label, keyHash: hashKey(key), keyPreview: preview, createdBy, createdAt: now }
  );

  return {
    apiKey: {
      id,
      label,
      keyPreview: preview,
      createdBy,
      createdAt: now,
      lastUsedAt: null,
      revokedAt: null,
    },
    plaintext: key,
  };
}

export function revokeApiKey(id: string): boolean {
  const result = run("UPDATE api_keys SET revoked_at = :now WHERE id = :id AND revoked_at IS NULL", {
    now: new Date().toISOString(),
    id,
  });
  return result.changes > 0;
}

export function deleteApiKey(id: string): boolean {
  return run("DELETE FROM api_keys WHERE id = :id", { id }).changes > 0;
}

/**
 * Looks the key up by hash — an indexed equality match rather than a scan,
 * and constant-time against the stored digest so the comparison itself
 * leaks nothing.
 */
export function verifyApiKey(presented: string | null | undefined): { id: string; label: string } | null {
  if (!presented) return null;

  const digest = hashKey(presented);
  const row = get<{ id: string; label: string; key_hash: string }>(
    "SELECT id, label, key_hash FROM api_keys WHERE key_hash = :hash AND revoked_at IS NULL",
    { hash: digest }
  );
  if (!row) return null;

  const a = Buffer.from(digest, "hex");
  const b = Buffer.from(row.key_hash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  run("UPDATE api_keys SET last_used_at = :now WHERE id = :id", {
    now: new Date().toISOString(),
    id: row.id,
  });

  return { id: row.id, label: row.label };
}

export function apiKeyCount(): number {
  return get<{ count: number }>("SELECT COUNT(*) AS count FROM api_keys")?.count ?? 0;
}
