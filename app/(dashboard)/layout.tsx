import { redirect } from "next/navigation";

import { allowedNavHrefs } from "@/components/app-shell/page-shell";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { requireUser } from "@/lib/auth/dal";
import { getSettings } from "@/lib/data/settings";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Authenticate once at the layout boundary; nested pages re-check through
  // the same memoized DAL call, so this costs one query per request.
  const user = await requireUser();

  // An admin-issued temporary password is not optional to change — every
  // dashboard screen is gated here rather than trusting each page to check.
  if (user.mustChangePassword) redirect("/change-password");

  const settings = getSettings();
  const hrefs = await allowedNavHrefs();

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <aside className="hidden w-60 shrink-0 md:block">
        <SidebarNav allowedHrefs={hrefs} organisationName={settings.organisationName} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
