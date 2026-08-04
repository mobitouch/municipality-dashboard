# MobiTouch Municipality — Staff Dashboard (Demo)

This is Charbel's piece of the MobiTouch Municipality proposal (see `../prompt.txt`): a
functional, realistic demo of the municipal staff dashboard for managing citizen
requests and complaints. It's built to be presented live, not a production system.

## Quick Start

```bash
npm install
npm run seed      # (re)generate demo data — safe to run any time
npm run dev
```

Open http://localhost:3000 and sign in — the login screen has the demo credentials
pre-filled, just click **Sign in**.

- **Username:** `admin@mobitouch.demo`
- **Password:** `Demo@2026`

For the actual live presentation, prefer a production build — it's faster, more
stable, and has no dev-mode UI:

```bash
npm run build
npm run start
```

## Environment Variables

Optional — copy `.env.example` to `.env.local` to override the demo defaults:

| Variable | Description |
|---|---|
| `API_KEY` | Shared secret external callers (website, n8n) send as `x-api-key`. Defaults to `mobitouch-demo-key`. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Staff login. Defaults to `admin@mobitouch.demo` / `Demo@2026`. |

Nothing breaks if these are left unset — the app runs with the same demo values as before.

## Resetting Demo Data

Any status change, assignment, or note made during a rehearsal is saved to
`data/db.json`. To restore the original sample data before the next run-through:

- Click **Reset Demo Data** on the **Settings** page, or
- Run `npm run seed` from the terminal.

## Demo Script (matches the team presentation flow)

1. Open **Overview** — point out total requests, urgent count, and average
   resolution time.
2. Open **Citizen Requests** and click the newest one — **"REQ-2026-0020" / Wissam
   Tannous / Street Lighting / Corniche Road** — the broken streetlight request
   (submitted "via chatbot", status **New**, priority **Urgent**, unassigned).
3. Assign **Department → Public Works**, then **Assigned Employee → Rania Haddad**.
4. Change **Status → In Progress**.
5. Add an internal note, e.g. "Crew dispatched, replacement bulb scheduled."
6. Go to **Reports** and show the numbers/urgent-unresolved list update to match.
7. Mention that Wissam Tannous receives an automatic notification at each step —
   see the **Notifications** page for what the citizen would have received.

## Website, Chatbot / n8n Integration

The dashboard exposes a real endpoint that external callers use to create a new
request — the live municipal website's Contact and Report an Issue forms POST
here directly (server-to-server, from the website's own API routes), and it's
also the "way for n8n to add a request" called for in the plan:

```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "x-api-key: mobitouch-demo-key" \
  -d '{
    "citizenName": "Rami Sfeir",
    "phone": "+961 3 555 777",
    "category": "Waste Collection",
    "location": "Achrafieh, Sassine Square",
    "description": "Overflowing bins near the square, not collected in over a week.",
    "priority": "High"
  }'
```

It appears instantly in **Citizen Requests** or **Complaints** (the `kind` is
inferred from `category`), tagged with source "chatbot" by default — pass an
explicit `"source": "website"` (as the live website's forms do) to tag it
correctly instead. The same demo API key is shown on the **Settings** page.
`category` must match one of the categories in `lib/constants.ts`; two were
added specifically for the website integration: `Health & Environment` and
`General Inquiry` (the latter also covers the website's general Contact form,
which has no natural category of its own).

A matching confirmation `Notification` row is created automatically for every
new request, live ones included — visible on the **Notifications** page.

Internal dashboard actions (viewing/updating requests) are authenticated by the
staff session cookie set at login; the `x-api-key` header is only needed for
external callers like n8n or the website that don't have that session. Set the
`API_KEY` env var (see `.env.example`) so the key isn't just the checked-in
demo value once this app is reachable from the public website — the website
needs the same value in its own `DASHBOARD_API_KEY`.

Requests/Complaints/Overview/Notifications poll every 8s (`components/AutoRefresh.tsx`)
so anything posted here shows up without a manual reload — useful both for the
live n8n/website demo and for daily use.

## What's Real vs. What's a Placeholder

- **Departments and categories** (Public Works, Sanitation, Water & Sewage, etc.)
  are realistic placeholders — the plan calls for confirming these with
  Jean-Jacques. Edit the list in `lib/constants.ts` (categories) and
  `scripts/seed.mjs` (departments/staff), then run `npm run seed`.
- **Data storage** is a local JSON file (`data/db.json`), not a database — by
  design, per the 3-day scope. It's read/written through `lib/db.ts`.
- **Login** is a single hardcoded demo account, not real auth — intentional for a
  sales demo.
- **Attached images** are placeholder illustrations (`public/demo/*.svg`), standing
  in for citizen-submitted photos.

## Screenshots

`npm run screenshots` (with the dev or production server already running) captures
every screen — desktop and tablet — into `../screenshots/`, ready to drop into the
PowerPoint deck. Set `SCREENSHOT_BASE_URL` if the server isn't on port 3000, e.g.:

```bash
SCREENSHOT_BASE_URL=http://localhost:4300 npm run screenshots
```

## Project Structure

- `app/(dashboard)/*` — the 8 dashboard screens (Overview, Citizen Requests,
  Complaints, Departments, Staff, Reports, Notifications, Settings), each a
  server component reading `data/db.json` directly.
- `app/api/*` — REST endpoints backing both the dashboard's own UI and the n8n
  integration.
- `components/` — shared UI (sidebar, tables, filters, charts, request detail
  actions).
- `lib/` — types, constants, the JSON "database" helpers, and report aggregation.
- `scripts/seed.mjs` — generates the demo dataset; also imported directly by the
  Settings page's reset button.
- `proxy.ts` — gates every dashboard route behind the login session.
