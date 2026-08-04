"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CitizenRequest, Department, Staff } from "@/lib/types";
import { REQUEST_STATUSES, PRIORITIES } from "@/lib/types";

const selectClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-koura-primary focus:outline-none focus:ring-2 focus:ring-koura-primary/20";

function Field({
  label,
  saving,
  children,
}: {
  label: string;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
        {label}
        {saving && <span className="text-xs font-normal text-koura-primary">Saving...</span>}
      </label>
      {children}
    </div>
  );
}

export default function RequestActions({
  request,
  departments,
  staff,
}: {
  request: CitizenRequest;
  departments: Department[];
  staff: Staff[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [savingField, setSavingField] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  async function patch(payload: Record<string, unknown>, field: string) {
    setSavingField(field);
    await fetch(`/api/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actor: "Admin User", ...payload }),
    });
    setSavingField(null);
    startTransition(() => router.refresh());
  }

  const staffInDept = staff.filter((s) => s.departmentId === request.departmentId);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Status" saving={savingField === "status"}>
          <select
            value={request.status}
            onChange={(e) => patch({ status: e.target.value }, "status")}
            className={selectClass}
          >
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Priority" saving={savingField === "priority"}>
          <select
            value={request.priority}
            onChange={(e) => patch({ priority: e.target.value }, "priority")}
            className={selectClass}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Department" saving={savingField === "department"}>
          <select
            value={request.departmentId ?? ""}
            onChange={(e) =>
              patch({ departmentId: e.target.value || null, assignedStaffId: null }, "department")
            }
            className={selectClass}
          >
            <option value="">Unassigned</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Assigned Employee" saving={savingField === "staff"}>
          <select
            value={request.assignedStaffId ?? ""}
            onChange={(e) => patch({ assignedStaffId: e.target.value || null }, "staff")}
            className={selectClass}
            disabled={!request.departmentId}
          >
            <option value="">Unassigned</option>
            {staffInDept.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.role}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Add internal note</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={2}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-koura-primary focus:outline-none focus:ring-2 focus:ring-koura-primary/20"
            placeholder="Visible to municipal staff only..."
          />
          <button
            onClick={async () => {
              if (!noteText.trim()) return;
              await patch({ note: noteText }, "note");
              setNoteText("");
            }}
            className="rounded-lg bg-koura-primary px-4 py-2 text-sm font-medium text-white hover:bg-koura-primary/90 sm:self-start"
          >
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
}
