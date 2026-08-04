"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { idleState, type ActionState } from "@/lib/actions/types";

/**
 * Confirmation gate for destructive actions. The server's refusal messages
 * ("still has 3 open requests") are shown inside the dialog rather than as
 * a toast, because they explain what the operator has to do first.
 */
export function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel = "Delete",
  action,
  hiddenFields,
}: {
  trigger: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  hiddenFields: Record<string, string>;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(action, idleState);
  const lastHandled = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (state.status !== "success" || state.ranAt === lastHandled.current) return;
    lastHandled.current = state.ranAt;
    setOpen(false);
    if (state.message) toast.success(state.message);
  }, [state]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {state.status === "error" && state.message && (
          <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm" role="alert">
            {state.message}
          </p>
        )}

        <form action={formAction}>
          {Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />}
              {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
