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
import { createStaffAction, updateStaffAction } from "@/lib/actions/staff";
import type { Department, Staff } from "@/lib/types";

export function StaffFormDialog({
  trigger,
  staff,
  departments,
  defaultDepartmentId,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  staff?: Staff;
  departments: Department[];
  defaultDepartmentId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(staff);

  return (
    <FormDialog
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${staff!.name}` : "Add a staff member"}
      description={
        isEdit
          ? "Staff members are the people requests get assigned to."
          : "Add someone who can be assigned citizen requests."
      }
      action={isEdit ? updateStaffAction : createStaffAction}
      submitLabel={isEdit ? "Save changes" : "Add staff member"}
    >
      {({ fieldErrors }) => (
        <>
          {isEdit && <input type="hidden" name="id" value={staff!.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="staff-name" required errors={fieldErrors.name}>
              <Input
                id="staff-name"
                name="name"
                defaultValue={staff?.name}
                required
                autoComplete="off"
              />
            </Field>

            <Field label="Job title" htmlFor="staff-role" errors={fieldErrors.role}>
              <Input
                id="staff-role"
                name="role"
                defaultValue={staff?.role}
                placeholder="Field Technician"
                autoComplete="off"
              />
            </Field>
          </div>

          <Field
            label="Department"
            htmlFor="staff-department"
            required
            errors={fieldErrors.departmentId}
          >
            <Select
              name="departmentId"
              defaultValue={staff?.departmentId ?? defaultDepartmentId ?? departments[0]?.id}
              required
            >
              <SelectTrigger id="staff-department" className="w-full">
                <SelectValue placeholder="Choose a department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="staff-email" errors={fieldErrors.email}>
              <Input
                id="staff-email"
                name="email"
                type="email"
                defaultValue={staff?.email}
                autoComplete="off"
              />
            </Field>
            <Field label="Phone" htmlFor="staff-phone" errors={fieldErrors.phone}>
              <Input
                id="staff-phone"
                name="phone"
                type="tel"
                defaultValue={staff?.phone}
                autoComplete="off"
              />
            </Field>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border p-3">
            <Checkbox
              id="staff-active"
              name="isActive"
              defaultChecked={staff?.isActive ?? true}
              className="mt-0.5"
            />
            <div className="grid gap-0.5">
              <Label htmlFor="staff-active">Active</Label>
              <p className="text-muted-foreground text-xs">
                Inactive staff keep their request history but can no longer be assigned new work.
              </p>
            </div>
          </div>
        </>
      )}
    </FormDialog>
  );
}
