import { redirect } from "next/navigation";
import { Landmark } from "lucide-react";
import type { Metadata } from "next";

import { LoginForm } from "./login-form";
import { getCurrentUser } from "@/lib/auth/dal";
import { getSettings } from "@/lib/data/settings";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/overview");

  const settings = getSettings();

  return (
    <div className="from-sidebar to-primary flex flex-1 items-center justify-center bg-gradient-to-br via-[oklch(0.32_0.03_130)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center text-white">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Landmark className="size-7" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{settings.organisationName}</h1>
          <p className="mt-1 text-sm text-white/70">Staff Dashboard</p>
        </div>

        <div className="bg-card rounded-2xl border p-6 shadow-xl sm:p-8">
          <LoginForm />
        </div>

        {!env.isProduction && (
          <p className="mt-4 text-center text-xs text-white/60">
            Development build — the bootstrap administrator is {env.ADMIN_EMAIL}
          </p>
        )}
      </div>
    </div>
  );
}
