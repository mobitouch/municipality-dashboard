"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";

import { Field, FormMessage } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { Input } from "@/components/ui/input";
import { changePasswordAction, updateProfileAction } from "@/lib/actions/auth";
import { idleState } from "@/lib/actions/types";

function useToastOnSuccess(state: { status: string; message?: string; ranAt?: number }) {
  const lastHandled = React.useRef<number | undefined>(undefined);
  React.useEffect(() => {
    if (state.status !== "success" || state.ranAt === lastHandled.current) return;
    lastHandled.current = state.ranAt;
    if (state.message) toast.success(state.message);
  }, [state]);
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, formAction] = useActionState(updateProfileAction, idleState);
  const fieldErrors = state.fieldErrors ?? {};
  useToastOnSuccess(state);

  return (
    <form action={formAction} className="grid gap-4">
      {state.status === "error" && <FormMessage status={state.status} message={state.message} />}

      <Field label="Full name" htmlFor="profile-name" required errors={fieldErrors.name}>
        <Input id="profile-name" name="name" defaultValue={name} required autoComplete="name" />
      </Field>

      <Field label="Email" htmlFor="profile-email" required errors={fieldErrors.email}>
        <Input
          id="profile-email"
          name="email"
          type="email"
          defaultValue={email}
          required
          autoComplete="email"
        />
      </Field>

      <div className="flex justify-end">
        <SubmitButton size="sm" pendingLabel="Saving…">
          Save profile
        </SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, idleState);
  const fieldErrors = state.fieldErrors ?? {};
  const formRef = React.useRef<HTMLFormElement>(null);
  const lastHandled = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (state.status !== "success" || state.ranAt === lastHandled.current) return;
    lastHandled.current = state.ranAt;
    formRef.current?.reset();
    if (state.message) toast.success(state.message);
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      {state.status === "error" && <FormMessage status={state.status} message={state.message} />}

      <Field
        label="Current password"
        htmlFor="current-password"
        required
        errors={fieldErrors.currentPassword}
      >
        <Input
          id="current-password"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
        />
      </Field>

      <Field
        label="New password"
        htmlFor="new-password"
        required
        errors={fieldErrors.password}
        hint="At least 10 characters."
      >
        <Input
          id="new-password"
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
        />
      </Field>

      <Field
        label="Confirm new password"
        htmlFor="confirm-password"
        required
        errors={fieldErrors.confirmPassword}
      >
        <Input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
        />
      </Field>

      <div className="flex justify-end">
        <SubmitButton size="sm" pendingLabel="Updating…">
          Change password
        </SubmitButton>
      </div>
    </form>
  );
}
