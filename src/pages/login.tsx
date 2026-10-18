import { Navigate } from "react-router";
import { Landmark } from "lucide-react";

import { LoginForm } from "./login-form";
import { useSession } from "@/lib/client/session";
import { useDocumentTitle } from "@/lib/client/use-document-title";

export function LoginPage() {
  useDocumentTitle("Sign in");
  const { loading, session } = useSession();

  if (loading) return null;
  if (session?.user) return <Navigate to="/overview" replace />;

  const organisationName = session?.settings.organisationName ?? "";
  const devHint = session?.devHint;

  return (
    <div className="from-sidebar to-primary flex flex-1 items-center justify-center bg-gradient-to-br via-[oklch(0.32_0.03_130)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center text-white">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Landmark className="size-7" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{organisationName}</h1>
          <p className="mt-1 text-sm text-white/70">Staff Dashboard</p>
        </div>

        <div className="bg-card rounded-2xl border p-6 shadow-xl sm:p-8">
          <LoginForm />
        </div>

        {devHint && (
          <p className="mt-4 text-center text-xs text-white/60">
            Development build — the bootstrap administrator is {devHint}
          </p>
        )}
      </div>
    </div>
  );
}
