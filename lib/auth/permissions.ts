import type { UserRole } from "@/lib/types";

export const PERMISSIONS = [
  "requests:view",
  "requests:create",
  "requests:update",
  "requests:assign",
  "requests:delete",
  "departments:view",
  "departments:manage",
  "staff:view",
  "staff:manage",
  "categories:view",
  "categories:manage",
  "users:manage",
  "settings:manage",
  "reports:view",
  "reports:export",
  "notifications:view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Role → permission matrix. Staff work the queue; supervisors additionally
 * own their people and the request lifecycle end to end; administrators
 * also control accounts, taxonomy, and integration settings.
 */
const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  staff: [
    "requests:view",
    "requests:create",
    "requests:update",
    "departments:view",
    "staff:view",
    "categories:view",
    "reports:view",
    "notifications:view",
  ],
  supervisor: [
    "requests:view",
    "requests:create",
    "requests:update",
    "requests:assign",
    "requests:delete",
    "departments:view",
    "staff:view",
    "staff:manage",
    "categories:view",
    "reports:view",
    "reports:export",
    "notifications:view",
  ],
  admin: [...PERMISSIONS],
};

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsFor(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
