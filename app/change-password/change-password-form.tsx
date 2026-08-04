"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { Field, FormMessage } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { Input } from "@/components/ui/input";
import { changePasswordAction } from "@/lib/actions/auth";
import { idleState } from "@/lib/actions/types";

export function ChangePasswordForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(changePasswordAction, idleState);
  const fieldErrors = state.fieldErrors ?? {};
  const lastHandled = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (state.status !== "success" || state.ranAt === lastHandled.current) return;
    lastHandled.current = state.ranAt;
    router.push("/overview");
    router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage status={state.status} message={state.message} />

      <Field
        label="Temporary password"
        htmlFor="currentPassword"
        errors={fieldErrors.currentPassword}
        required
      >
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
        />
      </Field>

      <Field
        label="New password"
        htmlFor="password"
        errors={fieldErrors.password}
        required
        hint="At least 10 characters."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
        />
      </Field>

      <Field
        label="Confirm new password"
        htmlFor="confirmPassword"
        errors={fieldErrors.confirmPassword}
        required
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      <SubmitButton className="mt-1 w-full" pendingLabel="Updating…">
        Set new password
      </SubmitButton>
    </form>
  );
}
