export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { run } from "@/lib/exec";

export async function GET() {
  const out = run('openclaw sessions list --json 2>/dev/null || echo "[]"');
  try {
    return NextResponse.json(JSON.parse(out));
  } catch {
    return NextResponse.json([]);
  }
}
