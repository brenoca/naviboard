import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Allow API routes for login and static assets
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) return NextResponse.next();

  // Check for token in query param (auto-login via link)
  const tokenParam = searchParams.get("token");
  if (tokenParam === secret) {
    const url = request.nextUrl.clone();
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
  if (cookie?.value === secret) {
    return NextResponse.next();
  }

  // Allow login page — but check for token param first
  if (pathname === "/login") {
    if (tokenParam === secret) {
      const url = request.nextUrl.clone();
      url.pathname = "/brain";
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
    return NextResponse.next();
  }

  // Redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
