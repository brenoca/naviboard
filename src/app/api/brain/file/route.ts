export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE = "/home/ubuntu/.openclaw/workspace";
const SESSIONS_DIR = "/home/ubuntu/.openclaw/agents/main/sessions";

function safePath(p: string): string | null {
  // Handle session files
  if (p.startsWith("sessions/")) {
    const resolved = path.resolve(SESSIONS_DIR, p.replace("sessions/", ""));
    if (!resolved.startsWith(SESSIONS_DIR)) return null;
    return resolved;
  }
  const resolved = path.resolve(WORKSPACE, p);
  if (!resolved.startsWith(WORKSPACE)) return null;
  return resolved;
}

function renderSession(raw: string): string {
  const lines = raw.split("\n").filter(Boolean);
  let md = "";
  let sessionDate = "";

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);

      if (entry.type === "session" && entry.timestamp) {
        sessionDate = new Date(entry.timestamp).toLocaleString();
        md += `# Session — ${sessionDate}\n\n`;
      }

      if (entry.type === "model_change") {
        md += `> 🔄 Model: **${entry.modelId}** (${entry.provider})\n\n`;
      }

      if (entry.type === "message" && entry.message) {
        const role = entry.message.role;
        const time = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : "";
        const icon = role === "user" ? "👤" : role === "assistant" ? "🧚" : "⚙️";
        const label = role === "user" ? "Breno" : role === "assistant" ? "Navi" : role;

        md += `### ${icon} ${label} — ${time}\n\n`;

        const content = entry.message.content;
        if (typeof content === "string") {
          md += content + "\n\n";
        } else if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "text") {
              md += block.text + "\n\n";
            } else if (block.type === "tool_use") {
              md += `\`\`\`\n🔧 ${block.name}(${JSON.stringify(block.input || {}).slice(0, 200)})\n\`\`\`\n\n`;
            } else if (block.type === "tool_result") {
              // skip tool results for cleaner view
            }
          }
        }
        md += "---\n\n";
      }
    } catch {
      // skip unparseable lines
    }
  }

  return md || "*Empty session*";
}

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) return NextResponse.json({ error: "Missing path" }, { status: 400 });
  const safe = safePath(filePath);
  if (!safe || !fs.existsSync(safe)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const raw = fs.readFileSync(safe, "utf-8");

  // If it's a session JSONL, render it as markdown
  if (filePath.startsWith("sessions/") && filePath.endsWith(".jsonl")) {
    const content = renderSession(raw);
    return NextResponse.json({ content, path: filePath, readonly: true });
  }

  return NextResponse.json({ content: raw, path: filePath });
}

export async function PUT(req: NextRequest) {
  const { path: filePath, content } = await req.json();
  if (!filePath || content === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Don't allow editing session files
  if (filePath.startsWith("sessions/")) {
    return NextResponse.json({ error: "Session logs are read-only" }, { status: 403 });
  }

  const safe = safePath(filePath);
  if (!safe) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  fs.mkdirSync(path.dirname(safe), { recursive: true });
  fs.writeFileSync(safe, content, "utf-8");
  return NextResponse.json({ ok: true });
}
