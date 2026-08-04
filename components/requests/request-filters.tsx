"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIORITIES, REQUEST_STATUSES } from "@/lib/types";
import type { Category, Department, Staff } from "@/lib/types";

/** Radix Select forbids an empty item value, so "all" stands in for "no filter". */
const ALL = "all";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "priority", label: "Priority" },
  { value: "updated", label: "Recently updated" },
  { value: "status", label: "Status" },
] as const;

export function RequestFilters({
  departments,
  categories,
  staff,
}: {
  departments: Department[];
  categories: Category[];
  staff: Staff[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();
  const urlQ = searchParams.get("q") ?? "";
  const [search, setSearch] = React.useState(urlQ);

  // Keeps the box in sync when `q` changes from elsewhere (Clear, back
  // button). The lint rule wants this expressed without setState-in-effect,
  // but its own suggested alternative (compare against a ref during render)
  // is itself disallowed by a *different* rule in this same config
  // (react-hooks/refs) — there's no version of "mirror an external value
  // into state" left that satisfies both. This is the standard, correct
  // pattern; the disable is intentional, not an oversight.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setSearch(urlQ), [urlQ]);

  const current = React.useCallback(
    (key: string) => searchParams.get(key) ?? "",
    [searchParams]
  );

  const applyParams = React.useCallback(
    (changes: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      // Any filter change invalidates the current page number.
      params.delete("page");
      const query = params.toString();
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname));
    },
    [pathname, router, searchParams]
  );

  React.useEffect(() => {
    if (search === urlQ) return;
    const handle = setTimeout(() => applyParams({ q: search }), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the debounce timer depends on urlQ/applyParams changing mid-flight; re-keying it on every keystroke would defeat the debounce.
  }, [search]);

  const setParam = (key: string) => (value: string) =>
    applyParams({ [key]: value === ALL ? "" : value });

  const activeCount = ["status", "departmentId", "categoryId", "priority", "assignedStaffId", "dateFrom", "dateTo", "q"].filter(
    (key) => current(key)
  ).length;

  return (
    <div className="bg-card mb-4 rounded-xl border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, reference, location…"
            className="h-9 pl-8"
            aria-label="Search requests"
          />
          {isPending && (
            <Loader2Icon className="text-muted-foreground absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin" />
          )}
        </div>

        <Select value={current("status") || ALL} onValueChange={setParam("status")}>
          <SelectTrigger className="h-9 w-[9.5rem]" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {REQUEST_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={current("priority") || ALL} onValueChange={setParam("priority")}>
          <SelectTrigger className="h-9 w-[9rem]" aria-label="Filter by priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All priorities</SelectItem>
            {PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={current("departmentId") || ALL} onValueChange={setParam("departmentId")}>
          <SelectTrigger className="h-9 w-[11rem]" aria-label="Filter by department">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All departments</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.id}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={current("categoryId") || ALL} onValueChange={setParam("categoryId")}>
          <SelectTrigger className="h-9 w-[11rem]" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={current("assignedStaffId") || ALL}
          onValueChange={setParam("assignedStaffId")}
        >
          <SelectTrigger className="h-9 w-[11rem]" aria-label="Filter by assignee">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Anyone</SelectItem>
            {staff.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={current("dateFrom")}
          onChange={(event) => applyParams({ dateFrom: event.target.value })}
          className="h-9 w-[9.5rem]"
          aria-label="Submitted from"
          title="Submitted from"
        />
        <Input
          type="date"
          value={current("dateTo")}
          onChange={(event) => applyParams({ dateTo: event.target.value })}
          className="h-9 w-[9.5rem]"
          aria-label="Submitted until"
          title="Submitted until"
        />

        <Select value={current("sort") || "newest"} onValueChange={setParam("sort")}>
          <SelectTrigger className="h-9 w-[10.5rem]" aria-label="Sort order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              startTransition(() => router.replace(pathname));
            }}
          >
            <XIcon />
            Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
          </Button>
        )}
      </div>
    </div>
  );
}
