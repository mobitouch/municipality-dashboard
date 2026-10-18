/**
 * In-process fixed-window rate limiting.
 *
 * The dashboard is a single Node process backed by one SQLite file, so a
 * local map is accurate here — unlike the login throttle in `auth/session.ts`,
 * which is persisted because it must survive a restart (an attacker should
 * not be able to clear their strike count by waiting for a redeploy). These
 * limits are about shedding load, so losing them on restart is fine.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const MAX_KEYS = 10_000;
const SWEEP_INTERVAL_MS = 60_000;

const buckets = new Map<string, Entry>();
let lastSweep = Date.now();

function sweep(now: number) {
  lastSweep = now;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
  // Bound the map even under a flood of distinct live keys. Map iterates in
  // insertion order, so this drops the oldest first.
  if (buckets.size > MAX_KEYS) {
    let excess = buckets.size - MAX_KEYS;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (--excess <= 0) break;
    }
  }
}

export function limitExceeded(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (now - lastSweep > SWEEP_INTERVAL_MS || buckets.size > MAX_KEYS) sweep(now);

  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= max) return true;

  entry.count += 1;
  return false;
}

/**
 * Intake ceiling for `POST /api/requests`, per integration key.
 *
 * The municipal website applies its own per-citizen limit before forwarding,
 * but that only covers the website. This is the backstop for the key itself:
 * a leaked or misconfigured integration credential (or a runaway n8n loop)
 * would otherwise be free to write to the requests table until the disk
 * filled. 60/minute is far above the real traffic of a town this size.
 */
export function intakeLimitExceeded(callerId: string): boolean {
  return limitExceeded(`intake:${callerId}`, 60, 60_000);
}
