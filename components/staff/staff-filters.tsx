"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import type { Department } from "@/lib/types";

const ALL = "all";

export function StaffFilters({ departments }: { departments: Department[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();
  const urlQ = searchParams.get("q") ?? "";
  const [search, setSearch] = React.useState(urlQ);

  // See the identical comment in components/requests/request-filters.tsx —
  // this config's rules disallow both a setState-in-effect *and* its
  // suggested ref-during-render alternative, so this is the standard
  // useEffect sync pattern with the conflict called out explicitly.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setSearch(urlQ), [urlQ]);

  const apply = React.useCallback(
    (changes: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const query = params.toString();
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname));
    },
    [pathname, router, searchParams]
  );

  React.useEffect(() => {
    if (search === urlQ) return;
    const handle = setTimeout(() => apply({ q: search }), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see request-filters.tsx: re-keying on urlQ/apply would defeat the debounce.
  }, [search]);

  const departmentId = searchParams.get("departmentId") ?? "";
  const showInactive = searchParams.get("inactive") === "1";
  const hasFilters = Boolean(search || departmentId || showInactive);

  return (
    <div className="bg-card mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-3">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, role, email…"
          className="h-9 pl-8"
          aria-label="Search staff"
        />
        {isPending && (
          <Loader2Icon className="text-muted-foreground absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin" />
        )}
      </div>

      <Select
        value={departmentId || ALL}
        onValueChange={(value) => apply({ departmentId: value === ALL ? "" : value })}
      >
        <SelectTrigger className="h-9 w-[12rem]" aria-label="Filter by department">
          <SelectValue placeholder="All departments" />
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

      <div className="flex items-center gap-2">
        <Switch
          id="show-inactive"
          checked={showInactive}
          onCheckedChange={(checked) => apply({ inactive: checked ? "1" : "" })}
        />
        <Label htmlFor="show-inactive" className="text-muted-foreground text-sm font-normal">
          Show inactive
        </Label>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("");
            startTransition(() => router.replace(pathname));
          }}
        >
          <XIcon />
          Clear
        </Button>
      )}
    </div>
  );
}
