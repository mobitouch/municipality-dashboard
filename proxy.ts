import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/constants";

/**
 * An optimistic gate only: it checks that a session cookie is *present*
 * and bounces anonymous visitors straight to the sign-in screen, sparing a
 * full render. It deliberately does not validate the session — that needs
 * the database, and the proxy runs on every request including prefetches.
 * Real authorization lives in the Data Access Layer (`lib/auth/dal.ts`),
 * which every page, action, and route handler goes through.
 */
export function proxy(request: NextRequest) {
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname, search } = request.nextUrl;

  if (pathname === "/login") {
    if (hasSessionCookie) {
      return NextResponse.redirect(new URL("/overview", request.url));
    }
    return NextResponse.next();
  }

  if (!hasSessionCookie) {
    const target = new URL("/login", request.url);
    // Remember where they were headed so sign-in can return them there.
    if (pathname !== "/") target.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(target);
  }

  return NextResponse.next();
}

export const config = {
  // API routes authenticate themselves (session *or* integration key), and
  // static assets never need a session.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|demo).*)"],
};
