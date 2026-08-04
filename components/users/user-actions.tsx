"use client";

import * as React from "react";
import { KeyRoundIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { UserFormDialog } from "./user-form-dialog";
import { ConfirmAction } from "@/components/form/confirm-action";
import { Field } from "@/components/form/field";
import { FormDialog } from "@/components/form/form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { deleteUserAction, resetUserPasswordAction } from "@/lib/actions/users";
import type { AppUser, Department } from "@/lib/types";

export function UserActions({
  user,
  departments,
  isSelf,
}: {
  user: AppUser;
  departments: Department[];
  isSelf: boolean;
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.name}`}>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilIcon />
            Edit account
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setResetOpen(true)}>
            <KeyRoundIcon />
            Reset password
          </DropdownMenuItem>

          {!isSelf && (
            <>
              <DropdownMenuSeparator />
              <ConfirmAction
                trigger={
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(event) => event.preventDefault()}
                  >
                    <Trash2Icon />
                    Delete account
                  </DropdownMenuItem>
                }
                title={`Delete ${user.name}'s account?`}
                description="They lose access immediately. Requests they worked on keep their name in the activity history. Deactivating instead preserves the ability to restore access later."
                confirmLabel="Delete account"
                action={deleteUserAction}
                hiddenFields={{ id: user.id }}
              />
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <UserFormDialog
        user={user}
        departments={departments}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <FormDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={`Reset password for ${user.name}`}
        description="They will be signed out everywhere and asked to choose a new password at their next sign-in."
        action={resetUserPasswordAction}
        submitLabel="Reset password"
      >
        {({ fieldErrors }) => (
          <>
            <input type="hidden" name="id" value={user.id} />
            <Field
              label="New temporary password"
              htmlFor={`reset-password-${user.id}`}
              required
              errors={fieldErrors.password}
              hint="At least 10 characters."
            >
              <Input
                id={`reset-password-${user.id}`}
                name="password"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
              />
            </Field>
            <Field
              label="Confirm password"
              htmlFor={`reset-confirm-${user.id}`}
              required
              errors={fieldErrors.confirmPassword}
            >
              <Input
                id={`reset-confirm-${user.id}`}
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
              />
            </Field>
          </>
        )}
      </FormDialog>
    </>
  );
}
