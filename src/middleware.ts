import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 🛡️ Define your public routes here
const PUBLIC_FILE_EXTENSIONS = [".html", ".css", ".js", ".png", ".jpg", ".svg"];
const PUBLIC_ROUTES = ["/login", "/register", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip middleware for static assets (Robustness-Proof)
  if (PUBLIC_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // 2. Check if the current route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  // 3. Get the token (check both secure and non-secure cookie names)
  const token =
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");

  // 🛡️ If not a public route and no token exists, redirect to login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    // 🛡️ Architecture-Proof: Always carry the callback URL so users return where they started
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 🛡️ Optimized Matcher: Prevents middleware from running on internal Next.js paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
