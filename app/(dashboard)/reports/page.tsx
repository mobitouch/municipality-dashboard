import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangleIcon, DownloadIcon } from "lucide-react";

import { PageShell } from "@/components/app-shell/page-shell";
import { StatusBadge } from "@/components/badges";
import {
  HorizontalBarChart,
  MonthlyTrendChart,
  StatusDonutChart,
} from "@/components/charts/chart-primitives";
import { ReportRange } from "@/components/reports/report-range";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { buildSummary } from "@/lib/data/reports";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const single = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };

  const user = await requireUser();
  const range = { dateFrom: single("dateFrom"), dateTo: single("dateTo") };
  const summary = buildSummary(range);
  const canExport = can(user.role, "reports:export");

  const exportQuery = new URLSearchParams(
    Object.entries(range).filter(([, value]) => value) as [string, string][]
  );

  return (
    <PageShell
      title="Reports"
      subtitle="Volume and performance across every citizen submission"
      actions={
        canExport && (
          <a
            href={`/api/requests/export?${exportQuery.toString()}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <DownloadIcon />
            <span className="hidden sm:inline">Export CSV</span>
          </a>
        )
      }
    >
      <ReportRange />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Requests by department</CardTitle>
            <CardDescription>
              {summary.totals.total.toLocaleString()} submissions in the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={summary.byDepartment} color="var(--chart-1)" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Requests by status</CardTitle>
            <CardDescription>Where the current caseload sits</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDonutChart data={summary.byStatus} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Requests by category</CardTitle>
            <CardDescription>
              Most common: <span className="text-foreground font-medium">{summary.mostCommonCategory}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={summary.byCategory} color="var(--chart-2)" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resolution performance</CardTitle>
            <CardDescription>
              Average days to resolve, by department — overall {summary.totals.avgResolutionDays}d
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              data={summary.resolutionPerformance.map((entry) => ({
                name: entry.name,
                count: entry.avgDays,
              }))}
              color="var(--chart-3)"
              valueLabel="Avg. days"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Received and resolved per month</CardTitle>
            <CardDescription>
              A widening gap between the two lines means the backlog is growing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart data={summary.perMonth} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By priority</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={summary.byPriority} color="var(--chart-5)" height={170} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">By intake channel</CardTitle>
            <CardDescription>How citizens are reaching the municipality</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={summary.bySource} color="var(--chart-4)" height={170} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangleIcon className="text-destructive size-4" />
              Urgent and unresolved
              <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-medium">
                {summary.urgentUnresolved.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.urgentUnresolved.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Nothing urgent is outstanding.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table className="min-w-[44rem]">
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-36">Reference</TableHead>
                      <TableHead>Citizen</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="w-28">Status</TableHead>
                      <TableHead className="w-32">Submitted</TableHead>
                      <TableHead className="w-20">Age</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.urgentUnresolved.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Link
                            href={`/requests/${entry.id}`}
                            className="text-primary font-medium hover:underline"
                          >
                            {entry.referenceNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{entry.citizenName}</TableCell>
                        <TableCell className="text-muted-foreground">{entry.category}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.departmentName}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={entry.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(entry.dateSubmitted)}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {entry.ageDays}d
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
