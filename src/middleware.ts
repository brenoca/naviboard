import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Allow API routes, static assets, and public files (images, icons)
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next();
  }

  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) return NextResponse.next();

  // Check for token in query param (auto-login via link)
  const tokenParam = searchParams.get("token");
  if (tokenParam === secret) {
    const url = request.nextUrl.clone();
    url.pathname = "/chat";
    url.searchParams.delete("token");
    const response = NextResponse.redirect(url);
    response.cookies.set("navi_auth", secret, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  }

  // Check cookie
  const cookie = request.cookies.get("navi_auth");
  const isAuthed = cookie?.value === secret;

  // Authenticated: redirect root to /chat, allow everything else
  if (isAuthed) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/chat", request.url));
    }
    return NextResponse.next();
  }

  // Not authenticated: allow login page, redirect everything else
  if (pathname === "/login") {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
