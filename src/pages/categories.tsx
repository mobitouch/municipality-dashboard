import { Link } from "@/components/link";
import { PlusIcon, TagsIcon } from "lucide-react";

import { PageShell } from "@/components/app-shell/page-shell";
import { PageSkeleton } from "@/components/app-shell/page-skeleton";
import { CategoryActions } from "@/components/categories/category-actions";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { EmptyState } from "@/components/empty-state";
import { KindBadge } from "@/components/badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCan } from "@/lib/client/session";
import { useDocumentTitle } from "@/lib/client/use-document-title";
import { usePageData } from "@/lib/client/use-page-data";
import { pluralize } from "@/lib/format";
import type { CategoriesData } from "@/lib/page-data";
import { cn } from "@/lib/utils";

export function CategoriesPage() {
  useDocumentTitle("Categories");
  const canManage = useCan("categories:manage");
  const { data } = usePageData<CategoriesData>("/api/app/pages/categories");

  if (!data) return <PageSkeleton />;

  const { categories, departments } = data;
  const nextSortOrder = categories.length
    ? Math.max(...categories.map((category) => category.sortOrder)) + 1
    : 0;

  return (
    <PageShell
      title="Categories"
      subtitle={`${pluralize(categories.length, "category", "categories")} classifying incoming submissions`}
      actions={
        canManage && (
          <CategoryFormDialog
            departments={departments}
            nextSortOrder={nextSortOrder}
            trigger={
              <Button size="sm">
                <PlusIcon />
                <span className="hidden sm:inline">Add category</span>
              </Button>
            }
          />
        )
      }
    >
      {categories.length === 0 ? (
        <EmptyState
          icon={TagsIcon}
          title="No categories yet"
          description="Categories are what citizens pick when they submit. Each one can route straight to a department."
          action={
            canManage && (
              <CategoryFormDialog
                departments={departments}
                trigger={
                  <Button>
                    <PlusIcon />
                    Add category
                  </Button>
                }
              />
            )
          }
        />
      ) : (
        <div className="bg-card overflow-hidden rounded-xl border">
          <Table className="min-w-[44rem]">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-16">Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-32">Appears under</TableHead>
                <TableHead>Routes to</TableHead>
                <TableHead className="w-28">In use</TableHead>
                {canManage && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id} className={cn(!category.isActive && "opacity-60")}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {category.sortOrder}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{category.name}</span>
                    {!category.isActive && (
                      <Badge variant="secondary" className="ml-2">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <KindBadge kind={category.kind} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.defaultDepartmentName ?? (
                      <span className="text-warning">No default routing</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {category.requestCount > 0 ? (
                      <Link
                        href={`/${category.kind === "complaint" ? "complaints" : "requests"}?categoryId=${category.id}`}
                        className="text-primary text-sm hover:underline"
                      >
                        {pluralize(category.requestCount, "request")}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unused</span>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <CategoryActions category={category} departments={departments} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  );
}
