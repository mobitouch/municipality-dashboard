
import { requirePermission } from "@/lib/auth/dal";
import { createApiKey, deleteApiKey, revokeApiKey } from "@/lib/auth/api-key";
import { recordAudit } from "@/lib/data/audit";
import { updateSettings } from "@/lib/data/settings";
import { apiKeySchema, settingsSchema } from "@/lib/validation";
import {
  errorState,
  formToObject,
  runAction,
  successState,
  validationError,
  type ActionState,
} from "./helpers";

export async function updateSettingsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = requirePermission("settings:manage");
    const parsed = settingsSchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    updateSettings(parsed.data);
    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "updated system settings",
      entityType: "settings",
    });

    return successState("Settings saved.");
  });
}

export async function createApiKeyAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = requirePermission("settings:manage");
    const parsed = apiKeySchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    const { plaintext } = createApiKey(parsed.data.label, user.name);
    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "created an API key",
      entityType: "api_key",
      detail: parsed.data.label,
    });

    // The plaintext is returned exactly once; only its hash is stored.
    return successState("API key created. Copy it now — it will not be shown again.", {
      key: plaintext,
    });
  });
}

export async function revokeApiKeyAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = requirePermission("settings:manage");
    const id = String(formData.get("id") ?? "");
    if (!revokeApiKey(id)) return errorState("That key is already revoked.");

    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "revoked an API key",
      entityType: "api_key",
      entityId: id,
    });

    return successState("API key revoked. Callers using it will now be rejected.");
  });
}

export async function deleteApiKeyAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = requirePermission("settings:manage");
    const id = String(formData.get("id") ?? "");
    if (!deleteApiKey(id)) return errorState("That key no longer exists.");

    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "deleted an API key",
      entityType: "api_key",
      entityId: id,
    });

    return successState("API key deleted.");
  });
}
