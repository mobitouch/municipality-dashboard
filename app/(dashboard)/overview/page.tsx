import { readDb } from "@/lib/db";
import { buildSummary } from "@/lib/reports";
import PageShell from "@/components/PageShell";
import MetricCard from "@/components/MetricCard";
import BarChartCard from "@/components/charts/BarChartCard";
import {
  ClipboardList,
  Sparkles,
  Loader,
  CheckCircle2,
  AlertTriangle,
  Timer,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function OverviewPage() {
  const db = readDb();
  const summary = buildSummary(db);
  const { totals } = summary;

  return (
    <PageShell
      title="Overview"
      subtitle="Live snapshot of citizen requests across the municipality"
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Total Requests" value={totals.total} icon={ClipboardList} accent="text-koura-primary bg-koura-primary/10" />
        <MetricCard label="New" value={totals.new} icon={Sparkles} accent="text-sky-600 bg-sky-50" />
        <MetricCard label="In Progress" value={totals.inProgress} icon={Loader} accent="text-violet-600 bg-violet-50" />
        <MetricCard label="Resolved" value={totals.resolved} icon={CheckCircle2} accent="text-emerald-600 bg-emerald-50" />
        <MetricCard label="Urgent" value={totals.urgent} icon={AlertTriangle} accent="text-red-600 bg-red-50" />
        <MetricCard
          label="Avg. Resolution Time"
          value={`${totals.avgResolutionDays}d`}
          icon={Timer}
          accent="text-amber-600 bg-amber-50"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-800">Requests by Department</h2>
          <p className="mb-3 text-xs text-slate-500">Current caseload across municipal departments</p>
          <BarChartCard data={summary.byDepartment} horizontal color="#4A6635" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-800">Requests by Category</h2>
          <p className="mb-3 text-xs text-slate-500">Most common types of citizen requests</p>
          <BarChartCard data={summary.byCategory} horizontal color="#8B5A2B" />
        </div>
      </div>
    </PageShell>
  );
}
