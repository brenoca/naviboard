export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { run } from "@/lib/exec";

interface Skill {
  name: string;
  emoji: string;
  description: string;
  source: string;
  status: "ready" | "missing";
  missing?: { bins?: string[]; anyBins?: string[]; env?: string[]; config?: string[]; os?: string[] };
  homepage?: string;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("search");
  if (query) {
    const out = run(`npx clawhub search "${query}" 2>/dev/null || echo ""`);
    return NextResponse.json({ results: out });
  }

  const out = run("openclaw skills list --json 2>/dev/null");
  try {
    const data = JSON.parse(out);
    const skills: Skill[] = (data.skills || []).map(
      (s: Record<string, unknown>) => {
        const missingData = s.missing as Record<string, string[]> | undefined;
        const hasMissing =
          missingData &&
          Object.values(missingData).some(
            (v) => Array.isArray(v) && v.length > 0
          );
        return {
          name: s.name || "",
          emoji: s.emoji || "📦",
          description: s.description || "",
          source: s.source || "unknown",
          status: hasMissing ? "missing" : "ready",
          missing: hasMissing ? missingData : undefined,
          homepage: s.homepage || undefined,
        };
      }
    );
    return NextResponse.json({ skills });
  } catch {
    return NextResponse.json({ skills: [] });
  }
}

export async function POST(req: NextRequest) {
  const { action, name } = await req.json();
  let result = "";
  switch (action) {
    case "install":
      result = run(`npx clawhub install ${name} 2>&1`);
      break;
    case "uninstall":
      result = run(`npx clawhub uninstall ${name} 2>&1`);
      break;
    default:
      return NextResponse.json(
        { error: "Unknown action" },
        { status: 400 }
      );
  }
  return NextResponse.json({ ok: true, output: result });
}
