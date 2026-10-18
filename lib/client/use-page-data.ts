import { ApiError } from "./api";
import { useApi } from "./query";

/**
 * Reads one screen's data. Returns `undefined` while it loads — and while a
 * 401/403 is being resolved by the route guard, which is about to move the
 * visitor to the sign-in or change-password screen. A missing record comes
 * back as `notFound`; anything else unexpected is thrown so the nearest
 * error boundary can show its retry prompt.
 */
export function usePageData<T>(url: string): { data: T | undefined; notFound: boolean } {
  const { data, error } = useApi<T>(url);

  if (error && data === undefined) {
    if (error instanceof ApiError) {
      if (error.status === 404) return { data: undefined, notFound: true };
      if (error.status === 401 || error.status === 403) return { data: undefined, notFound: false };
    }
    throw error;
  }

  return { data, notFound: false };
}
