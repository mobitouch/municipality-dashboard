import type { ActionState } from "@/lib/actions/types";
import * as auth from "./auth";
import * as categories from "./categories";
import * as demo from "./demo";
import * as departments from "./departments";
import * as requests from "./requests";
import * as settings from "./settings";
import * as staff from "./staff";
import * as users from "./users";

export type ActionHandler = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Every mutation the dashboard can perform, addressed as `domain/verb`.
 * The browser-side stubs in `lib/actions/*` post to
 * `/api/app/actions/<domain>/<verb>`; anything not listed here is a 404, so
 * the endpoint can never be pointed at an arbitrary function.
 */
export const ACTIONS: Record<string, ActionHandler> = {
  "auth/login": auth.loginAction,
  "auth/logout": auth.logoutAction,
  "auth/changePassword": auth.changePasswordAction,
  "auth/updateProfile": auth.updateProfileAction,

  "requests/create": requests.createRequestAction,
  "requests/update": requests.updateRequestAction,
  "requests/patch": requests.patchRequestAction,
  "requests/addNote": requests.addNoteAction,
  "requests/delete": requests.deleteRequestAction,

  "categories/create": categories.createCategoryAction,
  "categories/update": categories.updateCategoryAction,
  "categories/delete": categories.deleteCategoryAction,

  "departments/create": departments.createDepartmentAction,
  "departments/update": departments.updateDepartmentAction,
  "departments/delete": departments.deleteDepartmentAction,

  "staff/create": staff.createStaffAction,
  "staff/update": staff.updateStaffAction,
  "staff/delete": staff.deleteStaffAction,

  "users/create": users.createUserAction,
  "users/update": users.updateUserAction,
  "users/resetPassword": users.resetUserPasswordAction,
  "users/delete": users.deleteUserAction,

  "settings/update": settings.updateSettingsAction,
  "settings/createApiKey": settings.createApiKeyAction,
  "settings/revokeApiKey": settings.revokeApiKeyAction,
  "settings/deleteApiKey": settings.deleteApiKeyAction,

  "demo/reset": demo.resetDemoDataAction,
};
