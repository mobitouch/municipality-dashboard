/**
 * Shared by the browser and the server. Client components import
 * `idleState`/`ActionState` to seed `useActionState`, and the server builds
 * its responses from the same constructors, so this file must stay free of
 * anything Node-only.
 */
export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** Bumped on every completed run so clients can react to repeat results. */
  ranAt?: number;
  /** Set by actions that hand a value back, e.g. a freshly minted API key. */
  payload?: Record<string, string>;
  /** A path the browser should navigate to once the action has completed. */
  redirect?: string;
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
