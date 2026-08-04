import { PRIORITY_STYLES, STATUS_STYLES } from "@/lib/constants";
import type { Priority, RequestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const BASE =
  "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset";

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  return (
    <span className={cn(BASE, STATUS_STYLES[status] ?? STATUS_STYLES.Closed, className)}>
      {status}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  return (
    <span className={cn(BASE, PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.Low, className)}>
      {priority}
    </span>
  );
}

export function KindBadge({ kind }: { kind: "request" | "complaint" }) {
  return (
    <span
      className={cn(
        BASE,
        kind === "complaint"
          ? "bg-orange-500/12 text-orange-700 ring-orange-500/25 dark:text-orange-300"
          : "bg-muted text-muted-foreground ring-border"
      )}
    >
      {kind === "complaint" ? "Complaint" : "Request"}
    </span>
  );
}
