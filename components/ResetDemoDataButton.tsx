"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

export default function ResetDemoDataButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleReset() {
    if (!confirm("Reset all demo data? Any status changes, assignments, or notes made during this session will be lost.")) {
      return;
    }
    setLoading(true);
    setDone(false);
    await fetch("/api/admin/reset", { method: "POST" });
    setLoading(false);
    setDone(true);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleReset}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
      >
        <RotateCcw className="h-4 w-4" />
        {loading ? "Resetting..." : "Reset Demo Data"}
      </button>
      {done && <span className="text-sm text-emerald-600">Demo data reset.</span>}
    </div>
  );
}
