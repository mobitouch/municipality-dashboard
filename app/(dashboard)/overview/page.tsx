import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ClockIcon,
  LoaderIcon,
  SparklesIcon,
  TimerIcon,
  UserXIcon,
} from "lucide-react";

import { AutoRefresh } from "@/components/auto-refresh";
import { PageShell } from "@/components/app-shell/page-shell";
import { HorizontalBarChart } from "@/components/charts/chart-primitives";
import { MetricCard } from "@/components/metric-card";
import { RequestsTable } from "@/components/requests/requests-table";
import { StatusBadge } from "@/components/badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/dal";
import { buildSummary, recentActivity } from "@/lib/data/reports";
import { listRequests } from "@/lib/data/requests";
import { getSettings } from "@/lib/data/settings";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const user = await requireUser();
  const settings = getSettings();
  const summary = buildSummary();
  const { totals } = summary;

  const needsAttention = listRequests({
    openOnly: true,
    sort: "priority",
    pageSize: 6,
  });
  const activity = recentActivity(7);

  const firstName = user.name.split(" ")[0];

  return (
    <PageShell
      title={`Good to see you, ${firstName}`}
      subtitle="Live snapshot of citizen requests across the municipality"
    >
      <AutoRefresh intervalSeconds={settings.autoRefreshSeconds} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
        <MetricCard
          label="Total"
          value={totals.total}
          icon={ClipboardListIcon}
          href="/requests"
        />
        <MetricCard
          label="New"
          value={totals.new}
          icon={SparklesIcon}
          accent="text-sky-600 bg-sky-500/10 dark:text-sky-400"
          href="/requests?status=New"
        />
        <MetricCard
          label="In progress"
          value={totals.inProgress}
          icon={LoaderIcon}
          accent="text-violet-600 bg-violet-500/10 dark:text-violet-400"
          href="/requests?status=In+Progress"
        />
        <MetricCard
          label="Resolved"
          value={totals.resolved}
          icon={CheckCircle2Icon}
          accent="text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
          href="/requests?status=Resolved"
        />
        <MetricCard
          label="Urgent"
          value={totals.urgent}
          icon={AlertTriangleIcon}
          accent="text-red-600 bg-red-500/10 dark:text-red-400"
          href="/requests?priority=Urgent"
        />
        <MetricCard
          label="Unassigned"
          value={totals.unassigned}
          icon={UserXIcon}
          accent="text-amber-600 bg-amber-500/10 dark:text-amber-400"
          hint="No department or no owner"
        />
        <MetricCard
          label="Overdue"
          value={totals.overdue}
          icon={ClockIcon}
          accent="text-orange-600 bg-orange-500/10 dark:text-orange-400"
          hint="Past target date"
        />
        <MetricCard
          label="Avg. resolution"
          value={`${totals.avgResolutionDays}d`}
          icon={TimerIcon}
          accent="text-teal-600 bg-teal-500/10 dark:text-teal-400"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Needs attention first</CardTitle>
            <CardDescription>
              Open requests ordered by priority, then by how long they have been waiting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequestsTable
              requests={needsAttention.items}
              basePath="/requests"
              emptyTitle="Nothing waiting"
              emptyDescription="Every request has been resolved or closed."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent activity</CardTitle>
            <CardDescription>The latest changes across all requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
            ) : (
              <ol className="space-y-3">
                {activity.map((entry) => (
                  <li key={entry.id} className="text-sm">
                    <Link
                      href={`/requests/${entry.requestId}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {entry.referenceNumber}
                    </Link>{" "}
                    <span>{entry.action.toLowerCase()}</span>
                    <p className="text-muted-foreground truncate text-xs">
                      {entry.actor} · {formatRelative(entry.timestamp)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Requests by department</CardTitle>
            <CardDescription>Current caseload across municipal departments</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={summary.byDepartment} color="var(--chart-1)" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Requests by category</CardTitle>
            <CardDescription>Most common types of citizen request</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={summary.byCategory} color="var(--chart-2)" />
          </CardContent>
        </Card>
      </div>

      {summary.urgentUnresolved.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangleIcon className="text-destructive size-4" />
              Urgent and still open
              <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-medium">
                {summary.urgentUnresolved.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {summary.urgentUnresolved.slice(0, 8).map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <Link
                    href={`/requests/${entry.id}`}
                    className="text-primary w-28 shrink-0 text-sm font-medium hover:underline"
                  >
                    {entry.referenceNumber}
                  </Link>
                  <span className="min-w-0 flex-1 truncate text-sm">{entry.citizenName}</span>
                  <span className="text-muted-foreground hidden text-sm sm:block">
                    {entry.departmentName}
                  </span>
                  <StatusBadge status={entry.status} />
                  <span className="text-muted-foreground w-20 text-right text-xs">
                    {entry.ageDays}d old
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
