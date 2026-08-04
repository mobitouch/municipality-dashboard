import { redirect } from "next/navigation";
import { Landmark } from "lucide-react";
import type { Metadata } from "next";

import { ChangePasswordForm } from "./change-password-form";
import { getCurrentUser } from "@/lib/auth/dal";
import { getSettings } from "@/lib/data/settings";

export const metadata: Metadata = { title: "Choose a new password" };

/**
 * Sits outside the (dashboard) route group deliberately — that layout
 * redirects here whenever mustChangePassword is set, so nesting this page
 * under it would loop. A signed-in user with nothing left to change is
 * sent straight to the dashboard instead of seeing this screen.
 */
export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.mustChangePassword) redirect("/overview");

  const settings = getSettings();

  return (
    <div className="from-sidebar to-primary flex flex-1 items-center justify-center bg-gradient-to-br via-[oklch(0.32_0.03_130)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center text-white">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Landmark className="size-7" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{settings.organisationName}</h1>
          <p className="mt-1 text-sm text-white/70">Choose a new password to continue</p>
        </div>

        <div className="bg-card rounded-2xl border p-6 shadow-xl sm:p-8">
          <p className="text-muted-foreground mb-5 text-sm">
            An administrator set a temporary password for your account. Enter it once more
            below, along with the password you&apos;d like to use from now on.
          </p>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
