"use client";

import * as React from "react";
import { useActionState } from "react";
import { BanIcon, CheckIcon, CopyIcon, KeyRoundIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { ConfirmAction } from "@/components/form/confirm-action";
import { Field, FormMessage } from "@/components/form/field";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createApiKeyAction,
  deleteApiKeyAction,
  revokeApiKeyAction,
} from "@/lib/actions/settings";
import { idleState } from "@/lib/actions/types";
import { formatDate, formatRelative } from "@/lib/format";
import type { ApiKey } from "@/lib/types";

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);

  return (
    <div className="flex items-center gap-2">
      <code className="bg-muted min-w-0 flex-1 overflow-x-auto rounded-md px-3 py-2 font-mono text-xs">
        {value}
      </code>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Copy key"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            toast.error("Could not copy — select the text and copy manually.");
          }
        }}
      >
        {copied ? <CheckIcon className="text-success" /> : <CopyIcon />}
      </Button>
    </div>
  );
}

export function ApiKeysPanel({ apiKeys }: { apiKeys: ApiKey[] }) {
  const [state, formAction] = useActionState(createApiKeyAction, idleState);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [issuedKey, setIssuedKey] = React.useState<string | null>(null);
  const lastHandled = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (state.status !== "success" || state.ranAt === lastHandled.current) return;
    lastHandled.current = state.ranAt;
    /* eslint-disable react-hooks/set-state-in-effect --
       reacting to a completed server action is exactly what an effect is
       for; which of these two calls the rule treats as "the cascading
       one" isn't stable across edits, so both are disabled together. */
    setCreateOpen(false);
    // The plaintext exists only in this response — surface it before it's gone.
    if (state.payload?.key) setIssuedKey(state.payload.key);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [state]);

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          External callers — the municipal website&apos;s forms and the n8n chatbot workflow —
          authenticate with an <code className="font-mono text-xs">x-api-key</code> header. Keys
          are stored hashed and shown in full only once, at creation.
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          New key
        </Button>
      </div>

      {apiKeys.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">
          No API keys yet. Website and chatbot submissions will be rejected until one exists.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {apiKeys.map((key) => (
            <li key={key.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <KeyRoundIcon className="text-muted-foreground size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {key.label}
                  {key.revokedAt && (
                    <span className="text-destructive ml-2 text-xs font-normal">Revoked</span>
                  )}
                </p>
                <p className="text-muted-foreground font-mono text-xs">{key.keyPreview}</p>
              </div>
              <div className="text-muted-foreground hidden text-xs sm:block">
                <p>Created {formatDate(key.createdAt)}</p>
                <p>
                  {key.lastUsedAt ? `Last used ${formatRelative(key.lastUsedAt)}` : "Never used"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!key.revokedAt && (
                  <ConfirmAction
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label={`Revoke ${key.label}`}>
                        <BanIcon />
                      </Button>
                    }
                    title={`Revoke “${key.label}”?`}
                    description="Any integration still sending this key starts receiving 401 responses immediately. This cannot be undone — issue a new key instead."
                    confirmLabel="Revoke key"
                    action={revokeApiKeyAction}
                    hiddenFields={{ id: key.id }}
                  />
                )}
                <ConfirmAction
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      aria-label={`Delete ${key.label}`}
                    >
                      <Trash2Icon />
                    </Button>
                  }
                  title={`Delete “${key.label}”?`}
                  description="Removes the key record entirely, including when it was last used."
                  action={deleteApiKeyAction}
                  hiddenFields={{ id: key.id }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create an API key</DialogTitle>
            <DialogDescription>
              Give the key a name that identifies the caller, so it can be revoked precisely later.
            </DialogDescription>
          </DialogHeader>
          <form action={formAction} className="grid gap-4">
            {state.status === "error" && (
              <FormMessage status={state.status} message={state.message} />
            )}
            <Field
              label="Label"
              htmlFor="key-label"
              required
              errors={state.fieldErrors?.label}
            >
              <Input
                id="key-label"
                name="label"
                placeholder="Municipal website — contact form"
                required
                autoComplete="off"
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <SubmitButton pendingLabel="Creating…">Create key</SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={issuedKey !== null} onOpenChange={() => setIssuedKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy your API key now</DialogTitle>
            <DialogDescription>
              This is the only time the key is shown. Only its hash is stored, so it cannot be
              recovered — if it is lost, revoke it and issue a new one.
            </DialogDescription>
          </DialogHeader>
          {issuedKey && <CopyField value={issuedKey} />}
          <DialogFooter>
            <Button onClick={() => setIssuedKey(null)}>I&apos;ve saved it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
