import * as React from "react";
import { useRouter } from "@/lib/client/navigation";

import { Field } from "@/components/form/field";
import { FormDialog } from "@/components/form/form-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createRequestAction, updateRequestAction } from "@/lib/actions/requests";
import { toDateInputValue } from "@/lib/format";
import { PRIORITIES, REQUEST_SOURCES, REQUEST_STATUSES } from "@/lib/types";
import type { Category, Department, RequestDetail, Staff } from "@/lib/types";
import type { ActionState } from "@/lib/actions/types";

/** Radix Select rejects an empty value, so "none" is the on-screen stand-in for null. */
const NONE = "none";
const toFormValue = (value: string) => (value === NONE ? "" : value);

export function RequestFormDialog({
  trigger,
  departments,
  categories,
  staff,
  request,
  defaultKind = "request",
}: {
  trigger: React.ReactNode;
  departments: Department[];
  categories: Category[];
  staff: Staff[];
  request?: RequestDetail;
  defaultKind?: "request" | "complaint";
}) {
  const router = useRouter();
  const isEdit = Boolean(request);

  const [categoryId, setCategoryId] = React.useState(request?.categoryId ?? "");
  const [departmentId, setDepartmentId] = React.useState(request?.departmentId ?? NONE);
  const [assignedStaffId, setAssignedStaffId] = React.useState(
    request?.assignedStaffId ?? NONE
  );
  const [kind, setKind] = React.useState(request?.kind ?? defaultKind);

  // Picking a category pre-fills its default department, the way triage
  // would have routed it — still overridable before saving.
  const onCategoryChange = (value: string) => {
    setCategoryId(value);
    const category = categories.find((entry) => entry.id === value);
    if (!category) return;
    setKind(category.kind);
    if (!isEdit && category.defaultDepartmentId) {
      setDepartmentId(category.defaultDepartmentId);
      setAssignedStaffId(NONE);
    }
  };

  const onDepartmentChange = (value: string) => {
    setDepartmentId(value);
    // The previous assignee belongs to the previous department.
    setAssignedStaffId(NONE);
  };

  const staffInDepartment = staff.filter(
    (person) => departmentId !== NONE && person.departmentId === departmentId
  );

  const onSuccess = React.useCallback(
    (state: ActionState) => {
      const id = state.payload?.id;
      if (id && !isEdit) {
        router.push(`${state.payload?.kind === "complaint" ? "/complaints" : "/requests"}/${id}`);
      }
    },
    [isEdit, router]
  );

  return (
    <FormDialog
      trigger={trigger}
      title={isEdit ? `Edit ${request!.referenceNumber}` : "Log a new request"}
      description={
        isEdit
          ? "Changes are recorded in the request's activity history."
          : "Use this for walk-in, phone, and email intake. Website and chatbot submissions arrive automatically."
      }
      action={isEdit ? updateRequestAction : createRequestAction}
      submitLabel={isEdit ? "Save changes" : "Create request"}
      contentClassName="sm:max-w-2xl"
      onSuccess={onSuccess}
    >
      {({ fieldErrors }) => (
        <>
          {isEdit && <input type="hidden" name="id" value={request!.id} />}
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="departmentId" value={toFormValue(departmentId)} />
          <input type="hidden" name="assignedStaffId" value={toFormValue(assignedStaffId)} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Citizen name"
              htmlFor="citizenName"
              required
              errors={fieldErrors.citizenName}
            >
              <Input
                id="citizenName"
                name="citizenName"
                defaultValue={request?.citizenName}
                autoComplete="off"
                required
              />
            </Field>

            <Field label="Phone" htmlFor="phone" errors={fieldErrors.phone}>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={request?.phone}
                placeholder="+961 …"
                autoComplete="off"
              />
            </Field>

            <Field label="Email" htmlFor="email" errors={fieldErrors.email}>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={request?.email}
                autoComplete="off"
              />
            </Field>

            <Field label="Location" htmlFor="location" errors={fieldErrors.location}>
              <Input
                id="location"
                name="location"
                defaultValue={request?.location}
                placeholder="Street, area, landmark"
                autoComplete="off"
              />
            </Field>

            <Field label="Category" htmlFor="category-trigger" required errors={fieldErrors.categoryId}>
              <Select value={categoryId} onValueChange={onCategoryChange}>
                <SelectTrigger id="category-trigger" className="w-full">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Department" htmlFor="department-trigger" errors={fieldErrors.departmentId}>
              <Select value={departmentId} onValueChange={onDepartmentChange}>
                <SelectTrigger id="department-trigger" className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Assigned employee"
              htmlFor="staff-trigger"
              errors={fieldErrors.assignedStaffId}
              hint={departmentId === NONE ? "Choose a department first." : undefined}
            >
              <Select
                value={assignedStaffId}
                onValueChange={setAssignedStaffId}
                disabled={departmentId === NONE || staffInDepartment.length === 0}
              >
                <SelectTrigger id="staff-trigger" className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {staffInDepartment.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                      {person.role ? ` — ${person.role}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Priority" htmlFor="priority-trigger" errors={fieldErrors.priority}>
              <Select name="priority" defaultValue={request?.priority ?? "Normal"}>
                <SelectTrigger id="priority-trigger" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Status" htmlFor="status-trigger" errors={fieldErrors.status}>
              <Select name="status" defaultValue={request?.status ?? "New"}>
                <SelectTrigger id="status-trigger" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Target completion"
              htmlFor="dueAt"
              errors={fieldErrors.dueAt}
              hint="Optional — drives the overdue flag."
            >
              <Input
                id="dueAt"
                name="dueAt"
                type="date"
                defaultValue={toDateInputValue(request?.dueAt)}
              />
            </Field>

            {!isEdit && (
              <Field label="Received via" htmlFor="source-trigger" errors={fieldErrors.source}>
                <Select name="source" defaultValue="phone">
                  <SelectTrigger id="source-trigger" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source === "staff" ? "Logged by staff" : source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>

          <Field
            label="Description"
            htmlFor="description"
            required
            errors={fieldErrors.description}
          >
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={request?.description}
              placeholder="What did the citizen report?"
              required
            />
          </Field>
        </>
      )}
    </FormDialog>
  );
}
