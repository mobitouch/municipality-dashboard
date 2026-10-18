import type { RequestHandler } from "express";

import { env } from "@/lib/env";

const isDev = !env.isProduction;

/**
 * Content Security Policy for the staff dashboard.
 *
 * `script-src` keeps `'unsafe-inline'`: the theme-init script in
 * `index.html` must run before first paint to avoid a flash of the wrong
 * colour scheme. A nonce would mean templating the HTML per request, which is
 * the wrong trade for a small SQLite-backed app. The directives that actually
 * contain a compromise — `object-src`, `base-uri`, `form-action`,
 * `frame-ancestors` — are strict.
 *
 * `img-src` allows https and data: because request records can carry a
 * citizen attachment URL; `lib/validation.ts` already restricts those to
 * https or a site-relative path.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  // The dashboard is never legitimately embedded anywhere. Without this, an
  // attacker can frame it and trick a signed-in administrator into clicking
  // through destructive actions.
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders: Record<string, string> = {
  "Content-Security-Policy": csp,
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Cross-Origin-Opener-Policy": "same-origin",
  // Citizens' personal details are on these screens; a referrer should
  // never carry a request id or filter to a third-party site.
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()",
};

export const applySecurityHeaders: RequestHandler = (_req, res, next) => {
  for (const [key, value] of Object.entries(securityHeaders)) res.setHeader(key, value);
  next();
};
