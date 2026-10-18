import * as React from "react";

import { apiGet, ApiError } from "./api";

/**
 * A deliberately small data layer: each screen reads one JSON endpoint, and
 * after any mutation every mounted read is fetched again — the same effect
 * `revalidatePath` had when the pages rendered on the server. Stale data
 * stays on screen while a refetch is in flight, so refreshing never flashes
 * a skeleton.
 */
interface ActiveQuery {
  url: string;
  refetch: () => Promise<void>;
}

const active = new Set<ActiveQuery>();
const unauthorizedListeners = new Set<() => void>();

/**
 * Refetches every mounted read (or just those whose URL passes `only`);
 * resolves once all of them have settled.
 */
export async function invalidateAll(only?: (url: string) => boolean): Promise<void> {
  const queries = [...active].filter((query) => !only || only(query.url));
  await Promise.all(queries.map((query) => query.refetch()));
}

/** Called when any read comes back 401, so the session can be re-checked. */
export function onUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export interface QueryResult<T> {
  data: T | undefined;
  error: Error | null;
  /** True until the first response (or failure) for this hook arrives. */
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useApi<T>(url: string | null): QueryResult<T> {
  const [data, setData] = React.useState<T | undefined>(undefined);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState(url !== null);
  const latest = React.useRef(0);

  const run = React.useCallback(async () => {
    if (url === null) return;
    const ticket = ++latest.current;
    try {
      const next = await apiGet<T>(url);
      if (ticket !== latest.current) return;
      setData(next);
      setError(null);
    } catch (caught) {
      if (ticket !== latest.current) return;
      if (caught instanceof ApiError && caught.status === 401) {
        unauthorizedListeners.forEach((listener) => listener());
      }
      setError(caught instanceof Error ? caught : new Error("Request failed."));
    } finally {
      if (ticket === latest.current) setLoading(false);
    }
  }, [url]);

  React.useEffect(() => {
    if (url === null) return;
    const query: ActiveQuery = { url, refetch: run };
    active.add(query);
    // Fetch-on-mount: the state updates happen once the response arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run();
    return () => {
      active.delete(query);
      // Invalidate any response still in flight for this URL. `latest` is a
      // plain counter, not a DOM ref, so reading it at cleanup is the point.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      latest.current++;
    };
  }, [url, run]);

  return { data, error, loading, refetch: run };
}
