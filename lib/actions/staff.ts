"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/dal";
import { recordAudit } from "@/lib/data/audit";
import { getDepartment } from "@/lib/data/departments";
import {
  createStaff,
  deleteStaff,
  getStaff,
  staffAssignmentCount,
  staffEmailTaken,
  updateStaff,
} from "@/lib/data/staff";
import { staffSchema } from "@/lib/validation";
import {
  errorState,
  formToObject,
  runAction,
  successState,
  validationError,
  type ActionState,
} from "./helpers";

function revalidateStaff() {
  revalidatePath("/staff");
  revalidatePath("/departments");
  revalidatePath("/requests");
  revalidatePath("/complaints");
}

export async function createStaffAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = await requirePermission("staff:manage");
    const parsed = staffSchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    if (!getDepartment(parsed.data.departmentId)) {
      return errorState("Choose a valid department.", { departmentId: ["Unknown department."] });
    }
    if (staffEmailTaken(parsed.data.email)) {
      return errorState("That email address is already assigned to another staff member.", {
        email: ["Already in use."],
      });
    }

    const staff = createStaff(parsed.data);
    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "added staff member",
      entityType: "staff",
      entityId: staff.id,
      detail: `${staff.name} — ${staff.departmentName}`,
    });

    revalidateStaff();
    return successState(`${staff.name} added to ${staff.departmentName}.`);
  });
}

export async function updateStaffAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = await requirePermission("staff:manage");
    const id = String(formData.get("id") ?? "");
    if (!id) return errorState("Missing staff id.");

    const parsed = staffSchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    if (!getDepartment(parsed.data.departmentId)) {
      return errorState("Choose a valid department.", { departmentId: ["Unknown department."] });
    }
    if (staffEmailTaken(parsed.data.email, id)) {
      return errorState("That email address is already assigned to another staff member.", {
        email: ["Already in use."],
      });
    }

    const staff = updateStaff(id, parsed.data);
    if (!staff) return errorState("That staff member no longer exists.");

    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "updated staff member",
      entityType: "staff",
      entityId: id,
      detail: staff.name,
    });

    revalidateStaff();
    return successState(`${staff.name} updated.`);
  });
}

export async function deleteStaffAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = await requirePermission("staff:manage");
    const id = String(formData.get("id") ?? "");
    const staff = getStaff(id);
    if (!staff) return errorState("That staff member no longer exists.");

    const assignments = staffAssignmentCount(id);
    if (assignments.active > 0) {
      return errorState(
        `${staff.name} still has ${assignments.active} open request(s). Reassign them first, or mark the record inactive instead.`
      );
    }

    deleteStaff(id);
    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "deleted staff member",
      entityType: "staff",
      entityId: id,
      detail: staff.name,
    });

    revalidateStaff();
    return successState(
      assignments.total > 0
        ? `${staff.name} removed. Their ${assignments.total} closed request(s) remain in the archive.`
        : `${staff.name} removed.`
    );
  });
}
