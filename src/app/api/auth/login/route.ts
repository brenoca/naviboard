import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("navi_auth", secret, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
