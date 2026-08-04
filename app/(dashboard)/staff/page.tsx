import { readDb } from "@/lib/db";
import PageShell from "@/components/PageShell";
import { CLOSED_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function StaffPage() {
  const db = readDb();
  const deptName = (id: string) => db.departments.find((d) => d.id === id)?.name ?? id;

  return (
    <PageShell title="Staff" subtitle="Municipal employees available for request assignment">
      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {db.staff.map((s) => {
          const active = db.requests.filter(
            (r) => r.assignedStaffId === s.id && !CLOSED_STATUSES.includes(r.status)
          ).length;
          return (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-koura-primary/10 text-xs font-semibold text-koura-primary">
                    {s.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{s.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {s.role} · {deptName(s.departmentId)}
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {active} active
                </span>
              </div>
              <div className="mt-3 space-y-0.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <div>{s.email}</div>
                <div>{s.phone}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Active Requests</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {db.staff.map((s) => {
              const active = db.requests.filter(
                (r) => r.assignedStaffId === s.id && !CLOSED_STATUSES.includes(r.status)
              ).length;
              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-koura-primary/10 text-xs font-semibold text-koura-primary">
                        {s.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <span className="font-medium text-slate-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.role}</td>
                  <td className="px-4 py-3 text-slate-600">{deptName(s.departmentId)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    <div>{s.email}</div>
                    <div>{s.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {active}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </PageShell>
  );
}
