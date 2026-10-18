import * as React from "react";
import { useLocation, useNavigate, useSearchParams as useRouterSearchParams } from "react-router";

import { invalidateAll } from "./query";

/**
 * Thin adapters that keep the screens' `usePathname` / `useSearchParams` /
 * `useRouter` call sites unchanged on top of React Router.
 */
export function usePathname(): string {
  return useLocation().pathname;
}

export function useSearchParams(): URLSearchParams {
  return useRouterSearchParams()[0];
}

export function useRouter() {
  const navigate = useNavigate();
  return React.useMemo(
    () => ({
      push: (to: string) => void navigate(to),
      replace: (to: string) => void navigate(to, { replace: true }),
      /** Refetches the data behind every mounted screen, in place. */
      refresh: () => void invalidateAll(),
    }),
    [navigate]
  );
}

type Navigator = (to: string) => void;

let navigator: Navigator | null = null;

/** Registered once by the app root, so non-component code can navigate. */
export function setNavigator(next: Navigator | null): void {
  navigator = next;
}

export function navigateTo(to: string): void {
  if (navigator) navigator(to);
  else window.location.assign(to);
}
