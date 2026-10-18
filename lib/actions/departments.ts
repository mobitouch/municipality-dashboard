import { createAction } from "./client";

// Browser-side handles for the server actions in server/actions/departments.ts.
export const createDepartmentAction = createAction("departments/create");
export const updateDepartmentAction = createAction("departments/update");
export const deleteDepartmentAction = createAction("departments/delete");
