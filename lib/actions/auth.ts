import { createAction } from "./client";

// Browser-side handles for the server actions in server/actions/auth.ts.
export const loginAction = createAction("auth/login");
export const logoutAction = createAction("auth/logout");
export const changePasswordAction = createAction("auth/changePassword");
export const updateProfileAction = createAction("auth/updateProfile");
