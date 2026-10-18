
import { requirePermission } from "@/lib/auth/dal";
import { env } from "@/lib/env";
import { recordAudit } from "@/lib/data/audit";
import { errorState, runAction, successState, type ActionState } from "./helpers";

/**
 * Regenerates the illustrative case data (requests, notes, activity,
 * notifications) without touching accounts or structural data. Restricted
 * to non-production so a live deployment can never have its real caseload
 * wiped by a stray click.
 */
export async function resetDemoDataAction(
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    if (env.isProduction) {
      return errorState("Demo data reset is disabled in production.");
    }

    const user = requirePermission("settings:manage");
    const { seed } = await import("@/scripts/seed.mjs");
    const result = seed();

    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "reset demo data",
      entityType: "system",
      detail: `${result.requests} sample requests regenerated`,
    });

    return successState(`Demo data reset — ${result.requests} sample requests regenerated.`);
  });
}
