import { createAction } from "./client";

// Browser-side handles for the server actions in server/actions/requests.ts.
export const createRequestAction = createAction("requests/create");
export const updateRequestAction = createAction("requests/update");
export const patchRequestAction = createAction("requests/patch");
export const addNoteAction = createAction("requests/addNote");
export const deleteRequestAction = createAction("requests/delete");
