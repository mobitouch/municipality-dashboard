import * as React from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";

import { PageSkeleton } from "@/components/app-shell/page-skeleton";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { setNavigator } from "@/lib/client/navigation";
import { SessionProvider } from "@/lib/client/session";
import { DashboardLayout } from "@/src/layouts/dashboard-layout";
import { CategoriesPage } from "@/src/pages/categories";
import { ChangePasswordPage } from "@/src/pages/change-password";
import { DepartmentsPage } from "@/src/pages/departments";
import { LoginPage } from "@/src/pages/login";
import { NotFoundPage } from "@/src/pages/not-found";
import { NotificationsPage } from "@/src/pages/notifications";
import { RequestDetailPage } from "@/src/pages/request-detail";
import { RequestListPage } from "@/src/pages/request-list";
import { SettingsPage } from "@/src/pages/settings";
import { StaffPage } from "@/src/pages/staff";
import { UsersPage } from "@/src/pages/users";

// The two chart screens pull in Recharts, by far the heaviest dependency, so
// they load on demand instead of bloating the first paint of every screen.
const OverviewPage = React.lazy(() =>
  import("@/src/pages/overview").then((module) => ({ default: module.OverviewPage }))
);
const ReportsPage = React.lazy(() =>
  import("@/src/pages/reports").then((module) => ({ default: module.ReportsPage }))
);

/** Lets non-component code (the form actions) navigate with the router. */
function NavigationBridge() {
  const navigate = useNavigate();
  React.useEffect(() => {
    setNavigator((to) => void navigate(to));
    return () => setNavigator(null);
  }, [navigate]);
  return null;
}

export function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <NavigationBridge />
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          <Route element={<DashboardLayout />}>
            <Route
              path="/overview"
              element={
                <React.Suspense fallback={<PageSkeleton />}>
                  <OverviewPage />
                </React.Suspense>
              }
            />

            <Route
              path="/requests"
              element={
                <RequestListPage
                  kind="request"
                  basePath="/requests"
                  title="Citizen Requests"
                  subtitle="Service requests raised by residents."
                />
              }
            />
            <Route path="/requests/:id" element={<RequestDetailPage kind="request" />} />

            <Route
              path="/complaints"
              element={
                <RequestListPage
                  kind="complaint"
                  basePath="/complaints"
                  title="Complaints"
                  subtitle="Issues residents have reported for the municipality to address."
                />
              }
            />
            <Route path="/complaints/:id" element={<RequestDetailPage kind="complaint" />} />

            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route
              path="/reports"
              element={
                <React.Suspense fallback={<PageSkeleton />}>
                  <ReportsPage />
                </React.Suspense>
              }
            />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        <Toaster />
      </SessionProvider>
    </ThemeProvider>
  );
}
