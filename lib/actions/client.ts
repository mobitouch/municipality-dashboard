import { errorState, type ActionState } from "./types";
import { apiPost } from "@/lib/client/api";
import { navigateTo } from "@/lib/client/navigation";
import { invalidateAll } from "@/lib/client/query";

const SESSION_URL = "/api/app/session";

export type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Builds the browser-side handle for a server action. It posts the form to
 * `/api/app/actions/<name>` and hands back the `ActionState` the server
 * produced, so every form keeps the `(prevState, formData)` contract it was
 * written against.
 *
 * After a successful run all mounted screens refetch (the old
 * `revalidatePath`). A `redirect` in the result navigates away, so only the
 * session is refreshed first — the route guard must see the new session, or a
 * fresh sign-in would be bounced straight back to the login screen — while
 * the screen being left is not worth refetching (a deleted record would
 * just 404).
 */
export function createAction(name: string): Action {
  return async (_state, formData) => {
    let result: ActionState;
    try {
      // File inputs never occur in these forms; every value is a string.
      const body = new URLSearchParams(formData as unknown as Record<string, string>);
      result = await apiPost<ActionState>(`/api/app/actions/${name}`, body);
    } catch {
      return errorState("Could not reach the server. Check your connection and try again.");
    }

    if (result.status !== "error") {
      await invalidateAll(result.redirect ? (url) => url === SESSION_URL : undefined);
      if (result.redirect) navigateTo(result.redirect);
    }
    return result;
  };
}
