import express, { type Request, type Response, type Router } from "express";

import { can } from "@/lib/auth/permissions";
import { authenticate, requireSession, unauthorized } from "@/lib/auth/request-auth";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { get } from "@/lib/db/client";
import { findCategoryByName, listCategories } from "@/lib/data/categories";
import { listDepartments } from "@/lib/data/departments";
import { listNotifications } from "@/lib/data/notifications";
import {
  createRequest,
  deleteRequest,
  getRequestDetail,
  getRequestForTracking,
  listAllRequests,
  listRequests,
  updateRequest,
} from "@/lib/data/requests";
import { listStaff } from "@/lib/data/staff";
import { toCsv } from "@/lib/format";
import { intakeLimitExceeded } from "@/lib/rate-limit";
import { parseRequestQuery } from "@/lib/request-query";
import {
  PRIORITIES,
  REQUEST_STATUSES,
  type Priority,
  type RequestKind,
  type RequestStatus,
} from "@/lib/types";
import { externalRequestSchema } from "@/lib/validation";

/** The Express equivalent of `request.nextUrl.searchParams`. */
export function searchParams(req: Request): URLSearchParams {
  const query = req.url.indexOf("?");
  return new URLSearchParams(query === -1 ? "" : req.url.slice(query + 1));
}

function forbidden(res: Response): void {
  res.status(403).json({ error: "Forbidden" });
}

/**
 * The public, integration-facing API. Routes, auth rules, status codes and
 * payloads are unchanged from the Next.js route handlers they replace — the
 * municipal website and the n8n workflow call these directly.
 */
export function createApiRouter(): Router {
  const router = express.Router();

  // Nothing served from /api is cacheable — every response is either a
  // mutation result or scoped to one staff member's session.
  router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    next();
  });

  // Any content type is parsed as JSON, as `request.json()` did.
  const json = express.json({ limit: "1mb", type: () => true });

  router.get("/health", (_req, res) => {
    // Unauthenticated liveness probe for a load balancer or uptime monitor.
    // It touches the database so a healthy response means the app can
    // actually serve requests, not merely that the process is up.
    try {
      get<{ ok: number }>("SELECT 1 AS ok");
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: "error", timestamp: new Date().toISOString() });
    }
  });

  // Lets the municipal website build its "what is this about?" dropdown from
  // the same list the dashboard uses, so the two never drift apart.
  router.get("/categories", (req, res) => {
    const caller = authenticate(req);
    if (!caller) return unauthorized(res);

    const kind = searchParams(req).get("kind") as RequestKind | null;
    const categories = listCategories({ kind: kind ?? undefined });

    res.json({
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        kind: category.kind,
      })),
    });
  });

  router.get("/departments", (req, res) => {
    const caller = authenticate(req);
    if (!caller) return unauthorized(res);

    const includeInactive = searchParams(req).get("includeInactive") === "true";
    res.json({ departments: listDepartments({ includeInactive }) });
  });

  router.get("/notifications", (req, res) => {
    const caller = authenticate(req);
    if (!caller) return unauthorized(res);
    if (!requireSession(caller)) return forbidden(res);

    const params = searchParams(req);
    res.json(
      listNotifications({
        channel: params.get("channel") ?? undefined,
        requestId: params.get("requestId") ?? undefined,
        q: params.get("q") ?? undefined,
        page: Number(params.get("page")) || 1,
        pageSize: Number(params.get("pageSize")) || DEFAULT_PAGE_SIZE,
      })
    );
  });

  router.get("/staff", (req, res) => {
    const caller = authenticate(req);
    if (!caller) return unauthorized(res);

    // Staff contact details are internal, so integration keys don't get them.
    if (!requireSession(caller)) return forbidden(res);

    const params = searchParams(req);
    res.json({
      staff: listStaff({
        departmentId: params.get("departmentId") ?? undefined,
        q: params.get("q") ?? undefined,
        includeInactive: params.get("includeInactive") === "true",
      }),
    });
  });

  // Public complaint-tracking lookup. Authenticated the same way as the
  // intake endpoint (session or integration key) so only the website's
  // server-to-server call can reach it — the citizen never talks to this
  // app directly. Requires both the reference number and the phone/email on
  // file so a guessed reference alone can't pull up someone else's case.
  router.get("/track", (req, res) => {
    const caller = authenticate(req);
    if (!caller) return unauthorized(res);

    const params = searchParams(req);
    const reference = params.get("reference") ?? "";
    const contact = params.get("contact") ?? "";

    if (!reference.trim() || !contact.trim()) {
      res.status(400).json({ error: "reference and contact are required." });
      return;
    }

    const status = getRequestForTracking(reference, contact);
    if (!status) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({ status });
  });

  // Streams the current filter selection as a spreadsheet-ready CSV.
  // Registered before `/requests/:id` so "export" is never read as an id.
  router.get("/requests/export", (req, res) => {
    const caller = authenticate(req);
    if (!caller) return unauthorized(res);

    const user = requireSession(caller);
    if (!user || !can(user.role, "reports:export")) return forbidden(res);

    const requests = listAllRequests(parseRequestQuery(searchParams(req), { paginated: false }));

    const csv = toCsv(
      requests.map((entry) => ({
        Reference: entry.referenceNumber,
        Type: entry.kind,
        Status: entry.status,
        Priority: entry.priority,
        Category: entry.category,
        Department: entry.departmentName ?? "Unassigned",
        "Assigned to": entry.assignedStaffName ?? "",
        Citizen: entry.citizenName,
        Phone: entry.phone,
        Email: entry.email,
        Location: entry.location,
        Description: entry.description,
        Source: entry.source,
        Submitted: entry.dateSubmitted,
        "Target date": entry.dueAt ?? "",
        Resolved: entry.resolvedAt ?? "",
      }))
    );

    const stamp = new Date().toISOString().slice(0, 10);

    // The BOM makes Excel open UTF-8 correctly on Windows.
    res.status(200);
    res.type("text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="requests-${stamp}.csv"`);
    res.send(`\uFEFF${csv}`);
  });

  router.get("/requests", (req, res) => {
    const caller = authenticate(req);
    if (!caller) return unauthorized(res);

    res.json(listRequests(parseRequestQuery(searchParams(req))));
  });

  // The intake endpoint. The municipal website's Contact and "Report an
  // Issue" forms post here server-to-server, as does the n8n chatbot flow.
  router.post("/requests", json, (req, res) => {
    const caller = authenticate(req);
    if (!caller) return unauthorized(res);

    if (caller.kind === "session" && !can(caller.user.role, "requests:create")) {
      return forbidden(res);
    }

    const callerId = caller.kind === "session" ? caller.user.id : caller.keyId;
    if (intakeLimitExceeded(callerId)) {
      res.setHeader("Retry-After", "60");
      res.status(429).json({ error: "Too many submissions. Try again shortly." });
      return;
    }

    const body = req.body;
    if (!body) {
      res.status(400).json({ error: "Expected a JSON body." });
      return;
    }

    const parsed = externalRequestSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed.",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const category = findCategoryByName(parsed.data.category);
    if (!category) {
      res.status(400).json({ error: `Unknown category "${parsed.data.category}".` });
      return;
    }
    if (!category.isActive) {
      res
        .status(400)
        .json({ error: `Category "${category.name}" is no longer accepting submissions.` });
      return;
    }

    // An explicit source always wins; otherwise key-authenticated callers are
    // the chatbot by convention, matching the existing n8n workflow.
    const source = parsed.data.source ?? (caller.kind === "apiKey" ? "chatbot" : "staff");

    const actor = caller.kind === "session" ? caller.user.name : `Integration (${caller.label})`;

    const created = createRequest(
      {
        kind: parsed.data.kind ?? category.kind,
        citizenName: parsed.data.citizenName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        categoryId: category.id,
        location: parsed.data.location,
        description: parsed.data.description,
        priority: parsed.data.priority,
        source,
        attachedImage: parsed.data.attachedImage ?? null,
      },
      actor
    );

    res.status(201).json({ request: created });
  });

  router.get("/requests/:id", (req, res) => {
    const caller = authenticate(req);
    if (!caller) return unauthorized(res);

    const found = getRequestDetail(req.params.id);
    if (!found) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({ request: found });
  });

  router.patch("/requests/:id", json, (req, res) => {
    const caller = authenticate(req);
    if (!caller) return unauthorized(res);

    // Updating an existing case is a staff action, not something an
    // integration key should be able to do.
    const user = requireSession(caller);
    if (!user || !can(user.role, "requests:update")) return forbidden(res);

    const body = req.body;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "Expected a JSON body." });
      return;
    }

    if (body.status && !REQUEST_STATUSES.includes(body.status as RequestStatus)) {
      res.status(400).json({ error: "Unknown status." });
      return;
    }
    if (body.priority && !PRIORITIES.includes(body.priority as Priority)) {
      res.status(400).json({ error: "Unknown priority." });
      return;
    }

    const updated = updateRequest(req.params.id, body, user.name);
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({ request: updated });
  });

  router.delete("/requests/:id", (req, res) => {
    const caller = authenticate(req);
    if (!caller) return unauthorized(res);

    const user = requireSession(caller);
    if (!user || !can(user.role, "requests:delete")) return forbidden(res);

    if (!deleteRequest(req.params.id)) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.status(204).end();
  });

  return router;
}
