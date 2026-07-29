import { readDb } from "@/lib/db";
import PageShell from "@/components/PageShell";
import { Mail, MessageSquare, Smartphone } from "lucide-react";

const CHANNEL_ICON = { Email: Mail, SMS: MessageSquare, App: Smartphone } as const;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  const db = readDb();

  return (
    <PageShell
      title="Notifications"
      subtitle="Automatic citizen notifications sent as requests are processed"
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <ul className="divide-y divide-slate-100">
          {db.notifications.map((n) => {
            const Icon = CHANNEL_ICON[n.channel] ?? Mail;
            return (
              <li key={n.id} className="flex items-start gap-3 px-4 py-3.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-800">{n.message}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    To {n.recipient} · via {n.channel} · {formatDateTime(n.timestamp)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </PageShell>
  );
}
