import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";

import { Field, FormMessage } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateSettingsAction } from "@/lib/actions/settings";
import { idleState } from "@/lib/actions/types";
import { PRIORITIES } from "@/lib/types";
import type { AppSettings } from "@/lib/data/settings";

const TOGGLES = [
  {
    name: "notifyCitizenOnCreate",
    label: "Confirm receipt to the citizen",
    hint: "Sends a confirmation the moment a request is logged.",
  },
  {
    name: "notifyCitizenOnStatusChange",
    label: "Notify the citizen on status changes",
    hint: "Keeps them informed as the request progresses.",
  },
  {
    name: "notifyStaffOnUrgent",
    label: "Alert staff about urgent submissions",
    hint: "Flags urgent items to the receiving department.",
  },
] as const;

export function SystemSettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction] = useActionState(updateSettingsAction, idleState);
  const fieldErrors = state.fieldErrors ?? {};
  const lastHandled = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (state.status !== "success" || state.ranAt === lastHandled.current) return;
    lastHandled.current = state.ranAt;
    if (state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      {state.status === "error" && <FormMessage status={state.status} message={state.message} />}

      <Field
        label="Organisation name"
        htmlFor="organisationName"
        required
        errors={fieldErrors.organisationName}
        hint="Shown in the sidebar, on the sign-in screen, and in citizen notifications."
      >
        <Input
          id="organisationName"
          name="organisationName"
          defaultValue={settings.organisationName}
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Default priority"
          htmlFor="defaultRequestPriority"
          errors={fieldErrors.defaultRequestPriority}
        >
          <Select name="defaultRequestPriority" defaultValue={settings.defaultRequestPriority}>
            <SelectTrigger id="defaultRequestPriority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Live refresh interval"
          htmlFor="autoRefreshSeconds"
          errors={fieldErrors.autoRefreshSeconds}
          hint="Seconds between background refreshes. 0 turns it off."
        >
          <Input
            id="autoRefreshSeconds"
            name="autoRefreshSeconds"
            type="number"
            min={0}
            max={300}
            defaultValue={settings.autoRefreshSeconds}
          />
        </Field>
      </div>

      <div className="grid gap-2.5">
        {TOGGLES.map((toggle) => (
          <div key={toggle.name} className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="grid gap-0.5">
              <Label htmlFor={toggle.name}>{toggle.label}</Label>
              <p className="text-muted-foreground text-xs">{toggle.hint}</p>
            </div>
            <Switch
              id={toggle.name}
              name={toggle.name}
              defaultChecked={settings[toggle.name]}
              className="mt-0.5"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <SubmitButton size="sm" pendingLabel="Saving…">
          Save settings
        </SubmitButton>
      </div>
    </form>
  );
}
