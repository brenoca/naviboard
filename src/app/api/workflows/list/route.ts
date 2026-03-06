import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface Workflow {
  name: string;
  folder: string;
  description?: string;
  jobId?: string;
  schedule?: string;
  trigger?: string;
  model?: string;
  session?: string;
  delivery?: string;
  status?: string;
  files: string[];
  functionality: string[];
  commands?: string;
}

export async function GET() {
  try {
    const skillsDir = "/home/ubuntu/.openclaw/workspace/skills";
    const workflows: Workflow[] = [];

    for (const folder of fs.readdirSync(skillsDir)) {
      const folderPath = path.join(skillsDir, folder);
      if (!fs.statSync(folderPath).isDirectory() || folder.startsWith(".")) continue;

      const skillDoc = path.join(folderPath, "SKILL.md");
      if (!fs.existsSync(skillDoc)) continue;

      const content = fs.readFileSync(skillDoc, "utf-8");
      const workflow = parseSkillMD(folder, content, folderPath);
      if (workflow) workflows.push(workflow);
    }

    // Enrich habits-checkin with runtime details
    const habits = workflows.find(w => w.folder === "habits-checkin");
    if (habits) {
      habits.name = "Daily Habits Check-in";
      habits.jobId = "abf62c9d-3d5d-4441-9547-1d0446c88b47";
      habits.schedule = "Daily @ 19:00 UTC (8PM CET)";
      habits.status = "✅ Active / Running";
      habits.trigger = habits.trigger || "Cron (recurring)";
      habits.model = habits.model || "Qwen3.5 122B (ollama/qwen3.5:122b)";
      habits.delivery = habits.delivery || "Telegram";
    }

    return NextResponse.json({
      workflows,
      count: workflows.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("workflows list error:", err);
    return NextResponse.json(
      { error: "Failed to read workflows", details: String(err) },
      { status: 500 }
    );
  }
}

function parseSkillMD(folder: string, content: string, folderPath: string): Workflow | null {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const descMatch = content.match(/^description:\s*(.+)$/m);

  const files = fs.readdirSync(folderPath)
    .filter(f => f !== "__pycache__" && !f.startsWith("."))
    .map(f => path.join(folderPath, f));

  const functionality: string[] = [];
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*(\d+)\.\s+(.+)/);
    if (m) functionality.push(m[2].trim());
  }

  return {
    name: titleMatch ? titleMatch[1].trim() : folder.replace(/-/g, " "),
    folder,
    description: descMatch ? descMatch[1].trim() : undefined,
    files,
    functionality,
  };
}
