import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy for the staff dashboard.
 *
 * `script-src` keeps `'unsafe-inline'`: the theme-init script in
 * `app/layout.tsx` must run before first paint to avoid a flash of the wrong
 * colour scheme, and Next inlines its own hydration payload. A nonce would
 * mean generating one per request in the proxy, which is the wrong trade for
 * a small SQLite-backed app. The directives that actually contain a
 * compromise — `object-src`, `base-uri`, `form-action`, `frame-ancestors` —
 * are strict.
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

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    // Citizens' personal details are on these screens; a referrer should
    // never carry a request id or filter to a third-party site.
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Nothing this app serves from /api is cacheable — every response is
        // either a mutation result or scoped to one staff member's session.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
