import fs from "node:fs";
import path from "node:path";
import { DatabaseSync, type StatementSync } from "node:sqlite";

import { MIGRATIONS } from "./schema";

export type SqlValue = string | number | null | Uint8Array;
export type SqlParams = Record<string, SqlValue> | SqlValue[];

/**
 * SQLite is single-writer, so a single long-lived connection per process is
 * both correct and fastest — no pool, no per-request open cost. The handle
 * is parked on globalThis so a dev-mode module reload doesn't leak a new
 * connection (and a new set of file locks) on every edit.
 */
declare global {
  var __municipalityDb: DatabaseSync | undefined;
  var __municipalityStmts: Map<string, StatementSync> | undefined;
}

export function databasePath(): string {
  const configured = process.env.DATABASE_PATH?.trim();
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), "data", "dashboard.db");
}

function migrate(db: DatabaseSync): void {
  const row = db.prepare("PRAGMA user_version").get() as { user_version: number };
  const current = row?.user_version ?? 0;

  for (let version = current; version < MIGRATIONS.length; version++) {
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(MIGRATIONS[version]);
      // PRAGMA doesn't accept bound parameters; the value is a loop index.
      db.exec(`PRAGMA user_version = ${version + 1}`);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

function createClient(): DatabaseSync {
  const file = databasePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const db = new DatabaseSync(file);
  // WAL lets dashboard reads continue while a write is in flight; NORMAL
  // synchronous is the standard durable-enough pairing for WAL.
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 5000");

  migrate(db);
  return db;
}

export function getDb(): DatabaseSync {
  return (globalThis.__municipalityDb ??= createClient());
}

function statement(sql: string): StatementSync {
  const cache = (globalThis.__municipalityStmts ??= new Map());
  let stmt = cache.get(sql);
  if (!stmt) {
    stmt = getDb().prepare(sql);
    cache.set(sql, stmt);
  }
  return stmt;
}

/**
 * node:sqlite returns each row as an `Object.create(null)` record — no
 * Object.prototype. That's invisible almost everywhere, but serializers and
 * equality helpers can trip on it. Spreading into a literal here, once, at
 * the boundary between SQLite and the rest of the app, means no call site
 * has to remember to do it themselves.
 */
function plain<T>(row: unknown): T {
  return { ...(row as object) } as T;
}

export function all<T>(sql: string, params?: SqlParams): T[] {
  const stmt = statement(sql);
  const rows =
    params === undefined ? stmt.all() : Array.isArray(params) ? stmt.all(...params) : stmt.all(params);
  return rows.map((row) => plain<T>(row));
}

export function get<T>(sql: string, params?: SqlParams): T | undefined {
  const stmt = statement(sql);
  const row =
    params === undefined ? stmt.get() : Array.isArray(params) ? stmt.get(...params) : stmt.get(params);
  return row === undefined ? undefined : plain<T>(row);
}

export function run(sql: string, params?: SqlParams): { changes: number } {
  const stmt = statement(sql);
  const result =
    params === undefined ? stmt.run() : Array.isArray(params) ? stmt.run(...params) : stmt.run(params);
  return { changes: Number(result.changes) };
}

/**
 * Runs `fn` inside a single write transaction. BEGIN IMMEDIATE takes the
 * write lock up front so two concurrent mutations queue instead of one
 * failing halfway through with SQLITE_BUSY. Not re-entrant — never nest.
 */
export function transaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // The transaction was already rolled back by SQLite; surface the
      // original error rather than this one.
    }
    throw error;
  }
}

/** SQLite has no boolean type — columns use 0/1 integers. */
export const bool = (value: boolean): number => (value ? 1 : 0);
export const fromBool = (value: number): boolean => value === 1;
