import "server-only";

import { cache } from "react";

import { all, get, run } from "@/lib/db/client";

export interface AppSettings {
  organisationName: string;
  notifyCitizenOnCreate: boolean;
  notifyCitizenOnStatusChange: boolean;
  notifyStaffOnUrgent: boolean;
  defaultRequestPriority: string;
  autoRefreshSeconds: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  organisationName: "MobiTouch Municipality",
  notifyCitizenOnCreate: true,
  notifyCitizenOnStatusChange: true,
  notifyStaffOnUrgent: true,
  defaultRequestPriority: "Normal",
  autoRefreshSeconds: 30,
};

/**
 * Values are stored as text; the accessor coerces back to the declared
 * shape. Wrapped in `cache()` because every dashboard render reads it from
 * the layout, PageShell, and the page itself — one query per request
 * instead of two or three identical ones.
 */
export const getSettings = cache((): AppSettings => {
  const rows = all<{ key: string; value: string }>("SELECT key, value FROM settings");
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return {
    organisationName: stored.organisationName ?? DEFAULT_SETTINGS.organisationName,
    notifyCitizenOnCreate:
      stored.notifyCitizenOnCreate !== undefined
        ? stored.notifyCitizenOnCreate === "true"
        : DEFAULT_SETTINGS.notifyCitizenOnCreate,
    notifyCitizenOnStatusChange:
      stored.notifyCitizenOnStatusChange !== undefined
        ? stored.notifyCitizenOnStatusChange === "true"
        : DEFAULT_SETTINGS.notifyCitizenOnStatusChange,
    notifyStaffOnUrgent:
      stored.notifyStaffOnUrgent !== undefined
        ? stored.notifyStaffOnUrgent === "true"
        : DEFAULT_SETTINGS.notifyStaffOnUrgent,
    defaultRequestPriority: stored.defaultRequestPriority ?? DEFAULT_SETTINGS.defaultRequestPriority,
    autoRefreshSeconds: Number(stored.autoRefreshSeconds ?? DEFAULT_SETTINGS.autoRefreshSeconds),
  };
});

export function setSetting(key: keyof AppSettings, value: string | number | boolean): void {
  run(
    `INSERT INTO settings (key, value, updated_at) VALUES (:key, :value, :updatedAt)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    { key, value: String(value), updatedAt: new Date().toISOString() }
  );
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  for (const [key, value] of Object.entries(partial)) {
    if (value !== undefined) setSetting(key as keyof AppSettings, value);
  }
  return getSettings();
}

export function settingsInitialised(): boolean {
  return (get<{ count: number }>("SELECT COUNT(*) AS count FROM settings")?.count ?? 0) > 0;
}
