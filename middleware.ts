import { NextRequest, NextResponse } from "next/server";

/**
 * Beschermt /juristen routes met een simpele cookie-gebaseerde auth.
 * Wachtwoord wordt ingesteld via env var JURISTEN_PASSWORD.
 *
 * Flow:
 *   1. Geen cookie → redirect naar /juristen/login
 *   2. Cookie aanwezig maar verkeerd → redirect naar /juristen/login
 *   3. Cookie geldig → door
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Alleen /juristen routes beschermen (niet /juristen/login zelf)
  if (pathname.startsWith("/juristen") && !pathname.startsWith("/juristen/login")) {
    const token = req.cookies.get("juristen_auth")?.value;
    const expected = process.env.JURISTEN_PASSWORD;

    if (!token || token !== expected) {
      const loginUrl = new URL("/juristen/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/juristen/:path*"],
};
