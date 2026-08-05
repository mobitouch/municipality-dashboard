"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Keeps request lists current without a manual reload. Two details make it
 * cheap: it pauses entirely while the tab is hidden (a backgrounded
 * dashboard costs nothing), and it refreshes immediately on refocus so
 * coming back to the tab shows fresh data straight away.
 *
 * `router.refresh()` re-fetches server data in place, silently — wrapping
 * it in a transition surfaces `isPending` so the thin bar below can give
 * the "live" refresh a visible, unobtrusive moment instead of the page
 * just quietly changing under the user's cursor.
 */
export function AutoRefresh({ intervalSeconds = 30 }: { intervalSeconds?: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (intervalSeconds <= 0) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const refresh = () => startTransition(() => router.refresh());

    const start = () => {
      stop();
      timer = setInterval(refresh, intervalSeconds * 1000);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router, intervalSeconds]);

  return (
    <div
      aria-hidden
      className={cn(
        "bg-primary pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left scale-x-0 transition-transform duration-300 ease-out",
        isPending && "scale-x-100"
      )}
    />
  );
}
