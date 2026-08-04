"use client";

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
import { createCategoryAction, updateCategoryAction } from "@/lib/actions/categories";
import type { Category, Department } from "@/lib/types";

const NONE = "none";

export function CategoryFormDialog({
  trigger,
  category,
  departments,
  nextSortOrder = 0,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  category?: Category;
  departments: Department[];
  nextSortOrder?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(category);
  const [departmentId, setDepartmentId] = React.useState(
    category?.defaultDepartmentId ?? NONE
  );

  return (
    <FormDialog
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${category!.name}` : "Add a category"}
      description="Categories classify incoming requests and decide which department they land in by default."
      action={isEdit ? updateCategoryAction : createCategoryAction}
      submitLabel={isEdit ? "Save changes" : "Create category"}
    >
      {({ fieldErrors }) => (
        <>
          {isEdit && <input type="hidden" name="id" value={category!.id} />}
          <input
            type="hidden"
            name="defaultDepartmentId"
            value={departmentId === NONE ? "" : departmentId}
          />

          <Field label="Name" htmlFor="cat-name" required errors={fieldErrors.name}>
            <Input
              id="cat-name"
              name="name"
              defaultValue={category?.name}
              placeholder="Street Lighting"
              required
              autoComplete="off"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Type"
              htmlFor="cat-kind"
              required
              errors={fieldErrors.kind}
              hint="Decides which screen new submissions appear on."
            >
              <Select name="kind" defaultValue={category?.kind ?? "request"}>
                <SelectTrigger id="cat-kind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="request">Citizen request</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Display order"
              htmlFor="cat-sort"
              errors={fieldErrors.sortOrder}
              hint="Lower numbers appear first."
            >
              <Input
                id="cat-sort"
                name="sortOrder"
                type="number"
                min={0}
                max={999}
                defaultValue={category?.sortOrder ?? nextSortOrder}
              />
            </Field>
          </div>

          <Field
            label="Default department"
            htmlFor="cat-department"
            errors={fieldErrors.defaultDepartmentId}
            hint="New requests in this category are routed here automatically."
          >
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger id="cat-department" className="w-full">
                <SelectValue placeholder="No default routing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No default routing</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="flex items-start gap-2.5 rounded-lg border p-3">
            <Checkbox
              id="cat-active"
              name="isActive"
              defaultChecked={category?.isActive ?? true}
              className="mt-0.5"
            />
            <div className="grid gap-0.5">
              <Label htmlFor="cat-active">Active</Label>
              <p className="text-muted-foreground text-xs">
                Inactive categories are hidden from intake forms; existing requests keep them.
              </p>
            </div>
          </div>
        </>
      )}
    </FormDialog>
  );
}
