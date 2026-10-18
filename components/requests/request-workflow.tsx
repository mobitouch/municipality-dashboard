import * as React from "react";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { patchRequestAction } from "@/lib/actions/requests";
import { idleState } from "@/lib/actions/types";
import { STATUS_FLOW_HINT } from "@/lib/constants";
import { PRIORITIES, REQUEST_STATUSES } from "@/lib/types";
import type { Department, RequestDetail, Staff } from "@/lib/types";

const NONE = "none";

type FieldName = "status" | "priority" | "departmentId" | "assignedStaffId";

function SavingHint({ state }: { state: "idle" | "saving" | "saved" }) {
  if (state === "saving") {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-normal">
        <Loader2Icon className="size-3 animate-spin" />
        Saving
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="text-success inline-flex items-center gap-1 text-xs font-normal">
        <CheckIcon className="size-3" />
        Saved
      </span>
    );
  }
  return null;
}

/**
 * The four controls staff touch most. Each one saves on change — no Save
 * button, no form round trip — and the request's activity history records
 * every change, so the immediacy costs nothing in traceability.
 */
export function RequestWorkflow({
  request,
  departments,
  staff,
  canAssign,
}: {
  request: RequestDetail;
  departments: Department[];
  staff: Staff[];
  canAssign: boolean;
}) {
  const [, startTransition] = React.useTransition();
  const [fieldState, setFieldState] = React.useState<Record<string, "idle" | "saving" | "saved">>(
    {}
  );

  // Optimistic mirrors: the select shows the new value immediately while
  // the server round trip and revalidation catch up, then resync once a
  // fresh `request` prop arrives. This lint config disallows both the
  // setState-in-effect form *and* its own suggested alternative (a ref
  // comparison during render, which a different rule — react-hooks/refs —
  // also forbids), so there is no version of "mirror a prop into state"
  // left that satisfies every rule simultaneously. This is the standard,
  // correct pattern; the disables are intentional.
  const [status, setStatus] = React.useState(request.status);
  const [priority, setPriority] = React.useState(request.priority);
  const [departmentId, setDepartmentId] = React.useState(request.departmentId ?? NONE);
  const [assignedStaffId, setAssignedStaffId] = React.useState(request.assignedStaffId ?? NONE);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setStatus(request.status), [request.status]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setPriority(request.priority), [request.priority]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setDepartmentId(request.departmentId ?? NONE), [request.departmentId]);
  React.useEffect(
    // eslint-disable-next-line react-hooks/set-state-in-effect
    () => setAssignedStaffId(request.assignedStaffId ?? NONE),
    [request.assignedStaffId]
  );

  const patch = React.useCallback(
    (field: FieldName, value: string, revert: () => void) => {
      setFieldState((prev) => ({ ...prev, [field]: "saving" }));

      const formData = new FormData();
      formData.set("id", request.id);
      formData.set("field", field);
      formData.set("value", value === NONE ? "" : value);

      startTransition(async () => {
        const result = await patchRequestAction(idleState, formData);
        if (result.status === "error") {
          revert();
          setFieldState((prev) => ({ ...prev, [field]: "idle" }));
          toast.error(result.message ?? "Could not save that change.");
          return;
        }
        setFieldState((prev) => ({ ...prev, [field]: "saved" }));
        setTimeout(
          () => setFieldState((prev) => ({ ...prev, [field]: "idle" })),
          1500
        );
      });
    },
    [request.id]
  );

  const staffInDepartment = staff.filter(
    (person) => departmentId !== NONE && person.departmentId === departmentId
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="wf-status" className="justify-between">
          <span>Status</span>
          <SavingHint state={fieldState.status ?? "idle"} />
        </Label>
        <Select
          value={status}
          onValueChange={(value) => {
            const previous = status;
            setStatus(value as typeof status);
            patch("status", value, () => setStatus(previous));
          }}
        >
          <SelectTrigger id="wf-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REQUEST_STATUSES.map((entry) => (
              <SelectItem key={entry} value={entry}>
                {entry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">{STATUS_FLOW_HINT[status]}</p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="wf-priority" className="justify-between">
          <span>Priority</span>
          <SavingHint state={fieldState.priority ?? "idle"} />
        </Label>
        <Select
          value={priority}
          onValueChange={(value) => {
            const previous = priority;
            setPriority(value as typeof priority);
            patch("priority", value, () => setPriority(previous));
          }}
        >
          <SelectTrigger id="wf-priority" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((entry) => (
              <SelectItem key={entry} value={entry}>
                {entry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="wf-department" className="justify-between">
          <span>Department</span>
          <SavingHint state={fieldState.departmentId ?? "idle"} />
        </Label>
        <Select
          value={departmentId}
          disabled={!canAssign}
          onValueChange={(value) => {
            const previous = departmentId;
            setDepartmentId(value);
            setAssignedStaffId(NONE);
            patch("departmentId", value, () => setDepartmentId(previous));
          }}
        >
          <SelectTrigger id="wf-department" className="w-full">
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
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="wf-staff" className="justify-between">
          <span>Assigned employee</span>
          <SavingHint state={fieldState.assignedStaffId ?? "idle"} />
        </Label>
        <Select
          value={assignedStaffId}
          disabled={!canAssign || departmentId === NONE}
          onValueChange={(value) => {
            const previous = assignedStaffId;
            setAssignedStaffId(value);
            patch("assignedStaffId", value, () => setAssignedStaffId(previous));
          }}
        >
          <SelectTrigger id="wf-staff" className="w-full">
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
        {departmentId === NONE && (
          <p className="text-muted-foreground text-xs">
            Assign a department before choosing an employee.
          </p>
        )}
        {departmentId !== NONE && staffInDepartment.length === 0 && (
          <p className="text-muted-foreground text-xs">
            No active staff in this department yet.
          </p>
        )}
      </div>
    </div>
  );
}
