// One-off tool to capture clean screenshots of every screen for the
// PowerPoint deck / backup material. Run with `npm run screenshots`
// while the server is running (npm run dev or npm run build && npm run start).
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "..", "screenshots");
const BASE_URL = process.env.SCREENSHOT_BASE_URL || "http://localhost:3000";
const EMAIL = process.env.ADMIN_EMAIL || "admin@mobitouch.demo";
const PASSWORD = process.env.ADMIN_PASSWORD || "Demo@2026";

fs.mkdirSync(OUT_DIR, { recursive: true });

const STATIC_PAGES = [
  { path: "/overview", name: "02-overview" },
  { path: "/requests", name: "03-citizen-requests" },
  { path: "/complaints", name: "05-complaints" },
  { path: "/departments", name: "06-departments" },
  { path: "/staff", name: "07-staff" },
  { path: "/categories", name: "08-categories" },
  { path: "/users", name: "09-users" },
  { path: "/reports", name: "10-reports" },
  { path: "/notifications", name: "11-notifications" },
  { path: "/settings", name: "12-settings" },
];

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/overview`);
}

/** Follows the first row in Citizen Requests so the detail screenshot always uses a real id. */
async function findFirstRequestUrl(page) {
  await page.goto(`${BASE_URL}/requests`, { waitUntil: "networkidle" });
  const link = page.locator('a[href^="/requests/req-"]').first();
  const href = await link.getAttribute("href").catch(() => null);
  return href ? `${BASE_URL}${href}` : null;
}

async function main() {
  const browser = await chromium.launch();

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopContext.newPage();

  // Sign-in screen first, before authenticating.
  await desktopPage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await desktopPage.screenshot({ path: path.join(OUT_DIR, "01-login.png") });

  await login(desktopPage);

  for (const { path: p, name } of STATIC_PAGES) {
    await desktopPage.goto(`${BASE_URL}${p}`, { waitUntil: "networkidle" });
    await desktopPage.mouse.move(700, 0);
    await desktopPage.waitForTimeout(400);
    await desktopPage.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
    console.log(`Captured ${name}.png`);
  }

  const requestUrl = await findFirstRequestUrl(desktopPage);
  if (requestUrl) {
    await desktopPage.goto(requestUrl, { waitUntil: "networkidle" });
    await desktopPage.waitForTimeout(400);
    await desktopPage.screenshot({
      path: path.join(OUT_DIR, "04-request-detail.png"),
      fullPage: true,
    });
    console.log("Captured 04-request-detail.png");
  } else {
    console.warn("No requests found — skipped the request detail screenshot. Run `npm run seed` first.");
  }

  await desktopContext.close();

  const tabletContext = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const tabletPage = await tabletContext.newPage();
  await login(tabletPage);

  const tabletTargets = [{ path: "/overview", name: "tablet-overview" }, { path: "/requests", name: "tablet-requests" }];
  for (const { path: p, name } of tabletTargets) {
    await tabletPage.goto(`${BASE_URL}${p}`, { waitUntil: "networkidle" });
    await tabletPage.mouse.move(700, 0);
    await tabletPage.waitForTimeout(400);
    await tabletPage.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
    console.log(`Captured ${name}.png`);
  }
  await tabletContext.close();

  await browser.close();
  console.log(`\nAll screenshots saved to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
