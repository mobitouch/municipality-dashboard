"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { fakeVerify, verifyPassword } from "@/lib/auth/password";
import {
  clearLoginFailures,
  createSession,
  destroyAllSessionsForUser,
  destroySession,
  ipIdentifier,
  loginAttemptsExceeded,
  recordLoginFailure,
} from "@/lib/auth/session";
import {
  clearSessionCookie,
  getSessionToken,
  requireActionUser,
  setSessionCookie,
} from "@/lib/auth/dal";
import { getClientIp } from "@/lib/auth/client-ip";
import { recordAudit } from "@/lib/data/audit";
import {
  emailTaken,
  getPasswordHash,
  getUserCredentials,
  recordLogin,
  setUserPassword,
  updateUser,
  getUser,
} from "@/lib/data/users";
import { changePasswordSchema, loginSchema, profileSchema } from "@/lib/validation";
import {
  errorState,
  formToObject,
  runAction,
  successState,
  validationError,
  type ActionState,
} from "./helpers";

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const parsed = loginSchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    const { email, password } = parsed.data;

    // Two throttles: one on the account being targeted, one on the source
    // address. The per-account counter alone allows password spraying — a
    // single guess against each of a hundred addresses trips nothing.
    const ipKey = ipIdentifier(await getClientIp());
    if (loginAttemptsExceeded(email) || loginAttemptsExceeded(ipKey)) {
      return errorState("Too many failed attempts. Try again in 15 minutes.");
    }

    const recordFailure = () => {
      recordLoginFailure(email);
      recordLoginFailure(ipKey);
    };

    const credentials = getUserCredentials(email);

    // Unknown accounts still pay the hashing cost, so response timing does
    // not reveal which addresses exist.
    if (!credentials) {
      await fakeVerify();
      recordFailure();
      return errorState("Incorrect email or password.");
    }

    const valid = await verifyPassword(password, credentials.passwordHash);
    if (!valid) {
      recordFailure();
      return errorState("Incorrect email or password.");
    }

    if (!credentials.isActive) {
      return errorState("This account has been deactivated. Contact an administrator.");
    }

    clearLoginFailures(email);
    clearLoginFailures(ipKey);
    recordLogin(credentials.id);

    const userAgent = (await headers()).get("user-agent") ?? "";
    const { token, expiresAt } = createSession(credentials.id, userAgent);
    await setSessionCookie(token, expiresAt);

    recordAudit({
      actorId: credentials.id,
      actorName: email,
      action: "signed in",
      entityType: "session",
      entityId: credentials.id,
    });

    redirect("/overview");
  });
}

export async function logoutAction(): Promise<void> {
  const token = await getSessionToken();
  destroySession(token);
  await clearSessionCookie();
  redirect("/login");
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireActionUser();
    const parsed = changePasswordSchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    const currentHash = getPasswordHash(user.id);
    if (!currentHash || !(await verifyPassword(parsed.data.currentPassword, currentHash))) {
      return errorState("Your current password is incorrect.", {
        currentPassword: ["That is not your current password."],
      });
    }

    await setUserPassword(user.id, parsed.data.password, { mustChange: false });

    // Every other session for this account is dropped — a password change
    // is the standard way to evict someone who should no longer be signed in.
    const token = await getSessionToken();
    destroyAllSessionsForUser(user.id);
    if (token) {
      const { token: fresh, expiresAt } = createSession(user.id, "");
      await setSessionCookie(fresh, expiresAt);
    }

    recordAudit({
      actorId: user.id,
      actorName: user.name,
      action: "changed their password",
      entityType: "user",
      entityId: user.id,
    });

    revalidatePath("/settings");
    return successState("Password updated. Other sessions have been signed out.");
  });
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return runAction(async () => {
    const user = await requireActionUser();
    const parsed = profileSchema.safeParse(formToObject(formData));
    if (!parsed.success) return validationError(parsed.error);

    if (emailTaken(parsed.data.email, user.id)) {
      return errorState("That email address is already in use.", {
        email: ["Already used by another account."],
      });
    }

    const existing = getUser(user.id);
    if (!existing) return errorState("Your account no longer exists.");

    updateUser(user.id, {
      name: parsed.data.name,
      email: parsed.data.email,
      role: existing.role,
      departmentId: existing.departmentId,
      isActive: existing.isActive,
    });

    recordAudit({
      actorId: user.id,
      actorName: parsed.data.name,
      action: "updated their profile",
      entityType: "user",
      entityId: user.id,
    });

    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return successState("Profile updated.");
  });
}
