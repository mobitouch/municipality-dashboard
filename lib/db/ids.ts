import { randomUUID } from "node:crypto";

/**
 * Prefixed identifiers (`req-…`, `dept-…`) so a bare id in a log line or a
 * URL is self-describing. The random half is a UUID, which makes collisions
 * a non-issue even when several workers insert at the same instant.
 */
export function newId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

/**
 * Turns a display name into a stable, readable id fragment — used when
 * seeding so the shipped sample rows keep their familiar ids.
 */
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
