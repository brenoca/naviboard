export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const BASE = "/home/ubuntu/.openclaw/workspace";

function walkMd(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith(".") || entry === "node_modules") continue;
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        // Only recurse into memory/ and skills/ (top-level .md files + memory)
        const rel = relative(BASE, full);
        if (["memory", "skills", "scripts", "repos"].includes(rel.split("/")[0]) || rel === "") {
          results.push(...walkMd(full));
        }
      } else if (entry.endsWith(".md")) {
        results.push(full);
      }
    }
  } catch { /* ignore permission errors */ }
  return results;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.toLowerCase();
  if (!q) return NextResponse.json({ results: [] });

  const files = [
    ...readdirSync(BASE).filter(f => f.endsWith(".md")).map(f => join(BASE, f)),
    ...walkMd(join(BASE, "memory")),
  ];

  const results: { path: string; line: number; text: string }[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(q)) {
          results.push({
            path: relative(BASE, file),
            line: i + 1,
            text: lines[i].trim().slice(0, 120),
          });
          if (results.length >= 50) break;
        }
      }
    } catch { /* skip unreadable */ }
    if (results.length >= 50) break;
  }

  return NextResponse.json({ results });
}
