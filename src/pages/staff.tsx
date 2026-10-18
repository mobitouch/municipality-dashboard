import { Link } from "@/components/link";
import { PlusIcon, UsersIcon } from "lucide-react";

import { PageShell } from "@/components/app-shell/page-shell";
import { PageSkeleton } from "@/components/app-shell/page-skeleton";
import { EmptyState } from "@/components/empty-state";
import { StaffActions } from "@/components/staff/staff-actions";
import { StaffFilters } from "@/components/staff/staff-filters";
import { StaffFormDialog } from "@/components/staff/staff-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSearchParams } from "@/lib/client/navigation";
import { useCan } from "@/lib/client/session";
import { useDocumentTitle } from "@/lib/client/use-document-title";
import { usePageData } from "@/lib/client/use-page-data";
import { initials, pluralize } from "@/lib/format";
import type { StaffPageData } from "@/lib/page-data";
import { cn } from "@/lib/utils";

export function StaffPage() {
  useDocumentTitle("Staff");
  const searchParams = useSearchParams();
  const single = (key: string) => searchParams.get(key) ?? "";
  const canManage = useCan("staff:manage");

  const { data } = usePageData<StaffPageData>(
    `/api/app/pages/staff?${new URLSearchParams({
      q: single("q"),
      departmentId: single("departmentId"),
      inactive: single("inactive"),
    }).toString()}`
  );

  if (!data) return <PageSkeleton />;

  const { departments, staff } = data;
  const hasFilters = Boolean(single("q") || single("departmentId") || single("inactive"));

  return (
    <PageShell
      title="Staff"
      subtitle={`${pluralize(staff.length, "employee")} available for request assignment`}
      actions={
        canManage &&
        departments.length > 0 && (
          <StaffFormDialog
            departments={departments}
            defaultDepartmentId={single("departmentId") || undefined}
            trigger={
              <Button size="sm">
                <PlusIcon />
                <span className="hidden sm:inline">Add staff</span>
              </Button>
            }
          />
        )
      }
    >
      <StaffFilters departments={departments} />

      {staff.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title={hasFilters ? "No matching staff" : "No staff yet"}
          description={
            hasFilters
              ? "Try a different search, or clear the filters."
              : departments.length === 0
                ? "Create a department first — every staff member belongs to one."
                : "Add the people who will be assigned citizen requests."
          }
          action={
            canManage && departments.length > 0 && !hasFilters ? (
              <StaffFormDialog
                departments={departments}
                trigger={
                  <Button>
                    <PlusIcon />
                    Add staff member
                  </Button>
                }
              />
            ) : departments.length === 0 ? (
              <Button asChild variant="outline">
                <Link href="/departments">Go to Departments</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          {/* Card list on phones; the table below needs horizontal room. */}
          <ul className="space-y-2.5 md:hidden">
            {staff.map((person) => (
              <li key={person.id} className="bg-card rounded-xl border p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {initials(person.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{person.name}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {[person.role, person.departmentName].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Badge variant="secondary">{person.activeRequestCount} active</Badge>
                    {canManage && <StaffActions staff={person} departments={departments} />}
                  </div>
                </div>
                <div className="text-muted-foreground mt-2.5 space-y-0.5 border-t pt-2.5 text-xs">
                  <p>{person.email || "No email"}</p>
                  <p>{person.phone || "No phone"}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="bg-card hidden overflow-hidden rounded-xl border md:block">
            <Table className="min-w-[48rem]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Name</TableHead>
                  <TableHead>Job title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="w-[7rem]">Workload</TableHead>
                  {canManage && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((person) => (
                  <TableRow key={person.id} className={cn(!person.isActive && "opacity-60")}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                          {initials(person.name)}
                        </div>
                        <div className="min-w-0">
                          <span className="block font-medium">{person.name}</span>
                          {!person.isActive && (
                            <span className="text-muted-foreground text-xs">Inactive</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{person.role || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <Link
                        href={`/staff?departmentId=${person.departmentId}`}
                        className="hover:text-foreground transition-colors"
                      >
                        {person.departmentName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      <span className="block">{person.email || "—"}</span>
                      <span className="block">{person.phone || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/requests?assignedStaffId=${person.id}`}>
                        <Badge variant="secondary" className="tabular-nums">
                          {person.activeRequestCount} active
                        </Badge>
                      </Link>
                      <span className="text-muted-foreground mt-0.5 block text-xs">
                        {person.totalRequestCount} total
                      </span>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <StaffActions staff={person} departments={departments} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </PageShell>
  );
}
