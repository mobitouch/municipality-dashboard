import { createAction } from "./client";

// Browser-side handles for the server actions in server/actions/categories.ts.
export const createCategoryAction = createAction("categories/create");
export const updateCategoryAction = createAction("categories/update");
export const deleteCategoryAction = createAction("categories/delete");
