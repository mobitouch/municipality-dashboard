import * as React from "react";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { CategoryFormDialog } from "./category-form-dialog";
import { ConfirmAction } from "@/components/form/confirm-action";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCategoryAction } from "@/lib/actions/categories";
import type { Category, Department } from "@/lib/types";

export function CategoryActions({
  category,
  departments,
}: {
  category: Category;
  departments: Department[];
}) {
  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${category.name}`}>
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
            title={`Delete ${category.name}?`}
            description="Categories in use by existing requests cannot be deleted — deactivate them instead so the history stays readable."
            action={deleteCategoryAction}
            hiddenFields={{ id: category.id }}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <CategoryFormDialog
        category={category}
        departments={departments}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
