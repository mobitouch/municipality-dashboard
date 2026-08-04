"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/dal";
import { recordAudit } from "@/lib/data/audit";
import { getCategory } from "@/lib/data/categories";
import {
  addInternalNote,
  createRequest,
  deleteRequest,
  getRequest,
  updateRequest,
} from "@/lib/data/requests";
import { PRIORITIES, REQUEST_STATUSES, type Priority, type RequestStatus } from "@/lib/types";
import { createRequestSchema, noteSchema, updateRequestSchema } from "@/lib/validation";
import {
  errorState,
  formToObject,
  runAction,
  successState,
  validationError,
  type ActionState,
} from "./helpers";

function revalidateRequest(id?: string) {
  revalidatePath("/requests");
  revalidatePath("/complaints");
  revalidatePath("/overview");
  revalidatePath("/reports");
  revalidatePath("/notifications");
  if (id) {
    revalidatePath(`/requests/${id}`);
    revalidatePath(`/complaints/${id}`);
  }
}

export async function createRequestAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = await requirePermission("requests:create");
    const parsed = createRequestSchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    const category = getCategory(parsed.data.categoryId);
    if (!category) {
      return errorState("Choose a valid category.", { categoryId: ["Unknown category."] });
    }

    const request = createRequest(
      {
        ...parsed.data,
        kind: parsed.data.kind ?? category.kind,
        // An explicit blank department means "use the category default".
        departmentId:
          formData.get("departmentId") === null ? undefined : parsed.data.departmentId,
      },
      user.name
    );

    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "logged a request",
      entityType: "request",
      entityId: request.id,
      detail: `${request.referenceNumber} — ${request.category}`,
    });

    revalidateRequest(request.id);
    return successState(`${request.referenceNumber} logged.`, {
      id: request.id,
      referenceNumber: request.referenceNumber,
      kind: request.kind,
    });
  });
}

export async function updateRequestAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = await requirePermission("requests:update");
    const id = String(formData.get("id") ?? "");
    if (!getRequest(id)) return errorState("That request no longer exists.");

    const parsed = updateRequestSchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    const updated = updateRequest(id, parsed.data, user.name);
    if (!updated) return errorState("That request no longer exists.");

    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "edited a request",
      entityType: "request",
      entityId: id,
      detail: updated.referenceNumber,
    });

    revalidateRequest(id);
    return successState(`${updated.referenceNumber} updated.`);
  });
}

/**
 * Backs the single-field controls on the request detail screen (status,
 * priority, department, assignee). Kept separate from the full edit form so
 * a status change is one round trip with no re-validation of every field.
 */
export async function patchRequestAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = await requirePermission("requests:update");
    const id = String(formData.get("id") ?? "");
    const field = String(formData.get("field") ?? "");
    const raw = formData.get("value");
    const value = raw === null ? "" : String(raw);

    const current = getRequest(id);
    if (!current) return errorState("That request no longer exists.");

    const patch: Parameters<typeof updateRequest>[1] = {};

    switch (field) {
      case "status":
        if (!REQUEST_STATUSES.includes(value as RequestStatus)) {
          return errorState("Unknown status.");
        }
        patch.status = value as RequestStatus;
        break;
      case "priority":
        if (!PRIORITIES.includes(value as Priority)) return errorState("Unknown priority.");
        patch.priority = value as Priority;
        break;
      case "departmentId":
        patch.departmentId = value || null;
        // The previous assignee belongs to the old department, so the
        // assignment is cleared rather than left dangling.
        if (value !== current.departmentId) patch.assignedStaffId = null;
        break;
      case "assignedStaffId":
        patch.assignedStaffId = value || null;
        break;
      default:
        return errorState("That field cannot be updated here.");
    }

    const updated = updateRequest(id, patch, user.name);
    if (!updated) return errorState("That request no longer exists.");

    revalidateRequest(id);
    return successState("Saved.");
  });
}

export async function addNoteAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = await requirePermission("requests:update");
    const id = String(formData.get("id") ?? "");
    const parsed = noteSchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    const updated = addInternalNote(id, parsed.data.note, user.name);
    if (!updated) return errorState("That request no longer exists.");

    revalidateRequest(id);
    return successState("Note added.");
  });
}

export async function deleteRequestAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requirePermission("requests:delete");
  const id = String(formData.get("id") ?? "");
  const request = getRequest(id);
  if (!request) return errorState("That request no longer exists.");

  deleteRequest(id);
  recordAudit({
    actorId: user.id,
    actorName: user.name,
    action: "deleted a request",
    entityType: "request",
    entityId: id,
    detail: `${request.referenceNumber} — ${request.citizenName}`,
  });

  revalidateRequest(id);
  redirect(request.kind === "complaint" ? "/complaints" : "/requests");
}
