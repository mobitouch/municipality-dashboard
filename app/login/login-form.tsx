"use client";

import { useActionState } from "react";
import { LogInIcon } from "lucide-react";

import { Field, FormMessage } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/lib/actions/auth";
import { idleState } from "@/lib/actions/types";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, idleState);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage status={state.status} message={state.message} />

      <Field label="Email" htmlFor="email" errors={fieldErrors.email} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          required
          placeholder="you@municipality.gov"
        />
      </Field>

      <Field label="Password" htmlFor="password" errors={fieldErrors.password} required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <SubmitButton className="mt-1 w-full" pendingLabel="Signing in…">
        <LogInIcon />
        Sign in
      </SubmitButton>
    </form>
  );
}
