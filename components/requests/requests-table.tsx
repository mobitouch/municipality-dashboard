import { Link } from "@/components/link";
import { InboxIcon, PaperclipIcon, StickyNoteIcon } from "lucide-react";

import { PriorityBadge, StatusBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatRelative } from "@/lib/format";
import type { CitizenRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RequestsTable({
  requests,
  basePath,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  requests: CitizenRequest[];
  basePath: string;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}) {
  if (!requests.length) {
    return (
      <EmptyState
        icon={InboxIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  // Read once for the whole table rather than once per row. It only flags
  // overdue rows, so it need not stay stable across re-renders.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <>
      {/* Below md the table becomes a card list — a seven-column table is
          unusable on a phone, and field staff do use this on phones. */}
      <ul className="space-y-2.5 md:hidden">
        {requests.map((request) => (
          <li key={request.id}>
            <Link
              href={`${basePath}/${request.id}`}
              className="bg-card hover:border-primary/40 block rounded-xl border p-3.5 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-primary font-medium">{request.referenceNumber}</p>
                  <p className="mt-0.5 truncate text-sm">{request.citizenName}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <PriorityBadge priority={request.priority} />
                  <StatusBadge status={request.status} />
                </div>
              </div>
              <div className="text-muted-foreground mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span>{request.category}</span>
                <span aria-hidden="true">·</span>
                <span>{request.departmentName ?? "Unassigned"}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDate(request.dateSubmitted)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="bg-card hidden overflow-hidden rounded-xl border md:block">
        <Table className="min-w-[62rem]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[9.5rem]">Reference</TableHead>
              <TableHead>Citizen</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Assigned to</TableHead>
              <TableHead className="w-[5.5rem]">Priority</TableHead>
              <TableHead className="w-[7.5rem]">Status</TableHead>
              <TableHead className="w-[8rem]">Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => {
              const overdue =
                request.dueAt !== null &&
                new Date(request.dueAt).getTime() < now &&
                !["Resolved", "Closed", "Rejected"].includes(request.status);

              return (
                <TableRow key={request.id}>
                  <TableCell>
                    <Link
                      href={`${basePath}/${request.id}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {request.referenceNumber}
                    </Link>
                    <span className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                      {request.noteCount > 0 && (
                        <span className="inline-flex items-center gap-0.5" title="Internal notes">
                          <StickyNoteIcon className="size-3" />
                          {request.noteCount}
                        </span>
                      )}
                      {request.attachedImage && (
                        <PaperclipIcon className="size-3" aria-label="Has attachment" />
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block max-w-[12rem] truncate">{request.citizenName}</span>
                    {request.location && (
                      <span className="text-muted-foreground block max-w-[12rem] truncate text-xs">
                        {request.location}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{request.category}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {request.departmentName ?? (
                      <span className="text-warning">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {request.assignedStaffName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={request.priority} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="block">{formatDate(request.dateSubmitted)}</span>
                    <span className={cn("block text-xs", overdue && "text-destructive font-medium")}>
                      {overdue ? `Overdue ${formatRelative(request.dueAt)}` : formatRelative(request.dateSubmitted)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
