import { Navigate, Outlet, useLocation } from "react-router";

import { PageSkeleton } from "@/components/app-shell/page-skeleton";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { useSession } from "@/lib/client/session";
import { ErrorBoundary } from "./error-boundary";

/**
 * The authenticated shell: sidebar plus the screen outlet. Anonymous
 * visitors are sent to the sign-in screen and anyone holding an admin-issued
 * temporary password to the change-password screen — the same gates the
 * server-side proxy and layout used to apply. This is a convenience only;
 * every endpoint re-checks the session itself.
 */
export function DashboardLayout() {
  const { loading, session } = useSession();
  const { pathname, search } = useLocation();

  if (loading) {
    return (
      <div className="flex h-dvh w-full overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  const user = session?.user;
  if (!user) {
    const next = pathname === "/" ? "" : `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return <Navigate to={`/login${next}`} replace />;
  }
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <aside className="hidden w-60 shrink-0 md:block">
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </div>
    </div>
  );
}
