import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  icon: Icon,
  accent = "text-primary bg-primary/10",
  hint,
  href,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", accent)}>
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {hint && <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>}
    </>
  );

  const className = cn(
    "bg-card rounded-xl border p-4 transition-[color,box-shadow,border-color,transform] duration-200",
    href && "hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md block"
  );

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
