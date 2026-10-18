import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "@/lib/client/navigation";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRESETS = [
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "12 months", days: 365 },
] as const;

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function ReportRange() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = React.useTransition();

  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  const apply = (changes: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname));
  };

  return (
    <div className="bg-card mb-4 flex flex-wrap items-end gap-3 rounded-xl border p-3">
      <div className="grid gap-1.5">
        <Label htmlFor="range-from" className="text-muted-foreground text-xs font-normal">
          From
        </Label>
        <Input
          id="range-from"
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          onChange={(event) => apply({ dateFrom: event.target.value })}
          className="h-9 w-[10rem]"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="range-to" className="text-muted-foreground text-xs font-normal">
          To
        </Label>
        <Input
          id="range-to"
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(event) => apply({ dateTo: event.target.value })}
          className="h-9 w-[10rem]"
        />
      </div>

      <div className="flex items-center gap-1.5">
        {PRESETS.map((preset) => (
          <Button
            key={preset.days}
            variant="outline"
            size="sm"
            onClick={() => apply({ dateFrom: daysAgo(preset.days), dateTo: "" })}
          >
            Last {preset.label}
          </Button>
        ))}
        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => apply({ dateFrom: "", dateTo: "" })}>
            <XIcon />
            All time
          </Button>
        )}
      </div>
    </div>
  );
}
