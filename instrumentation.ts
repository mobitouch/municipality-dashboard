/**
 * Runs once per server instance, before the first request is served. This
 * is where the SQLite schema is migrated and the first-boot data (default
 * departments, categories, the bootstrap administrator) is created, so no
 * request ever races an unmigrated database.
 */
export async function register() {
  // The database layer is Node-only; the edge runtime never touches it.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { ensureBootstrapped } = await import("@/lib/db/bootstrap");
  await ensureBootstrapped();
}
