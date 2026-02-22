export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE = "/home/ubuntu/.openclaw/workspace";

function getMarkdownFiles(dir: string, base: string = ""): { path: string; name: string }[] {
  const results: { path: string; name: string }[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const rel = path.join(base, entry.name);
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && !entry.name.startsWith("node_modules") && !entry.name.startsWith("navi-dashboard")) {
        results.push(...getMarkdownFiles(full, rel));
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push({ path: rel, name: entry.name });
      }
    }
  } catch {}
  return results;
}

function getSessionFiles(): { path: string; name: string }[] {
  const sessionsDir = "/home/ubuntu/.openclaw/agents/main/sessions";
  const results: { path: string; name: string }[] = [];
  try {
    const entries = fs.readdirSync(sessionsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        // Read first line to get timestamp for display name
        const full = path.join(sessionsDir, entry.name);
        let displayName = entry.name;
        try {
          const firstLine = fs.readFileSync(full, "utf-8").split("\n")[0];
          const parsed = JSON.parse(firstLine);
          if (parsed.timestamp) {
            const d = new Date(parsed.timestamp);
            displayName = d.toISOString().slice(0, 16).replace("T", " ") + " — " + entry.name.slice(0, 8);
          }
        } catch {}
        results.push({ path: "sessions/" + entry.name, name: displayName });
      }
    }
  } catch {}
  return results.sort((a, b) => b.name.localeCompare(a.name));
}

export async function GET() {
  const files = getMarkdownFiles(WORKSPACE);
  const sessions = getSessionFiles();
  return NextResponse.json([...files, ...sessions]);
}
