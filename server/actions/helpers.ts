import { z } from "zod";

import { AccessDeniedError, NotAuthenticatedError } from "@/lib/auth/dal";
import { errorState, type ActionState } from "@/lib/actions/types";

export type { ActionState } from "@/lib/actions/types";
export { idleState, successState, errorState } from "@/lib/actions/types";

/**
 * Thrown by `redirect()` to unwind an action; `runAction` turns it into a
 * result the browser acts on, since there is no server-driven navigation
 * once the front end is a single-page app.
 */
export class RedirectSignal extends Error {
  constructor(readonly path: string) {
    super(`redirect:${path}`);
    this.name = "RedirectSignal";
  }
}

export function redirect(path: string): never {
  throw new RedirectSignal(path);
}

/** Turns a Zod failure into the shape the form components render. */
export function validationError(error: z.ZodError): ActionState {
  const flattened = z.flattenError(error);
  return errorState(
    "Please correct the highlighted fields.",
    flattened.fieldErrors as Record<string, string[]>
  );
}

function friendlySqliteMessage(message: string): string | null {
  if (message.includes("UNIQUE constraint failed")) {
    return "That value is already in use.";
  }
  if (message.includes("FOREIGN KEY constraint failed")) {
    return "This record is still referenced elsewhere and cannot be changed.";
  }
  if (message.includes("CHECK constraint failed")) {
    return "One of the submitted values is not allowed.";
  }
  return null;
}

/**
 * Wraps every action so a thrown error becomes a rendered message instead
 * of an unhandled rejection. A `redirect()` becomes a successful result
 * carrying the destination.
 */
export async function runAction(fn: () => Promise<ActionState>): Promise<ActionState> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof RedirectSignal) {
      return { status: "success", ranAt: Date.now(), redirect: error.path };
    }

    if (error instanceof NotAuthenticatedError) {
      return errorState(error.message);
    }
    if (error instanceof AccessDeniedError) {
      return errorState(error.message);
    }
    if (error instanceof z.ZodError) {
      return validationError(error);
    }
    if (error instanceof Error) {
      const friendly = friendlySqliteMessage(error.message);
      if (friendly) return errorState(friendly);
      console.error("[action]", error);
      return errorState(error.message || "Something went wrong. Please try again.");
    }

    console.error("[action]", error);
    return errorState("Something went wrong. Please try again.");
  }
}

/** FormData → plain object, so Zod sees ordinary values. */
export function formToObject(formData: FormData): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") entries[key] = value;
  }
  return entries;
}
