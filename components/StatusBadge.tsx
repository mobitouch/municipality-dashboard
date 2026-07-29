import { STATUS_COLORS } from "@/lib/constants";

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700 ring-slate-600/20"
      }`}
    >
      {status}
    </span>
  );
}
