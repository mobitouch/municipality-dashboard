import "server-only";

import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { AccessDeniedError, NotAuthenticatedError } from "@/lib/auth/dal";
import { errorState, type ActionState } from "./types";

export type { ActionState } from "./types";
export { idleState, successState, errorState } from "./types";

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
 * Wraps every server action so a thrown error becomes a rendered message
 * instead of an unhandled rejection. Framework control-flow exceptions
 * (redirect, notFound) are re-thrown untouched — swallowing those would
 * silently break navigation.
 */
export async function runAction(fn: () => Promise<ActionState>): Promise<ActionState> {
  try {
    return await fn();
  } catch (error) {
    unstable_rethrow(error);

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
