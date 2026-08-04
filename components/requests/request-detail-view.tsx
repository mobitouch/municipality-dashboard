import Link from "next/link";
import {
  ArrowLeftIcon,
  CalendarIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";

import { AddNoteForm } from "./add-note-form";
import { RequestFormDialog } from "./request-form-dialog";
import { RequestWorkflow } from "./request-workflow";
import { KindBadge, PriorityBadge, StatusBadge } from "@/components/badges";
import { ConfirmAction } from "@/components/form/confirm-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { deleteRequestAction } from "@/lib/actions/requests";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import { CLOSED_STATUSES } from "@/lib/types";
import type { Category, Department, RequestDetail, Staff } from "@/lib/types";
import { cn } from "@/lib/utils";

function DetailItem({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium break-words">{children}</dd>
    </div>
  );
}

export function RequestDetailView({
  request,
  departments,
  categories,
  staff,
  basePath,
  backLabel,
  canEdit,
  canAssign,
  canDelete,
}: {
  request: RequestDetail;
  departments: Department[];
  categories: Category[];
  staff: Staff[];
  basePath: string;
  backLabel: string;
  canEdit: boolean;
  canAssign: boolean;
  canDelete: boolean;
}) {
  // This is a Server Component, fully re-executed on every request, so
  // Date.now() here doesn't have the memoization hazard the lint rule is
  // written for (that concern applies to Client Components under the React
  // Compiler); it's a single read of the current time to flag an overdue
  // request, not a value that needs to stay stable across re-renders.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const overdue =
    request.dueAt !== null &&
    new Date(request.dueAt).getTime() < now &&
    !CLOSED_STATUSES.includes(request.status);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={basePath}
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeftIcon className="size-4" />
        {backLabel}
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{request.referenceNumber}</h2>
            <KindBadge kind={request.kind} />
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {request.category} · submitted {formatRelative(request.dateSubmitted)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={request.priority} />
          <StatusBadge status={request.status} />

          {canEdit && (
            <RequestFormDialog
              trigger={
                <Button variant="outline" size="sm">
                  <PencilIcon />
                  Edit
                </Button>
              }
              departments={departments}
              categories={categories}
              staff={staff}
              request={request}
            />
          )}

          {canDelete && (
            <ConfirmAction
              trigger={
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2Icon />
                  Delete
                </Button>
              }
              title={`Delete ${request.referenceNumber}?`}
              description="The request, its internal notes, and its activity history are permanently removed. Notifications already sent to the citizen are kept. This cannot be undone."
              confirmLabel="Delete permanently"
              action={deleteRequestAction}
              hiddenFields={{ id: request.id }}
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Request details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem icon={UserIcon} label="Citizen">
                  {request.citizenName}
                </DetailItem>
                <DetailItem icon={PhoneIcon} label="Phone">
                  {request.phone ? (
                    <a href={`tel:${request.phone}`} className="hover:underline">
                      {request.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </DetailItem>
                <DetailItem icon={MailIcon} label="Email">
                  {request.email ? (
                    <a href={`mailto:${request.email}`} className="hover:underline">
                      {request.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </DetailItem>
                <DetailItem icon={MapPinIcon} label="Location">
                  {request.location || "—"}
                </DetailItem>
                <DetailItem icon={CalendarIcon} label="Submitted">
                  {formatDateTime(request.dateSubmitted)}
                </DetailItem>
                <DetailItem icon={CalendarIcon} label="Target completion">
                  <span className={cn(overdue && "text-destructive")}>
                    {request.dueAt ? formatDate(request.dueAt) : "Not set"}
                    {overdue && " · overdue"}
                  </span>
                </DetailItem>
                <DetailItem label="Received via">
                  <span className="capitalize">
                    {request.source === "staff" ? "Logged by staff" : request.source}
                  </span>
                </DetailItem>
                <DetailItem label="Resolved">
                  {request.resolvedAt ? formatDateTime(request.resolvedAt) : "Not yet"}
                </DetailItem>

                <DetailItem label="Description" className="sm:col-span-2">
                  <span className="font-normal whitespace-pre-wrap">{request.description}</span>
                </DetailItem>
              </dl>

              {request.attachedImage && (
                <>
                  <Separator className="my-4" />
                  <p className="text-muted-foreground mb-2 text-xs">Attachment</p>
                  {/* Citizen uploads are arbitrary paths, so the optimiser is
                      bypassed deliberately here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={request.attachedImage}
                    alt="Citizen attachment"
                    className="max-w-xs rounded-lg border"
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Internal notes
                {request.internalNotes.length > 0 && (
                  <span className="text-muted-foreground ml-1.5 font-normal">
                    ({request.internalNotes.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.internalNotes.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No internal notes yet. Notes are visible to municipal staff only.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {request.internalNotes.map((note) => (
                    <li key={note.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                      <p className="whitespace-pre-wrap">{note.note}</p>
                      <p className="text-muted-foreground mt-1.5 text-xs">
                        {note.author} · {formatDateTime(note.timestamp)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {canEdit && <AddNoteForm requestId={request.id} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activity history</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="border-border relative space-y-4 border-l pl-4">
                {[...request.activityHistory].reverse().map((entry) => (
                  <li key={entry.id} className="relative">
                    <span className="bg-primary ring-card absolute top-1.5 -left-[1.3125rem] size-2.5 rounded-full ring-4" />
                    <p className="text-sm font-medium">{entry.action}</p>
                    {entry.detail && (
                      <p className="text-muted-foreground text-sm break-words">{entry.detail}</p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {entry.actor} · {formatDateTime(entry.timestamp)}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-0">
            <CardHeader>
              <CardTitle className="text-sm">Manage request</CardTitle>
            </CardHeader>
            <CardContent>
              {canEdit ? (
                <RequestWorkflow
                  request={request}
                  departments={departments}
                  staff={staff}
                  canAssign={canAssign}
                />
              ) : (
                <p className="text-muted-foreground text-sm">
                  You have read-only access to this request.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
