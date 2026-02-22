export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/exec";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  source: "openclaw" | "system";
  nextRun?: string;
  lastRun?: string;
  payload?: string;
}

function parseOpenClawJobs(): CronJob[] {
  const out = run('openclaw cron list --json 2>/dev/null || echo "{\\"jobs\\":[]}"');
  try {
    const data = JSON.parse(out);
    const jobs = data.jobs || data || [];
    return jobs.map((j: Record<string, unknown>) => ({
      id: j.id || j.jobId || "",
      name: j.name || "Unnamed",
      schedule: j.schedule
        ? typeof j.schedule === "string"
          ? j.schedule
          : (j.schedule as Record<string, unknown>).expr ||
            (j.schedule as Record<string, unknown>).kind ||
            JSON.stringify(j.schedule)
        : "unknown",
      enabled: j.enabled !== false,
      source: "openclaw" as const,
      nextRun: j.state
        ? new Date(
            (j.state as Record<string, unknown>).nextRunAtMs as number
          ).toISOString()
        : undefined,
      payload:
        j.payload && (j.payload as Record<string, unknown>).text
          ? String((j.payload as Record<string, unknown>).text)
          : j.payload && (j.payload as Record<string, unknown>).message
            ? String((j.payload as Record<string, unknown>).message)
            : undefined,
    }));
  } catch {
    return [];
  }
}

function parseSystemCrontab(): CronJob[] {
  const out = run("crontab -l 2>/dev/null");
  if (!out) return [];
  return out
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line, i) => {
      const parts = line.trim().split(/\s+/);
      const schedule = parts.slice(0, 5).join(" ");
      const command = parts.slice(5).join(" ");
      // Derive a friendly name from the command
      let name = command;
      const scriptMatch = command.match(/\/([^/\s]+\.py|[^/\s]+\.sh)/);
      if (scriptMatch) name = scriptMatch[1];
      return {
        id: `system-${i}`,
        name,
        schedule,
        enabled: true,
        source: "system" as const,
        payload: command,
      };
    });
}

export async function GET() {
  const openclawJobs = parseOpenClawJobs();
  const systemJobs = parseSystemCrontab();
  return NextResponse.json([...openclawJobs, ...systemJobs]);
}

export async function POST(req: NextRequest) {
  const { action, id } = await req.json();

  // System crontab jobs can't be managed via this API (yet)
  if (typeof id === "string" && id.startsWith("system-")) {
    return NextResponse.json(
      { error: "System crontab jobs must be managed via `crontab -e`" },
      { status: 400 }
    );
  }

  let result = "";
  switch (action) {
    case "enable":
      result = run(`openclaw cron enable ${id}`);
      break;
    case "disable":
      result = run(`openclaw cron disable ${id}`);
      break;
    case "run":
      result = run(`openclaw cron run ${id}`);
      break;
    case "remove":
      result = run(`openclaw cron remove ${id}`);
      break;
    default:
      return NextResponse.json(
        { error: "Unknown action" },
        { status: 400 }
      );
  }
  return NextResponse.json({ ok: true, output: result });
}
