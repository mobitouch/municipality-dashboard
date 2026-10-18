import express, { type Request, type Response, type Router } from "express";

import { ACTIONS } from "@/server/actions/registry";
import { can } from "@/lib/auth/permissions";
import { readCookie, withRequestContext } from "@/lib/auth/request-context";
import { resolveSession, type SessionUser } from "@/lib/auth/session";
import { listApiKeys } from "@/lib/auth/api-key";
import { DEFAULT_PAGE_SIZE, SESSION_COOKIE } from "@/lib/constants";
import { listAudit } from "@/lib/data/audit";
import { listCategories } from "@/lib/data/categories";
import { listDepartments, listDepartmentsWithStats } from "@/lib/data/departments";
import { listNotifications, notificationChannelCounts } from "@/lib/data/notifications";
import { buildSummary, recentActivity } from "@/lib/data/reports";
import { getRequestDetail, listRequests, type RequestSort } from "@/lib/data/requests";
import { getSettings } from "@/lib/data/settings";
import { listStaff } from "@/lib/data/staff";
import { listUsers } from "@/lib/data/users";
import { env } from "@/lib/env";
import { REQUEST_KINDS, type RequestKind } from "@/lib/types";
import type {
  CategoriesData,
  DepartmentsData,
  NotificationsData,
  OverviewData,
  ReportsData,
  RequestDetailData,
  RequestListData,
  SessionPayload,
  SettingsData,
  StaffPageData,
  UsersData,
} from "@/lib/page-data";
import { idleState, errorState } from "@/lib/actions/types";

const SORTS: RequestSort[] = ["newest", "oldest", "priority", "status", "reference", "updated"];

function single(req: Request, key: string): string {
  const value = req.query[key];
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" ? first : "";
}

/**
 * Resolves the signed-in user for a page-data request, or answers 401/403
 * itself and returns null. A staff member holding an admin-issued temporary
 * password is held at the change-password screen, so no data endpoint serves
 * them until they have chosen their own.
 */
function pageUser(req: Request, res: Response): SessionUser | null {
  const user = resolveSession(readCookie(req, SESSION_COOKIE));
  if (!user) {
    res.status(401).json({ error: "Your session has expired. Please sign in again." });
    return null;
  }
  if (user.mustChangePassword) {
    res.status(403).json({ error: "Choose a new password to continue." });
    return null;
  }
  return user;
}

/**
 * The dashboard's own endpoints: one JSON read per screen, plus the form
 * mutations. These replace the Next.js server components and server actions
 * and are not part of the public integration API.
 */
export function createAppRouter(): Router {
  const router = express.Router();

  router.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    // Server actions were CSRF-checked by comparing Origin to Host; a
    // state-changing call from any other origin is refused the same way.
    if (req.method !== "GET" && req.method !== "HEAD") {
      const origin = req.headers.origin;
      if (origin) {
        let originHost = "";
        try {
          originHost = new URL(origin).host;
        } catch {
          // Falls through to the rejection below.
        }
        const forwardedHost = req.headers["x-forwarded-host"];
        const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) ?? req.headers.host;
        if (originHost !== host) {
          res.status(403).json({ error: "Cross-origin request refused." });
          return;
        }
      }
    }
    // Bind the request so the auth helpers can read cookies and headers.
    withRequestContext(req, res, next);
  });

  router.get("/session", (req, res) => {
    const user = resolveSession(readCookie(req, SESSION_COOKIE));
    const settings = getSettings();

    const payload: SessionPayload = {
      user,
      settings: {
        organisationName: settings.organisationName,
        autoRefreshSeconds: settings.autoRefreshSeconds,
      },
      devHint: env.isProduction ? null : env.ADMIN_EMAIL,
    };
    res.json(payload);
  });

  router.get("/pages/overview", (req, res) => {
    if (!pageUser(req, res)) return;

    const data: OverviewData = {
      summary: buildSummary(),
      needsAttention: listRequests({ openOnly: true, sort: "priority", pageSize: 6 }),
      activity: recentActivity(7),
    };
    res.json(data);
  });

  router.get("/pages/requests", (req, res) => {
    if (!pageUser(req, res)) return;

    const kindParam = single(req, "kind");
    const kind: RequestKind = REQUEST_KINDS.includes(kindParam as RequestKind)
      ? (kindParam as RequestKind)
      : "request";
    const sortParam = single(req, "sort");

    const data: RequestListData = {
      results: listRequests({
        kind,
        status: single(req, "status"),
        departmentId: single(req, "departmentId"),
        categoryId: single(req, "categoryId"),
        assignedStaffId: single(req, "assignedStaffId"),
        priority: single(req, "priority"),
        q: single(req, "q"),
        dateFrom: single(req, "dateFrom"),
        dateTo: single(req, "dateTo"),
        sort: (SORTS as string[]).includes(sortParam) ? (sortParam as RequestSort) : "newest",
        page: Number(single(req, "page")) || 1,
        pageSize: DEFAULT_PAGE_SIZE,
      }),
      departments: listDepartments(),
      categories: listCategories({ includeInactive: false }),
      staff: listStaff(),
    };
    res.json(data);
  });

  router.get("/pages/requests/:id", (req, res) => {
    if (!pageUser(req, res)) return;

    const request = getRequestDetail(req.params.id);
    if (!request) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const data: RequestDetailData = {
      request,
      departments: listDepartments(),
      categories: listCategories(),
      staff: listStaff(),
    };
    res.json(data);
  });

  router.get("/pages/reports", (req, res) => {
    if (!pageUser(req, res)) return;

    const data: ReportsData = {
      summary: buildSummary({ dateFrom: single(req, "dateFrom"), dateTo: single(req, "dateTo") }),
    };
    res.json(data);
  });

  router.get("/pages/categories", (req, res) => {
    if (!pageUser(req, res)) return;

    const data: CategoriesData = {
      categories: listCategories({ includeInactive: true }),
      departments: listDepartments({ includeInactive: true }),
    };
    res.json(data);
  });

  router.get("/pages/departments", (req, res) => {
    if (!pageUser(req, res)) return;

    const data: DepartmentsData = { departments: listDepartmentsWithStats() };
    res.json(data);
  });

  router.get("/pages/notifications", (req, res) => {
    if (!pageUser(req, res)) return;

    const data: NotificationsData = {
      results: listNotifications({
        channel: single(req, "channel"),
        page: Number(single(req, "page")) || 1,
        pageSize: DEFAULT_PAGE_SIZE,
      }),
      counts: notificationChannelCounts(),
    };
    res.json(data);
  });

  router.get("/pages/staff", (req, res) => {
    if (!pageUser(req, res)) return;

    const data: StaffPageData = {
      departments: listDepartments({ includeInactive: true }),
      staff: listStaff({
        q: single(req, "q"),
        departmentId: single(req, "departmentId"),
        includeInactive: single(req, "inactive") === "1",
      }),
    };
    res.json(data);
  });

  router.get("/pages/users", (req, res) => {
    const user = pageUser(req, res);
    if (!user) return;

    // The sidebar hides this route without the permission; a direct URL
    // still has to be refused rather than served.
    const data: UsersData = can(user.role, "users:manage")
      ? {
          forbidden: false,
          users: listUsers(),
          departments: listDepartments({ includeInactive: true }),
        }
      : { forbidden: true };
    res.json(data);
  });

  router.get("/pages/settings", (req, res) => {
    const user = pageUser(req, res);
    if (!user) return;

    const canManageSettings = can(user.role, "settings:manage");
    const data: SettingsData = {
      settings: getSettings(),
      apiKeys: canManageSettings ? listApiKeys() : [],
      audit: canManageSettings ? listAudit(15) : [],
      isProduction: env.isProduction,
    };
    res.json(data);
  });

  // Forms post urlencoded bodies; they are rebuilt into a FormData so the
  // action implementations keep reading fields exactly as they did before.
  router.post("/actions/:domain/:verb", express.text({ type: () => true, limit: "1mb" }), async (req, res) => {
    const handler = ACTIONS[`${req.params.domain}/${req.params.verb}`];
    if (!handler) {
      res.status(404).json({ error: "Unknown action." });
      return;
    }

    const formData = new FormData();
    const body = typeof req.body === "string" ? req.body : "";
    for (const [key, value] of new URLSearchParams(body)) formData.append(key, value);

    try {
      res.json(await handler(idleState, formData));
    } catch (error) {
      console.error("[action]", error);
      res.json(errorState("Something went wrong. Please try again."));
    }
  });

  return router;
}
