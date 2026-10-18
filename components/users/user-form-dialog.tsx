import * as React from "react";

import { Field } from "@/components/form/field";
import { FormDialog } from "@/components/form/form-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUserAction, updateUserAction } from "@/lib/actions/users";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/constants";
import { USER_ROLES, type AppUser, type Department, type UserRole } from "@/lib/types";

const NONE = "none";

export function UserFormDialog({
  trigger,
  user,
  departments,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  user?: AppUser;
  departments: Department[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(user);
  const [role, setRole] = React.useState<UserRole>(user?.role ?? "staff");
  const [departmentId, setDepartmentId] = React.useState(user?.departmentId ?? NONE);

  return (
    <FormDialog
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${user!.name}` : "Invite a user"}
      description={
        isEdit
          ? "Role changes take effect immediately and sign the person out of any open sessions."
          : "Create a sign-in account for a member of municipal staff."
      }
      action={isEdit ? updateUserAction : createUserAction}
      submitLabel={isEdit ? "Save changes" : "Create account"}
    >
      {({ fieldErrors }) => (
        <>
          {isEdit && <input type="hidden" name="id" value={user!.id} />}
          <input type="hidden" name="role" value={role} />
          <input
            type="hidden"
            name="departmentId"
            value={departmentId === NONE ? "" : departmentId}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="user-name" required errors={fieldErrors.name}>
              <Input
                id="user-name"
                name="name"
                defaultValue={user?.name}
                required
                autoComplete="off"
              />
            </Field>

            <Field label="Email" htmlFor="user-email" required errors={fieldErrors.email}>
              <Input
                id="user-email"
                name="email"
                type="email"
                defaultValue={user?.email}
                required
                autoComplete="off"
              />
            </Field>
          </div>

          <Field
            label="Role"
            htmlFor="user-role"
            required
            errors={fieldErrors.role}
            hint={ROLE_DESCRIPTIONS[role]}
          >
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger id="user-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {ROLE_LABELS[entry]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Department"
            htmlFor="user-department"
            errors={fieldErrors.departmentId}
            hint="Optional — records which unit this person belongs to."
          >
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger id="user-department" className="w-full">
                <SelectValue placeholder="No department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No department</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {!isEdit && (
            <Field
              label="Temporary password"
              htmlFor="user-password"
              required
              errors={fieldErrors.password}
              hint="At least 10 characters. Share it over a channel you trust."
            >
              <Input
                id="user-password"
                name="password"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
              />
            </Field>
          )}

          <div className="grid gap-2.5">
            <div className="flex items-start gap-2.5 rounded-lg border p-3">
              <Checkbox
                id="user-active"
                name="isActive"
                defaultChecked={user?.isActive ?? true}
                className="mt-0.5"
              />
              <div className="grid gap-0.5">
                <Label htmlFor="user-active">Active</Label>
                <p className="text-muted-foreground text-xs">
                  Deactivating signs the person out immediately and blocks future sign-ins.
                </p>
              </div>
            </div>

            {!isEdit && (
              <div className="flex items-start gap-2.5 rounded-lg border p-3">
                <Checkbox
                  id="user-must-change"
                  name="mustChangePassword"
                  defaultChecked
                  className="mt-0.5"
                />
                <div className="grid gap-0.5">
                  <Label htmlFor="user-must-change">Require a password change</Label>
                  <p className="text-muted-foreground text-xs">
                    Prompts them to pick their own password after the first sign-in.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </FormDialog>
  );
}
