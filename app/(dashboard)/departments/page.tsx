import { readDb } from "@/lib/db";
import PageShell from "@/components/PageShell";
import { CLOSED_STATUSES } from "@/lib/constants";
import { Building2, Users, ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default function DepartmentsPage() {
  const db = readDb();

  return (
    <PageShell title="Departments" subtitle="Municipal departments handling citizen requests">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {db.departments.map((dept) => {
          const staffCount = db.staff.filter((s) => s.departmentId === dept.id).length;
          const deptRequests = db.requests.filter((r) => r.departmentId === dept.id);
          const activeCount = deptRequests.filter((r) => !CLOSED_STATUSES.includes(r.status)).length;

          return (
            <div key={dept.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-koura-secondary/10 text-koura-secondary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-koura-text">{dept.name}</h3>
                  <p className="text-xs text-slate-500">Head: {dept.headOfDepartment}</p>
                </div>
              </div>
              <p className="mb-4 text-sm text-slate-600">{dept.description}</p>
              <div className="flex gap-4 border-t border-slate-100 pt-3 text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users className="h-4 w-4 text-slate-400" />
                  {staffCount} staff
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <ClipboardList className="h-4 w-4 text-slate-400" />
                  {activeCount} active / {deptRequests.length} total
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
