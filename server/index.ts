import "./load-env";

import fs from "node:fs";
import path from "node:path";

import express, { type ErrorRequestHandler } from "express";

import { ensureBootstrapped } from "@/lib/db/bootstrap";
import { env } from "@/lib/env";
import { createApiRouter } from "./routes/api";
import { createAppRouter } from "./routes/app";
import { applySecurityHeaders } from "./security-headers";

const CLIENT_DIR = path.join(process.cwd(), "dist", "client");

/**
 * Express serves two things from one process: the JSON API under `/api`, and
 * — in production — the built React app, with every non-file URL falling
 * back to `index.html` so client-side routes survive a refresh. In
 * development Vite serves the app and proxies `/api` here.
 */
function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(applySecurityHeaders);

  // The dashboard's own endpoints first, then the public integration API.
  app.use("/api/app", createAppRouter());
  app.use("/api", createApiRouter());
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  if (fs.existsSync(path.join(CLIENT_DIR, "index.html"))) {
    app.use(
      express.static(CLIENT_DIR, {
        index: false,
        setHeaders(res, filePath) {
          // Vite fingerprints everything under /assets, so it never changes.
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        },
      })
    );

    app.get("/{*splat}", (req, res, next) => {
      // A missing file (a stale /assets hash, a favicon) should 404, not
      // silently return the app shell.
      if (path.extname(req.path)) return next();
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(path.join(CLIENT_DIR, "index.html"));
    });
  }

  const onError: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);

    // Malformed JSON on the intake endpoints keeps its original message.
    if (error?.type === "entity.parse.failed") {
      res.status(400).json({ error: "Expected a JSON body." });
      return;
    }
    if (error?.type === "entity.too.large") {
      res.status(413).json({ error: "Request body too large." });
      return;
    }

    console.error("[server]", error);
    res.status(500).json({ error: "Internal Server Error" });
  };
  app.use(onError);

  return app;
}

async function main() {
  // The schema is migrated and first-boot data created before the first
  // request is served, so no request ever races an unmigrated database.
  await ensureBootstrapped();

  // Hosts hand the port over as PORT. In development that variable may belong
  // to the front-end dev server, so the API has its own (API_PORT), which
  // vite.config.ts proxies to.
  const port = env.isProduction
    ? Number(process.env.PORT) || 3000
    : Number(process.env.API_PORT) || 3000;
  const server = createApp().listen(port, () => {
    console.info(`[server] Listening on http://localhost:${port}`);
  });

  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
