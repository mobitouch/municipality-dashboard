"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps a server-rendered page (reading data/db.json fresh on every
 * request, via `export const dynamic = "force-dynamic"`) feeling live
 * without a manual reload — nudges Next.js to re-fetch and re-render on an
 * interval. No websockets/SSE needed at this data volume.
 */
export default function AutoRefresh({ intervalMs = 8000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
