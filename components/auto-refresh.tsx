import { useEffect, useState } from "react";

import { invalidateAll } from "@/lib/client/query";
import { cn } from "@/lib/utils";

/**
 * Keeps request lists current without a manual reload. Two details make it
 * cheap: it pauses entirely while the tab is hidden (a backgrounded
 * dashboard costs nothing), and it refreshes immediately on refocus so
 * coming back to the tab shows fresh data straight away.
 *
 * Refetching happens in place, silently — `isPending` drives the thin bar
 * below, which gives the "live" refresh a visible, unobtrusive moment instead
 * of the page just quietly changing under the user's cursor.
 */
export function AutoRefresh({ intervalSeconds = 30 }: { intervalSeconds?: number }) {
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (intervalSeconds <= 0) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    let unmounted = false;

    const refresh = () => {
      setIsPending(true);
      void invalidateAll().finally(() => {
        if (!unmounted) setIsPending(false);
      });
    };

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
      unmounted = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalSeconds]);

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
