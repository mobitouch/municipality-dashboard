import type { Metadata } from "next";

import { PageShell } from "@/components/app-shell/page-shell";
import { ApiKeysPanel } from "@/components/settings/api-keys-panel";
import { PasswordForm, ProfileForm } from "@/components/settings/profile-forms";
import { ResetDemoDataButton } from "@/components/settings/reset-demo-data-button";
import { SystemSettingsForm } from "@/components/settings/system-settings-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listApiKeys } from "@/lib/auth/api-key";
import { requireUser } from "@/lib/auth/dal";
import { can } from "@/lib/auth/permissions";
import { listAudit } from "@/lib/data/audit";
import { getSettings } from "@/lib/data/settings";
import { env } from "@/lib/env";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/constants";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const canManageSettings = can(user.role, "settings:manage");
  const settings = getSettings();
  const apiKeys = canManageSettings ? listApiKeys() : [];
  const audit = canManageSettings ? listAudit(15) : [];

  return (
    <PageShell title="Settings" subtitle="Your account, and how the dashboard behaves">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Your profile</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
              {ROLE_DESCRIPTIONS[user.role]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm name={user.name} email={user.email} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Password</CardTitle>
            <CardDescription>
              Changing your password signs out every other device using this account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>

        {canManageSettings && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">System</CardTitle>
              <CardDescription>Applies to everyone using this dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <SystemSettingsForm settings={settings} />
            </CardContent>
          </Card>
        )}

        {canManageSettings && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Integration keys</CardTitle>
              <CardDescription>
                For the municipal website&apos;s forms and the n8n chatbot workflow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiKeysPanel apiKeys={apiKeys} />
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Submitting requests from outside</CardTitle>
            <CardDescription>
              The endpoint the website and chatbot post to. Categories must match one on the
              Categories screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted overflow-x-auto rounded-lg p-3 font-mono text-xs">
              {`POST /api/requests
Content-Type: application/json
x-api-key: <your key>

{
  "citizenName": "Rami Sfeir",
  "phone":       "+961 3 555 777",
  "email":       "rami@example.com",
  "category":    "Waste Collection",
  "location":    "Achrafieh, Sassine Square",
  "description": "Bins have not been collected in over a week.",
  "priority":    "High",
  "source":      "website"
}`}
            </pre>
            <p className="text-muted-foreground mt-3 text-xs">
              Responds <code className="font-mono">201</code> with the created request, including
              its reference number. Omitting <code className="font-mono">source</code> tags the
              submission as <code className="font-mono">chatbot</code>. A confirmation
              notification to the citizen is recorded automatically.
            </p>
          </CardContent>
        </Card>

        {canManageSettings && !env.isProduction && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Demo data</CardTitle>
              <CardDescription>
                Only available outside production. Restores the sample requests to their original
                state — useful before a rehearsal or a fresh walkthrough.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResetDemoDataButton />
            </CardContent>
          </Card>
        )}

        {canManageSettings && audit.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Recent administrative activity</CardTitle>
              <CardDescription>
                Changes to departments, staff, categories, accounts, and keys.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {audit.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap gap-x-2 py-2">
                    <span className="font-medium">{entry.actorName}</span>
                    <span className="text-muted-foreground">{entry.action}</span>
                    {entry.detail && <span className="text-muted-foreground">— {entry.detail}</span>}
                    <span className="text-muted-foreground ml-auto text-xs">
                      {formatRelative(entry.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
