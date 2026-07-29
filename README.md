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

## Chatbot / n8n Integration

The dashboard exposes a real endpoint that an n8n workflow (or a chatbot backend)
can call to create a new request — this is the "way for n8n to add a request"
called for in the plan:

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
inferred from `category`), tagged with source "chatbot". The same demo API key is
shown on the **Settings** page. `category` must match one of the categories in
`lib/constants.ts`.

Internal dashboard actions (viewing/updating requests) are authenticated by the
staff session cookie set at login; the `x-api-key` header is only needed for
external callers like n8n that don't have that session.

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
