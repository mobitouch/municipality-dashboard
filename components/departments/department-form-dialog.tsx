import * as React from "react";

import { Field } from "@/components/form/field";
import { FormDialog } from "@/components/form/form-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDepartmentAction, updateDepartmentAction } from "@/lib/actions/departments";
import type { Department } from "@/lib/types";

export function DepartmentFormDialog({
  trigger,
  department,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  department?: Department;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(department);

  return (
    <FormDialog
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${department!.name}` : "Add a department"}
      description={
        isEdit
          ? "Departments own requests and the staff who resolve them."
          : "Create a unit that citizen requests can be routed to."
      }
      action={isEdit ? updateDepartmentAction : createDepartmentAction}
      submitLabel={isEdit ? "Save changes" : "Create department"}
    >
      {({ fieldErrors }) => (
        <>
          {isEdit && <input type="hidden" name="id" value={department!.id} />}

          <Field label="Name" htmlFor="dept-name" required errors={fieldErrors.name}>
            <Input
              id="dept-name"
              name="name"
              defaultValue={department?.name}
              placeholder="Public Works"
              required
              autoComplete="off"
            />
          </Field>

          <Field
            label="Head of department"
            htmlFor="dept-head"
            errors={fieldErrors.headOfDepartment}
          >
            <Input
              id="dept-head"
              name="headOfDepartment"
              defaultValue={department?.headOfDepartment}
              autoComplete="off"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="dept-email" errors={fieldErrors.email}>
              <Input
                id="dept-email"
                name="email"
                type="email"
                defaultValue={department?.email}
                autoComplete="off"
              />
            </Field>
            <Field label="Phone" htmlFor="dept-phone" errors={fieldErrors.phone}>
              <Input
                id="dept-phone"
                name="phone"
                type="tel"
                defaultValue={department?.phone}
                autoComplete="off"
              />
            </Field>
          </div>

          <Field label="Description" htmlFor="dept-description" errors={fieldErrors.description}>
            <Textarea
              id="dept-description"
              name="description"
              rows={3}
              defaultValue={department?.description}
              placeholder="What this department is responsible for."
            />
          </Field>

          <div className="flex items-start gap-2.5 rounded-lg border p-3">
            <Checkbox
              id="dept-active"
              name="isActive"
              defaultChecked={department?.isActive ?? true}
              className="mt-0.5"
            />
            <div className="grid gap-0.5">
              <Label htmlFor="dept-active">Active</Label>
              <p className="text-muted-foreground text-xs">
                Inactive departments stay attached to their history but stop appearing in
                assignment menus.
              </p>
            </div>
          </div>
        </>
      )}
    </FormDialog>
  );
}
