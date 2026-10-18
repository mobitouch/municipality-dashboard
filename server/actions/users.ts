
import { requirePermission } from "@/lib/auth/dal";
import { destroyAllSessionsForUser } from "@/lib/auth/session";
import { recordAudit } from "@/lib/data/audit";
import {
  activeAdminCount,
  createUser,
  deleteUser,
  emailTaken,
  getUser,
  listUsers,
  setUserPassword,
  updateUser,
} from "@/lib/data/users";
import { ROLE_LABELS } from "@/lib/constants";
import { createUserSchema, resetPasswordSchema, userSchema } from "@/lib/validation";
import {
  errorState,
  formToObject,
  runAction,
  successState,
  validationError,
  type ActionState,
} from "./helpers";

export async function createUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const actor = requirePermission("users:manage");
    const parsed = createUserSchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    if (emailTaken(parsed.data.email)) {
      return errorState("That email address is already registered.", {
        email: ["Already in use."],
      });
    }

    const user = await createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      departmentId: parsed.data.departmentId,
      isActive: parsed.data.isActive,
      password: parsed.data.password,
      mustChangePassword: parsed.data.mustChangePassword,
    });

    recordAudit({
      actorId: actor.id,
      actorName: actor.name,
      action: "created user account",
      entityType: "user",
      entityId: user.id,
      detail: `${user.email} (${ROLE_LABELS[user.role]})`,
    });

    return successState(`Account created for ${user.name}.`);
  });
}

export async function updateUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const actor = requirePermission("users:manage");
    const id = String(formData.get("id") ?? "");
    const existing = getUser(id);
    if (!existing) return errorState("That account no longer exists.");

    const parsed = userSchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    if (emailTaken(parsed.data.email, id)) {
      return errorState("That email address is already registered.", {
        email: ["Already in use."],
      });
    }

    // Guard against the last administrator locking everyone out by
    // demoting or deactivating themselves.
    const losesAdmin =
      existing.role === "admin" && (parsed.data.role !== "admin" || !parsed.data.isActive);
    if (losesAdmin && activeAdminCount(id) === 0) {
      return errorState(
        "This is the only active administrator. Promote another account to administrator first."
      );
    }

    const user = updateUser(id, parsed.data);
    if (!user) return errorState("That account no longer exists.");

    if (existing.role !== user.role) {
      // Role changes take effect immediately rather than at next sign-in.
      destroyAllSessionsForUser(id);
    }

    recordAudit({
      actorId: actor.id,
      actorName: actor.name,
      action: "updated user account",
      entityType: "user",
      entityId: id,
      detail: `${user.email} (${ROLE_LABELS[user.role]})`,
    });

    return successState(`${user.name}'s account updated.`);
  });
}

export async function resetUserPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const actor = requirePermission("users:manage");
    const id = String(formData.get("id") ?? "");
    const user = getUser(id);
    if (!user) return errorState("That account no longer exists.");

    const parsed = resetPasswordSchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    await setUserPassword(id, parsed.data.password, {
      mustChange: true,
      revokeSessions: true,
    });

    recordAudit({
      actorId: actor.id,
      actorName: actor.name,
      action: "reset a password",
      entityType: "user",
      entityId: id,
      detail: user.email,
    });

    return successState(
      `Password reset for ${user.name}. They will be asked to choose a new one at next sign-in.`
    );
  });
}

export async function deleteUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const actor = requirePermission("users:manage");
    const id = String(formData.get("id") ?? "");
    const user = getUser(id);
    if (!user) return errorState("That account no longer exists.");

    if (user.id === actor.id) {
      return errorState("You cannot delete the account you are signed in with.");
    }
    if (user.role === "admin" && activeAdminCount(id) === 0) {
      return errorState("This is the only active administrator and cannot be deleted.");
    }
    if (listUsers().length <= 1) {
      return errorState("The last remaining account cannot be deleted.");
    }

    deleteUser(id);
    recordAudit({
      actorId: actor.id,
      actorName: actor.name,
      action: "deleted user account",
      entityType: "user",
      entityId: id,
      detail: user.email,
    });

    return successState(`${user.name}'s account was deleted.`);
  });
}
