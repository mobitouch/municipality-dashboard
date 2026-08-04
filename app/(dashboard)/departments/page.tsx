import Link from "next/link";
import type { Metadata } from "next";
import { Building2Icon, ClipboardListIcon, PlusIcon, UsersIcon } from "lucide-react";

import { PageShell } from "@/components/app-shell/page-shell";
import { DepartmentActions } from "@/components/departments/department-actions";
import { DepartmentFormDialog } from "@/components/departments/department-form-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { listDepartmentsWithStats } from "@/lib/data/departments";
import { pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Departments" };
export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const user = await requireUser();
  const departments = listDepartmentsWithStats();
  const canManage = can(user.role, "departments:manage");

  return (
    <PageShell
      title="Departments"
      subtitle={`${pluralize(departments.length, "department")} handling citizen requests`}
      actions={
        canManage && (
          <DepartmentFormDialog
            trigger={
              <Button size="sm">
                <PlusIcon />
                <span className="hidden sm:inline">Add department</span>
              </Button>
            }
          />
        )
      }
    >
      {departments.length === 0 ? (
        <EmptyState
          icon={Building2Icon}
          title="No departments yet"
          description="Departments are the units that citizen requests get routed to. Create the first one to start assigning work."
          action={
            canManage && (
              <DepartmentFormDialog
                trigger={
                  <Button>
                    <PlusIcon />
                    Add department
                  </Button>
                }
              />
            )
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {departments.map((department) => (
            <div
              key={department.id}
              className="bg-card flex flex-col rounded-xl border p-4"
            >
              <div className="mb-3 flex items-start gap-3">
                <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <Building2Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{department.name}</h3>
                    {!department.isActive && (
                      <Badge variant="secondary" className="shrink-0">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    {department.headOfDepartment
                      ? `Head: ${department.headOfDepartment}`
                      : "No head assigned"}
                  </p>
                </div>
                {canManage && <DepartmentActions department={department} />}
              </div>

              <p className="text-muted-foreground mb-4 line-clamp-2 flex-1 text-sm">
                {department.description || "No description yet."}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-sm">
                <Link
                  href={`/staff?departmentId=${department.id}`}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <UsersIcon className="text-muted-foreground size-4" />
                  {pluralize(department.staffCount, "staff member")}
                </Link>
                <Link
                  href={`/requests?departmentId=${department.id}`}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <ClipboardListIcon className="text-muted-foreground size-4" />
                  {department.activeRequestCount} active / {department.totalRequestCount} total
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
