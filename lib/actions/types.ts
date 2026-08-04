/**
 * Split out from helpers.ts deliberately: this file must stay free of
 * "server-only" — client components (form dialogs, the workflow panel)
 * import `idleState`/`ActionState` to seed `useActionState`, and pulling
 * in the server-only chain here would break the client bundle.
 */
export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** Bumped on every completed run so clients can react to repeat results. */
  ranAt?: number;
  /** Set by actions that hand a value back, e.g. a freshly minted API key. */
  payload?: Record<string, string>;
}

export const idleState: ActionState = { status: "idle" };

export function successState(message: string, payload?: Record<string, string>): ActionState {
  return { status: "success", message, ranAt: Date.now(), payload };
}

export function errorState(
  message: string,
  fieldErrors?: Record<string, string[]>
): ActionState {
  return { status: "error", message, fieldErrors, ranAt: Date.now() };
}
