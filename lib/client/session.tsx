import * as React from "react";

import type { SessionPayload } from "@/lib/page-data";
import { can, type Permission } from "@/lib/auth/permissions";
import { NAV_ITEMS } from "@/components/app-shell/nav-items";
import { onUnauthorized, useApi } from "./query";

interface SessionContextValue {
  /** True until the first answer from the server. */
  loading: boolean;
  session: SessionPayload | undefined;
}

const SessionContext = React.createContext<SessionContextValue>({
  loading: true,
  session: undefined,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data, loading, refetch } = useApi<SessionPayload>("/api/app/session");

  // A 401 from any screen means the session ended; re-checking it lets the
  // route guard send the visitor to the sign-in screen.
  React.useEffect(() => onUnauthorized(() => void refetch()), [refetch]);

  const value = React.useMemo(() => ({ loading, session: data }), [loading, data]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return React.useContext(SessionContext);
}

/** For screens inside the authenticated layout, where a user always exists. */
export function useCurrentUser() {
  const { session } = useSession();
  if (!session?.user) throw new Error("useCurrentUser called without a signed-in user.");
  return session.user;
}

export function useCan(permission: Permission): boolean {
  const { session } = useSession();
  return session?.user ? can(session.user.role, permission) : false;
}

export function useAllowedHrefs(): string[] {
  const { session } = useSession();
  const role = session?.user?.role;
  return React.useMemo(
    () =>
      role ? NAV_ITEMS.filter((item) => can(role, item.permission)).map((item) => item.href) : [],
    [role]
  );
}
