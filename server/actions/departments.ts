
import { requirePermission } from "@/lib/auth/dal";
import { recordAudit } from "@/lib/data/audit";
import {
  createDepartment,
  deleteDepartment,
  departmentNameTaken,
  departmentReferences,
  getDepartment,
  updateDepartment,
} from "@/lib/data/departments";
import { departmentSchema } from "@/lib/validation";
import {
  errorState,
  formToObject,
  runAction,
  successState,
  validationError,
  type ActionState,
} from "./helpers";

export async function createDepartmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = requirePermission("departments:manage");
    const parsed = departmentSchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    if (departmentNameTaken(parsed.data.name)) {
      return errorState("A department with that name already exists.", {
        name: ["Already in use."],
      });
    }

    const department = createDepartment(parsed.data);
    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "created department",
      entityType: "department",
      entityId: department.id,
      detail: department.name,
    });

    return successState(`Department “${department.name}” created.`);
  });
}

export async function updateDepartmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = requirePermission("departments:manage");
    const id = String(formData.get("id") ?? "");
    if (!id) return errorState("Missing department id.");

    const parsed = departmentSchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    if (departmentNameTaken(parsed.data.name, id)) {
      return errorState("A department with that name already exists.", {
        name: ["Already in use."],
      });
    }

    const department = updateDepartment(id, parsed.data);
    if (!department) return errorState("That department no longer exists.");

    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "updated department",
      entityType: "department",
      entityId: id,
      detail: department.name,
    });

    return successState(`Department “${department.name}” updated.`);
  });
}

export async function deleteDepartmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = requirePermission("departments:manage");
    const id = String(formData.get("id") ?? "");
    const department = getDepartment(id);
    if (!department) return errorState("That department no longer exists.");

    // Staff rows block the delete at the database level; requests and users
    // would be silently detached. Both are worth stopping on explicitly so
    // the operator can reassign first.
    const references = departmentReferences(id);
    if (references.staff > 0 || references.requests > 0 || references.users > 0) {
      const parts = [
        references.staff ? `${references.staff} staff member(s)` : null,
        references.requests ? `${references.requests} request(s)` : null,
        references.users ? `${references.users} user account(s)` : null,
      ].filter(Boolean);
      return errorState(
        `“${department.name}” still has ${parts.join(", ")} attached. Reassign them first, or deactivate the department instead.`
      );
    }

    deleteDepartment(id);
    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "deleted department",
      entityType: "department",
      entityId: id,
      detail: department.name,
    });

    return successState(`Department “${department.name}” deleted.`);
  });
}
