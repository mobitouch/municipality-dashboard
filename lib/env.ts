import "server-only";

import { z } from "zod";

/**
 * Environment is validated once, at first import, so a misconfigured
 * deployment fails loudly at boot instead of at the first request that
 * happens to touch the bad value.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  /** Where the SQLite file lives. Relative paths resolve from the project root. */
  DATABASE_PATH: z.string().trim().min(1).optional(),

  /** Bootstrap administrator, created only when the users table is empty. */
  ADMIN_EMAIL: z.email().trim().default("admin@mobitouch.demo"),
  ADMIN_NAME: z.string().trim().min(1).default("Administrator"),
  ADMIN_PASSWORD: z.string().min(8).default("Demo@2026"),

  /**
   * Optional pre-shared key for external callers (the municipal website's
   * forms, n8n). When set on a fresh database it is registered as the first
   * API key so existing integrations keep working without a manual step.
   */
  API_KEY: z.string().trim().min(8).optional(),

  /**
   * Seeds the illustrative dataset on a brand-new database. Defaults on
   * outside production so a fresh checkout has something to look at.
   */
  SEED_DEMO_DATA: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === "production",
  seedDemoData: process.env.SEED_DEMO_DATA
    ? raw.SEED_DEMO_DATA
    : raw.NODE_ENV !== "production",
};

/** True when the bootstrap admin would be created with the shipped default. */
export function usingDefaultAdminPassword(): boolean {
  return !process.env.ADMIN_PASSWORD;
}

/**
 * Refuses to create the very first administrator with the default password on
 * a production deployment.
 *
 * This used to be a console warning. A warning is not a control: the default
 * is committed in `.env.example`, so anyone who can read the repository can
 * sign in to an internet-facing dashboard holding citizens' names, phone
 * numbers and addresses — and because the bootstrap account is created with
 * `must_change_password = 0`, nothing would prompt anyone to change it.
 *
 * Deliberately narrow. It throws only when the users table is empty and we are
 * about to create that account for real, so an already-deployed instance with
 * genuine accounts is never blocked from booting by this check — for it,
 * ADMIN_PASSWORD is irrelevant.
 */
export function assertBootstrapAdminSafe(): void {
  if (!env.isProduction || !usingDefaultAdminPassword()) return;

  throw new Error(
    "Refusing to create the bootstrap administrator with the default password in production.\n" +
      "ADMIN_PASSWORD is unset, and the fallback is published in .env.example.\n" +
      "Set ADMIN_PASSWORD to a strong value in the hosting environment and restart."
  );
}

/** Non-fatal configuration smells, surfaced in the boot log. */
export function assertProductionSafety(): string[] {
  const warnings: string[] = [];
  if (!env.isProduction) return warnings;

  if (env.seedDemoData) {
    warnings.push("SEED_DEMO_DATA=true in production — sample requests will be inserted.");
  }
  return warnings;
}
