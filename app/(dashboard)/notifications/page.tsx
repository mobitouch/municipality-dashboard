import Link from "next/link";
import type { Metadata } from "next";
import { BellIcon, MailIcon, MessageSquareIcon, SmartphoneIcon } from "lucide-react";

import { AutoRefresh } from "@/components/auto-refresh";
import { PageShell } from "@/components/app-shell/page-shell";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { requireUser } from "@/lib/auth/dal";
import { listNotifications, notificationChannelCounts } from "@/lib/data/notifications";
import { getSettings } from "@/lib/data/settings";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

const CHANNEL_ICON = {
  Email: MailIcon,
  SMS: MessageSquareIcon,
  App: SmartphoneIcon,
} as const;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const single = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };

  await requireUser();
  const settings = getSettings();
  const channel = single("channel");

  const results = listNotifications({
    channel,
    page: Number(single("page")) || 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const counts = notificationChannelCounts();

  const linkParams: Record<string, string> = channel ? { channel } : {};

  return (
    <PageShell
      title="Notifications"
      subtitle="Every message sent to a citizen as their submission moved through the process"
    >
      <AutoRefresh intervalSeconds={settings.autoRefreshSeconds} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/notifications"
          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
            channel ? "hover:bg-accent" : "bg-primary text-primary-foreground border-primary"
          }`}
        >
          All
        </Link>
        {(["Email", "SMS", "App"] as const).map((entry) => (
          <Link
            key={entry}
            href={`/notifications?channel=${entry}`}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              channel === entry
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-accent"
            }`}
          >
            {entry}
            <span className="ml-1.5 opacity-70">{counts[entry] ?? 0}</span>
          </Link>
        ))}
      </div>

      {results.items.length === 0 ? (
        <EmptyState
          icon={BellIcon}
          title="No notifications yet"
          description="Citizens are notified automatically when a request is logged, routed, or changes status."
        />
      ) : (
        <div className="bg-card overflow-hidden rounded-xl border">
          <ul className="divide-y">
            {results.items.map((notification) => {
              const Icon = CHANNEL_ICON[notification.channel] ?? MailIcon;
              return (
                <li key={notification.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      To {notification.recipient} · via {notification.channel} ·{" "}
                      {formatDateTime(notification.timestamp)}
                      {notification.relatedRequestId && (
                        <>
                          {" · "}
                          <Link
                            href={`/requests/${notification.relatedRequestId}`}
                            className="text-primary hover:underline"
                          >
                            {notification.relatedReferenceNumber}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Pagination
        basePath="/notifications"
        params={linkParams}
        page={results.page}
        pageCount={results.pageCount}
        total={results.total}
        pageSize={results.pageSize}
        itemLabel="notifications"
      />
    </PageShell>
  );
}
