import { DEMO_CREDENTIALS, N8N_API_KEY } from "@/lib/constants";
import PageShell from "@/components/PageShell";
import ResetDemoDataButton from "@/components/ResetDemoDataButton";

export default function SettingsPage() {
  return (
    <PageShell title="Settings" subtitle="Account, notification, and integration settings">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Profile</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-800">Admin User</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-medium text-slate-800">Municipal Staff (Administrator)</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Username</dt>
              <dd className="font-medium text-slate-800">{DEMO_CREDENTIALS.username}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Notification Channels</h3>
          <div className="space-y-3 text-sm">
            {["Email confirmations to citizens", "SMS status updates to citizens", "Internal staff alerts for urgent requests"].map(
              (label) => (
                <label key={label} className="flex items-center justify-between">
                  <span className="text-slate-700">{label}</span>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                </label>
              )
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-1 text-sm font-semibold text-slate-800">Chatbot / n8n Integration</h3>
          <p className="mb-3 text-xs text-slate-500">
            n8n (or any external workflow) can create a new request by sending a POST request here.
          </p>
          <div className="space-y-2 rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
            <div>POST /api/requests</div>
            <div>Header: x-api-key: {N8N_API_KEY}</div>
            <div>{`Body: { "citizenName", "phone", "category", "location", "description", "priority" }`}</div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-1 text-sm font-semibold text-slate-800">Demo Data</h3>
          <p className="mb-3 text-xs text-slate-500">
            Restore the original sample requests, departments, staff, and notifications — useful before each
            rehearsal or the live demo.
          </p>
          <ResetDemoDataButton />
        </section>
      </div>
    </PageShell>
  );
}
