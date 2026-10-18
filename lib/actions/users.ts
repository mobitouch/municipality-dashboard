import { createAction } from "./client";

// Browser-side handles for the server actions in server/actions/users.ts.
export const createUserAction = createAction("users/create");
export const updateUserAction = createAction("users/update");
export const resetUserPasswordAction = createAction("users/resetPassword");
export const deleteUserAction = createAction("users/delete");
