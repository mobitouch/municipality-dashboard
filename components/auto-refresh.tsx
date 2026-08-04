"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps request lists current without a manual reload. Two details make it
 * cheap: it pauses entirely while the tab is hidden (a backgrounded
 * dashboard costs nothing), and it refreshes immediately on refocus so
 * coming back to the tab shows fresh data straight away.
 */
export function AutoRefresh({ intervalSeconds = 30 }: { intervalSeconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    if (intervalSeconds <= 0) return;

    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      stop();
      timer = setInterval(() => router.refresh(), intervalSeconds * 1000);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
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

  return null;
}
