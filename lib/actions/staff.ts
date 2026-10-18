import { createAction } from "./client";

// Browser-side handles for the server actions in server/actions/staff.ts.
export const createStaffAction = createAction("staff/create");
export const updateStaffAction = createAction("staff/update");
export const deleteStaffAction = createAction("staff/delete");
