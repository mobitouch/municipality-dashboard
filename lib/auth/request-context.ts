import { AsyncLocalStorage } from "node:async_hooks";

import type { Request, Response } from "express";

import type { SessionUser } from "./session";

/**
 * The Express request/response pair for the call currently being handled.
 *
 * The data layer and the actions were written against ambient request state
 * (`cookies()`, `headers()`), so the server binds the pair to an
 * AsyncLocalStorage store at the top of every request and the auth helpers
 * read it back from there. That keeps `requirePermission(...)` a one-liner
 * at every call site instead of threading `req` through every function.
 */
export interface RequestContext {
  req: Request;
  res: Response;
  /** Memoized session lookup; `undefined` means "not resolved yet". */
  user?: SessionUser | null;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function withRequestContext<T>(req: Request, res: Response, fn: () => T): T {
  return storage.run({ req, res }, fn);
}

export function requestContext(): RequestContext {
  const context = storage.getStore();
  if (!context) throw new Error("No request context: called outside a request handler.");
  return context;
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;

    const raw = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return undefined;
}

export function headerValue(req: Request, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}
