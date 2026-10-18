
import { requirePermission } from "@/lib/auth/dal";
import { recordAudit } from "@/lib/data/audit";
import {
  categoryNameTaken,
  categoryRequestCount,
  createCategory,
  deleteCategory,
  getCategory,
  updateCategory,
} from "@/lib/data/categories";
import { categorySchema } from "@/lib/validation";
import {
  errorState,
  formToObject,
  runAction,
  successState,
  validationError,
  type ActionState,
} from "./helpers";

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = requirePermission("categories:manage");
    const parsed = categorySchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    if (categoryNameTaken(parsed.data.name)) {
      return errorState("A category with that name already exists.", { name: ["Already in use."] });
    }

    const category = createCategory(parsed.data);
    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "created category",
      entityType: "category",
      entityId: category.id,
      detail: category.name,
    });

    return successState(`Category “${category.name}” created.`);
  });
}

export async function updateCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = requirePermission("categories:manage");
    const id = String(formData.get("id") ?? "");
    if (!id) return errorState("Missing category id.");

    const parsed = categorySchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    if (categoryNameTaken(parsed.data.name, id)) {
      return errorState("A category with that name already exists.", { name: ["Already in use."] });
    }

    const category = updateCategory(id, parsed.data);
    if (!category) return errorState("That category no longer exists.");

    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "updated category",
      entityType: "category",
      entityId: id,
      detail: category.name,
    });

    return successState(`Category “${category.name}” updated.`);
  });
}

export async function deleteCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = requirePermission("categories:manage");
    const id = String(formData.get("id") ?? "");
    const category = getCategory(id);
    if (!category) return errorState("That category no longer exists.");

    const inUse = categoryRequestCount(id);
    if (inUse > 0) {
      return errorState(
        `“${category.name}” is used by ${inUse} request(s). Deactivate it instead — it will disappear from the intake form while its history stays intact.`
      );
    }

    deleteCategory(id);
    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "deleted category",
      entityType: "category",
      entityId: id,
      detail: category.name,
    });

    return successState(`Category “${category.name}” deleted.`);
  });
}
