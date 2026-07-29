import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readDb, writeDb, newId } from "@/lib/db";
import { hasSession } from "@/lib/auth";
import { CLOSED_STATUSES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  if (!hasSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const db = readDb();
  const found = db.requests.find((r) => r.id === id);
  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ request: found });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!hasSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = readDb();
  const reqItem = db.requests.find((r) => r.id === id);
  if (!reqItem) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const actor: string = body.actor ?? "Dashboard user";
  const now = new Date().toISOString();

  function deptName(deptId: string | null) {
    if (!deptId) return "Unassigned";
    return db.departments.find((d) => d.id === deptId)?.name ?? deptId;
  }
  function staffName(staffId: string | null) {
    if (!staffId) return "Unassigned";
    return db.staff.find((s) => s.id === staffId)?.name ?? staffId;
  }

  if (typeof body.status === "string" && body.status !== reqItem.status) {
    reqItem.activityHistory.push({
      id: newId("act"),
      timestamp: now,
      actor,
      action: "Status changed",
      detail: `${reqItem.status} -> ${body.status}`,
    });
    reqItem.status = body.status;
    if (CLOSED_STATUSES.includes(body.status) && !reqItem.resolvedAt) {
      reqItem.resolvedAt = now;
    }
    if (!CLOSED_STATUSES.includes(body.status)) {
      reqItem.resolvedAt = null;
    }
  }

  if (typeof body.priority === "string" && body.priority !== reqItem.priority) {
    reqItem.activityHistory.push({
      id: newId("act"),
      timestamp: now,
      actor,
      action: "Priority changed",
      detail: `${reqItem.priority} -> ${body.priority}`,
    });
    reqItem.priority = body.priority;
  }

  if ("departmentId" in body && body.departmentId !== reqItem.departmentId) {
    reqItem.activityHistory.push({
      id: newId("act"),
      timestamp: now,
      actor,
      action: "Department assigned",
      detail: `${deptName(reqItem.departmentId)} -> ${deptName(body.departmentId)}`,
    });
    reqItem.departmentId = body.departmentId;
  }

  if ("assignedStaffId" in body && body.assignedStaffId !== reqItem.assignedStaffId) {
    reqItem.activityHistory.push({
      id: newId("act"),
      timestamp: now,
      actor,
      action: "Staff assigned",
      detail: `${staffName(reqItem.assignedStaffId)} -> ${staffName(body.assignedStaffId)}`,
    });
    reqItem.assignedStaffId = body.assignedStaffId;
  }

  if (typeof body.note === "string" && body.note.trim()) {
    reqItem.internalNotes.push({
      id: newId("note"),
      author: actor,
      timestamp: now,
      note: body.note.trim(),
    });
    reqItem.activityHistory.push({
      id: newId("act"),
      timestamp: now,
      actor,
      action: "Internal note added",
      detail: body.note.trim(),
    });
  }

  writeDb(db);
  return NextResponse.json({ request: reqItem });
}
