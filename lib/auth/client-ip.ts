import { headerValue, requestContext } from "./request-context";

/**
 * Number of reverse proxies in front of this app that *append* to
 * `x-forwarded-for`. 1 for Hostinger's edge proxy alone; 2 with a CDN in
 * front as well.
 */
const TRUSTED_PROXY_HOPS = (() => {
  const raw = Number(process.env.TRUSTED_PROXY_HOPS);
  return Number.isInteger(raw) && raw >= 0 && raw <= 8 ? raw : 1;
})();

const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;

function isIpish(value: string): boolean {
  if (!value || value.length > 45) return false;
  if (IPV4.test(value)) return value.split(".").every((part) => Number(part) <= 255);
  return value.includes(":") && /^[0-9a-fA-F:.]+$/.test(value);
}

/**
 * Best-effort client IP, used only as a throttling bucket.
 *
 * `x-forwarded-for` is client-writable: whatever the browser sends arrives
 * *before* what the proxies append, so reading the leftmost entry would let an
 * attacker rotate a fake value per request and never trip the limit. Counting
 * in from the right, past the hops we actually trust, yields a value a proxy
 * wrote. Callers that get `unknown` share one bucket, which is deliberately
 * the strictest outcome rather than an exemption.
 */
export function getClientIp(): string {
  const { req } = requestContext();

  const override = process.env.CLIENT_IP_HEADER;
  if (override) {
    const value = headerValue(req, override)?.trim();
    return value && isIpish(value) ? value : "unknown";
  }

  const forwarded = headerValue(req, "x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .map((part) => part.replace(/^\[(.+)\]:\d+$/, "$1").replace(/^(\d[\d.]+):\d+$/, "$1"))
      .filter(Boolean);

    const candidate = parts[parts.length - TRUSTED_PROXY_HOPS] ?? parts[parts.length - 1];
    if (candidate && isIpish(candidate)) return candidate;
  }

  const realIp = headerValue(req, "x-real-ip")?.trim();
  if (realIp && isIpish(realIp)) return realIp;

  return "unknown";
}
