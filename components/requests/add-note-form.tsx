"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";

import { SubmitButton } from "@/components/form/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { addNoteAction } from "@/lib/actions/requests";
import { idleState } from "@/lib/actions/types";

export function AddNoteForm({ requestId }: { requestId: string }) {
  const [state, formAction] = useActionState(addNoteAction, idleState);
  const formRef = React.useRef<HTMLFormElement>(null);
  const lastHandled = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (state.status !== "success" || state.ranAt === lastHandled.current) return;
    lastHandled.current = state.ranAt;
    formRef.current?.reset();
    toast.success(state.message ?? "Note added.");
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-2">
      <input type="hidden" name="id" value={requestId} />
      <Textarea
        name="note"
        rows={3}
        required
        minLength={2}
        placeholder="Visible to municipal staff only…"
        aria-label="Internal note"
        aria-invalid={Boolean(state.fieldErrors?.note)}
      />
      {state.status === "error" && (
        <p className="text-destructive text-xs" role="alert">
          {state.fieldErrors?.note?.[0] ?? state.message}
        </p>
      )}
      <div className="flex justify-end">
        <SubmitButton size="sm" pendingLabel="Adding…">
          Add note
        </SubmitButton>
      </div>
    </form>
  );
}
