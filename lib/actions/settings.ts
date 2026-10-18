import { createAction } from "./client";

// Browser-side handles for the server actions in server/actions/settings.ts.
export const updateSettingsAction = createAction("settings/update");
export const createApiKeyAction = createAction("settings/createApiKey");
export const revokeApiKeyAction = createAction("settings/revokeApiKey");
export const deleteApiKeyAction = createAction("settings/deleteApiKey");
