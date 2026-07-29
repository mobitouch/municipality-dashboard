import { readDb } from "@/lib/db";
import PageShell from "@/components/PageShell";
import { CLOSED_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function StaffPage() {
  const db = readDb();
  const deptName = (id: string) => db.departments.find((d) => d.id === id)?.name ?? id;

  return (
    <PageShell title="Staff" subtitle="Municipal employees available for request assignment">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
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
