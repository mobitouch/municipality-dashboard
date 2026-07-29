import Link from "next/link";
import { ArrowLeft, Phone, MapPin, Calendar, User } from "lucide-react";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import RequestActions from "./RequestActions";
import type { CitizenRequest, Department, Staff } from "@/lib/types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RequestDetail({
  request,
  departments,
  staff,
  basePath,
  backLabel,
}: {
  request: CitizenRequest;
  departments: Department[];
  staff: Staff[];
  basePath: string;
  backLabel: string;
}) {
  const assignedStaff = staff.find((s) => s.id === request.assignedStaffId);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={basePath}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{request.referenceNumber}</h2>
          <p className="text-sm text-slate-500">{request.category}</p>
        </div>
        <div className="flex gap-2">
          <PriorityBadge priority={request.priority} />
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Request Details</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <User className="h-3.5 w-3.5" /> Citizen
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">{request.citizenName}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">{request.phone || "—"}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> Location
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">{request.location || "—"}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="h-3.5 w-3.5" /> Date Submitted
                </dt>
                <dd className="mt-0.5 font-medium text-slate-800">{formatDateTime(request.dateSubmitted)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Description</dt>
                <dd className="mt-0.5 text-slate-700">{request.description}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Source</dt>
                <dd className="mt-0.5 capitalize text-slate-700">{request.source}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Currently Assigned To</dt>
                <dd className="mt-0.5 text-slate-700">
                  {assignedStaff ? `${assignedStaff.name} (${assignedStaff.role})` : "Unassigned"}
                </dd>
              </div>
            </dl>

            {request.attachedImage && (
              <div className="mt-4">
                <p className="mb-2 text-sm text-slate-500">Attached Image</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={request.attachedImage}
                  alt="Citizen attachment"
                  width={320}
                  height={240}
                  className="rounded-lg border border-slate-200"
                />
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Internal Notes</h3>
            {request.internalNotes.length === 0 ? (
              <p className="text-sm text-slate-400">No internal notes yet.</p>
            ) : (
              <ul className="space-y-3">
                {request.internalNotes.map((n) => (
                  <li key={n.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <p className="text-slate-700">{n.note}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {n.author} — {formatDateTime(n.timestamp)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Activity History</h3>
            <ol className="relative space-y-4 border-l border-slate-200 pl-4">
              {request.activityHistory
                .slice()
                .reverse()
                .map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                    <p className="text-sm font-medium text-slate-800">{a.action}</p>
                    <p className="text-sm text-slate-600">{a.detail}</p>
                    <p className="text-xs text-slate-400">
                      {a.actor} — {formatDateTime(a.timestamp)}
                    </p>
                  </li>
                ))}
            </ol>
          </section>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Manage Request</h3>
          <RequestActions request={request} departments={departments} staff={staff} />
        </div>
      </div>
    </div>
  );
}
