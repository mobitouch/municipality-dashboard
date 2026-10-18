/**
 * The JSON shapes the dashboard's page endpoints (`/api/app/pages/*`) return.
 * Defined once, from the data layer's own types, so the server handlers and
 * the screens that consume them cannot drift apart. Type-only imports: none
 * of the server modules are pulled into the browser bundle.
 */
import type { SessionUser } from "@/lib/auth/session";
import type { AppSettings } from "@/lib/data/settings";
import type { recentActivity, ReportSummary } from "@/lib/data/reports";
import type {
  ApiKey,
  AppUser,
  AuditEntry,
  Category,
  CitizenRequest,
  Department,
  DepartmentWithStats,
  Notification,
  Paginated,
  RequestDetail,
  StaffWithStats,
} from "@/lib/types";

export interface SessionPayload {
  user: SessionUser | null;
  settings: Pick<AppSettings, "organisationName" | "autoRefreshSeconds">;
  /** The bootstrap administrator's address, shown on the sign-in screen outside production. */
  devHint: string | null;
}

export interface OverviewData {
  summary: ReportSummary;
  needsAttention: Paginated<CitizenRequest>;
  activity: ReturnType<typeof recentActivity>;
}

export interface RequestListData {
  results: Paginated<CitizenRequest>;
  departments: Department[];
  categories: Category[];
  staff: StaffWithStats[];
}

export interface RequestDetailData {
  request: RequestDetail;
  departments: Department[];
  categories: Category[];
  staff: StaffWithStats[];
}

export interface ReportsData {
  summary: ReportSummary;
}

export interface CategoriesData {
  categories: Category[];
  departments: Department[];
}

export interface DepartmentsData {
  departments: DepartmentWithStats[];
}

export interface NotificationsData {
  results: Paginated<Notification>;
  counts: Record<string, number>;
}

export interface StaffPageData {
  departments: Department[];
  staff: StaffWithStats[];
}

export type UsersData =
  | { forbidden: true }
  | { forbidden: false; users: AppUser[]; departments: Department[] };

export interface SettingsData {
  settings: AppSettings;
  apiKeys: ApiKey[];
  audit: AuditEntry[];
  /** Demo-data tooling only shows outside production. */
  isProduction: boolean;
}
