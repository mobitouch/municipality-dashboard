"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { idleState, type ActionState } from "@/lib/actions/types";

export interface FormDialogRenderProps {
  fieldErrors: Record<string, string[]>;
}

/**
 * A dialog whose body is a form bound to a server action. It closes itself
 * on success and surfaces the result as a toast; on failure it stays open
 * with the server's per-field messages attached, so nothing typed is lost.
 */
export function FormDialog({
  trigger,
  title,
  description,
  action,
  submitLabel = "Save",
  pendingLabel = "Saving…",
  children,
  onSuccess,
  contentClassName,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel?: string;
  pendingLabel?: string;
  children: React.ReactNode | ((props: FormDialogRenderProps) => React.ReactNode);
  onSuccess?: (state: ActionState) => void;
  contentClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen;

  const [state, formAction] = useActionState(action, idleState);
  const lastHandled = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (state.status !== "success" || state.ranAt === lastHandled.current) return;
    lastHandled.current = state.ranAt;
    setOpen(false);
    if (state.message) toast.success(state.message);
    onSuccess?.(state);
  }, [state, setOpen, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form action={formAction} className="grid gap-4">
          {state.status === "error" && (
            <FormMessage status={state.status} message={state.message} />
          )}

          {typeof children === "function"
            ? children({ fieldErrors: state.fieldErrors ?? {} })
            : children}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
