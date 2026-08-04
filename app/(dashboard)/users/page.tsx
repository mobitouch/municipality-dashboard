import type { Metadata } from "next";
import { PlusIcon, ShieldCheckIcon } from "lucide-react";

import { PageShell } from "@/components/app-shell/page-shell";
import { UserActions } from "@/components/users/user-actions";
import { UserFormDialog } from "@/components/users/user-form-dialog";
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
import { requireUser } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { listDepartments } from "@/lib/data/departments";
import { listUsers } from "@/lib/data/users";
import { ROLE_LABELS } from "@/lib/constants";
import { formatRelative, initials, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "User Accounts" };
export const dynamic = "force-dynamic";

const ROLE_BADGE = {
  admin: "default",
  supervisor: "secondary",
  staff: "outline",
} as const;

export default async function UsersPage() {
  const currentUser = await requireUser();

  // Sidebar hides this route without the permission; a direct URL still has
  // to be refused rather than rendered.
  if (!can(currentUser.role, "users:manage")) {
    return (
      <PageShell title="User Accounts">
        <div className="bg-card rounded-xl border p-10 text-center">
          <ShieldCheckIcon className="text-muted-foreground mx-auto mb-3 size-8" />
          <p className="font-medium">Administrators only</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Ask an administrator if you need access to user accounts.
          </p>
        </div>
      </PageShell>
    );
  }

  const users = listUsers();
  const departments = listDepartments({ includeInactive: true });

  return (
    <PageShell
      title="User Accounts"
      subtitle={`${pluralize(users.length, "account")} with access to this dashboard`}
      actions={
        <UserFormDialog
          departments={departments}
          trigger={
            <Button size="sm">
              <PlusIcon />
              <span className="hidden sm:inline">Invite user</span>
            </Button>
          }
        />
      }
    >
      <div className="bg-card overflow-hidden rounded-xl border">
        <Table className="min-w-[48rem]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Name</TableHead>
              <TableHead className="w-36">Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="w-40">Last sign-in</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className={cn(!user.isActive && "opacity-60")}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {initials(user.name)}
                    </div>
                    <div className="min-w-0">
                      <span className="flex items-center gap-2 font-medium">
                        {user.name}
                        {user.id === currentUser.id && (
                          <span className="text-muted-foreground text-xs font-normal">(you)</span>
                        )}
                      </span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={ROLE_BADGE[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.departmentName ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {user.lastLoginAt ? formatRelative(user.lastLoginAt) : "Never"}
                </TableCell>
                <TableCell>
                  {user.isActive ? (
                    user.mustChangePassword ? (
                      <span className="text-warning text-xs font-medium">Password reset</span>
                    ) : (
                      <span className="text-success text-xs font-medium">Active</span>
                    )
                  ) : (
                    <span className="text-muted-foreground text-xs">Deactivated</span>
                  )}
                </TableCell>
                <TableCell>
                  <UserActions
                    user={user}
                    departments={departments}
                    isSelf={user.id === currentUser.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  );
}
