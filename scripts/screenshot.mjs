// One-off tool to capture clean screenshots of every screen for the
// PowerPoint deck / backup material. Run with `npm run screenshots`
// while the dev server is running (npm run dev).
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "..", "screenshots");
const BASE_URL = process.env.SCREENSHOT_BASE_URL || "http://localhost:3000";

fs.mkdirSync(OUT_DIR, { recursive: true });

const DESKTOP_PAGES = [
  { path: "/login", name: "01-login" },
  { path: "/overview", name: "02-overview" },
  { path: "/requests", name: "03-citizen-requests" },
  { path: "/requests/req-0103", name: "04-request-detail-broken-streetlight" },
  { path: "/complaints", name: "05-complaints" },
  { path: "/departments", name: "06-departments" },
  { path: "/staff", name: "07-staff" },
  { path: "/reports", name: "08-reports" },
  { path: "/notifications", name: "09-notifications" },
  { path: "/settings", name: "10-settings" },
];

const TABLET_PAGES = [
  { path: "/overview", name: "tablet-overview" },
  { path: "/requests", name: "tablet-requests" },
  { path: "/requests/req-0103", name: "tablet-request-detail" },
];

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/overview`);
}

async function main() {
  const browser = await chromium.launch();

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopContext.newPage();

  // Login screen shot first, before we're authenticated.
  await desktopPage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await desktopPage.screenshot({ path: path.join(OUT_DIR, "01-login.png") });

  await login(desktopPage);

  for (const { path: p, name } of DESKTOP_PAGES) {
    if (name === "01-login") continue;
    await desktopPage.goto(`${BASE_URL}${p}`, { waitUntil: "networkidle" });
    await desktopPage.mouse.move(700, 0);
    await desktopPage.waitForTimeout(400);
    await desktopPage.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
    console.log(`Captured ${name}.png`);
  }
  await desktopContext.close();

  const tabletContext = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const tabletPage = await tabletContext.newPage();
  await login(tabletPage);

  for (const { path: p, name } of TABLET_PAGES) {
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
