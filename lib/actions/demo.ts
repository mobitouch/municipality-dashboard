import { createAction } from "./client";

// Browser-side handles for the server actions in server/actions/demo.ts.
export const resetDemoDataAction = createAction("demo/reset");
