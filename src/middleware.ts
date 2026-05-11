import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const DEFAULT_AUTH_SECRET = "apexcare-dev-secret-change-me-in-production-please-32chars+";
const PUBLIC_PATHS = [
  "/login",
  "/landing",
  "/portal",
  "/api/auth/login",
  "/api/portal/auth/login",
  "/api/portal/auth/logout",
  "/api/admin/config/public",
  "/_next",
  "/favicon.ico",
];

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? DEFAULT_AUTH_SECRET;
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.match(/\.(?:png|jpg|jpeg|svg|ico|gif|webp|woff2?|css|js|map)$/)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("apexcare_session")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const res = NextResponse.redirect(url);
    res.cookies.delete("apexcare_session");
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
