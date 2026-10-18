import * as React from "react";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { StaffFormDialog } from "./staff-form-dialog";
import { ConfirmAction } from "@/components/form/confirm-action";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteStaffAction } from "@/lib/actions/staff";
import type { Department, StaffWithStats } from "@/lib/types";

export function StaffActions({
  staff,
  departments,
}: {
  staff: StaffWithStats;
  departments: Department[];
}) {
  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${staff.name}`}>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <ConfirmAction
            trigger={
              <DropdownMenuItem variant="destructive" onSelect={(event) => event.preventDefault()}>
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            }
            title={`Remove ${staff.name}?`}
            description="Their closed requests stay in the archive with the assignment recorded in the activity history. Staff with open requests must be reassigned first."
            confirmLabel="Remove"
            action={deleteStaffAction}
            hiddenFields={{ id: staff.id }}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <StaffFormDialog
        staff={staff}
        departments={departments}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
