import Link from "next/link";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import type { CitizenRequest, Department } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function RequestsTable({
  requests,
  departments,
  basePath,
}: {
  requests: CitizenRequest[];
  departments: Department[];
  basePath: string;
}) {
  const deptName = (id: string | null) =>
    id ? departments.find((d) => d.id === id)?.name ?? id : "Unassigned";

  if (!requests.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        No requests match the current filters.
      </div>
    );
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {requests.map((r) => (
          <Link
            key={r.id}
            href={`${basePath}/${r.id}`}
            className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-koura-primary/30 active:bg-koura-bg"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-koura-primary">{r.referenceNumber}</p>
                <p className="mt-0.5 truncate text-sm text-slate-700">{r.citizenName}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <PriorityBadge priority={r.priority} />
                <StatusBadge status={r.status} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <span>{r.category}</span>
              <span className="text-slate-300">·</span>
              <span>{deptName(r.departmentId)}</span>
              <span className="text-slate-300">·</span>
              <span>{formatDate(r.dateSubmitted)}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Citizen</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`${basePath}/${r.id}`} className="font-medium text-koura-primary hover:underline">
                    {r.referenceNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{r.citizenName}</td>
                <td className="px-4 py-3 text-slate-600">{r.category}</td>
                <td className="px-4 py-3 text-slate-600">{deptName(r.departmentId)}</td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={r.priority} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(r.dateSubmitted)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
