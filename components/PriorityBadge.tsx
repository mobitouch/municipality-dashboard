import { PRIORITY_COLORS } from "@/lib/constants";

export default function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        PRIORITY_COLORS[priority] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"
      }`}
    >
      {priority}
    </span>
  );
}
