export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { run } from "@/lib/exec";

export async function GET() {
  // Try to get usage data from openclaw
  const statusOut = run("openclaw status --json 2>/dev/null || echo '{}'");
  const sessionsOut = run('openclaw sessions list --json 2>/dev/null || echo "[]"');

  let status = {};
  let sessions: Record<string, unknown>[] = [];
  try { status = JSON.parse(statusOut) || {}; } catch {}
  try { const parsed = JSON.parse(sessionsOut); sessions = Array.isArray(parsed) ? parsed : []; } catch {}

  // Aggregate model usage from sessions
  const modelUsage: Record<string, { requests: number; tokensIn: number; tokensOut: number }> = {};
  for (const s of sessions) {
    const model = (s.model || s.defaultModel || "unknown") as string;
    if (!modelUsage[model]) modelUsage[model] = { requests: 0, tokensIn: 0, tokensOut: 0 };
    modelUsage[model].requests += ((s.messageCount || s.messages || 0) as number);
    modelUsage[model].tokensIn += ((s.tokensIn || s.inputTokens || 0) as number);
    modelUsage[model].tokensOut += ((s.tokensOut || s.outputTokens || 0) as number);
  }

  return NextResponse.json({ status, sessions: sessions.length, modelUsage });
}
