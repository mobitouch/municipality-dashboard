"use client";

import * as React from "react";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { DepartmentFormDialog } from "./department-form-dialog";
import { ConfirmAction } from "@/components/form/confirm-action";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteDepartmentAction } from "@/lib/actions/departments";
import type { DepartmentWithStats } from "@/lib/types";

export function DepartmentActions({ department }: { department: DepartmentWithStats }) {
  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${department.name}`}>
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
              <DropdownMenuItem
                variant="destructive"
                onSelect={(event) => event.preventDefault()}
              >
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            }
            title={`Delete ${department.name}?`}
            description="Departments can only be deleted once no staff, requests, or user accounts point at them. Deactivating keeps the history and hides it from assignment menus."
            action={deleteDepartmentAction}
            hiddenFields={{ id: department.id }}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <DepartmentFormDialog
        department={department}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
