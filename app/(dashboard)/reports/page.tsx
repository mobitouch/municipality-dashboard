import Link from "next/link";
import { readDb } from "@/lib/db";
import { buildSummary } from "@/lib/reports";
import PageShell from "@/components/PageShell";
import BarChartCard from "@/components/charts/BarChartCard";
import StatusPieChart from "@/components/charts/StatusPieChart";
import MonthlyTrendChart from "@/components/charts/MonthlyTrendChart";
import StatusBadge from "@/components/StatusBadge";
import { AlertTriangle } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  const db = readDb();
  const summary = buildSummary(db);

  return (
    <PageShell title="Reports" subtitle="Performance and volume reporting across all citizen requests">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-800">Requests by Department</h2>
          <BarChartCard data={summary.byDepartment} horizontal color="#4A6635" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-800">Requests by Status</h2>
          <StatusPieChart data={summary.byStatus} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Most Common Category</h2>
            <span className="text-sm font-medium text-koura-secondary">{summary.mostCommonCategory}</span>
          </div>
          <BarChartCard data={summary.byCategory} horizontal color="#8B5A2B" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Resolution Performance</h2>
            <span className="text-sm font-medium text-slate-500">
              Overall avg: {summary.totals.avgResolutionDays}d
            </span>
          </div>
          <p className="mb-3 text-xs text-slate-500">Average days to resolve, by department</p>
          <BarChartCard
            data={summary.resolutionPerformance.map((r) => ({ name: r.name, count: r.avgDays }))}
            horizontal
            color="#748047"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-1 text-sm font-semibold text-slate-800">Requests Received per Month</h2>
          <MonthlyTrendChart data={summary.perMonth} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h2 className="text-sm font-semibold text-slate-800">Urgent Unresolved Requests</h2>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {summary.urgentUnresolved.length}
            </span>
          </div>
          {summary.urgentUnresolved.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No urgent unresolved requests. 🎉</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Reference</th>
                    <th className="px-4 py-2.5 font-medium">Citizen</th>
                    <th className="px-4 py-2.5 font-medium">Category</th>
                    <th className="px-4 py-2.5 font-medium">Department</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.urgentUnresolved.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <Link href={`/requests/${r.id}`} className="font-medium text-koura-primary hover:underline">
                          {r.referenceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{r.citizenName}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.category}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.departmentName}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{formatDate(r.dateSubmitted)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
