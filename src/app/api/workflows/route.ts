export const dynamic = "force-dynamic";
import fs from "fs";
import { NextResponse } from "next/server";
import { run } from "@/lib/exec";
import {
  workflows as fallbackWorkflows,
  type Workflow,
  type WorkflowNode,
} from "@/lib/workflows";

const MASTER_WORKFLOWS_PATH = "/home/ubuntu/.openclaw/workspace/MasterWorkflows.md";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripMarkdown(input: string): string {
  return input
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferNodeType(step: string): WorkflowNode["type"] {
  const lower = step.toLowerCase();
  if (
    lower.includes("llm") ||
    lower.includes("model") ||
    lower.includes("analy")
  ) {
    return "llm";
  }
  if (lower.includes("notify") || lower.includes("telegram")) {
    return "notification";
  }
  if (lower.includes("if ") || lower.includes("check")) {
    return "condition";
  }
  return "action";
}

function parseCurrentRows(markdown: string): Array<{
  name: string;
  schedule: string;
  model: string;
  enabled: boolean;
}> {
  const lines = markdown.split("\n");
  const headerIdx = lines.findIndex((line) =>
    line.includes("| # | Workflow | Schedule | Model | Files | Status |")
  );
  if (headerIdx < 0) return [];

  const rows: Array<{
    name: string;
    schedule: string;
    model: string;
    enabled: boolean;
  }> = [];

  for (let i = headerIdx + 2; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) break;
    if (line.includes("coming soon")) break;

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((v) => v.trim());
    if (cells.length < 6) continue;

    const workflowCell = cells[1];
    const nameMatch = workflowCell.match(/\[([^\]]+)\]/);
    const name = stripMarkdown(nameMatch?.[1] || workflowCell);
    if (!name) continue;

    rows.push({
      name,
      schedule: stripMarkdown(cells[2]),
      model: stripMarkdown(cells[3]),
      enabled: /active/i.test(cells[5]),
    });
  }

  return rows;
}

function extractSection(markdown: string, heading: string): string {
  const needle = `### ${heading}`;
  const start = markdown.indexOf(needle);
  if (start < 0) return "";
  const after = markdown.slice(start + needle.length);
  const nextHeadingIdx = after.search(/\n###\s+/);
  return nextHeadingIdx >= 0 ? after.slice(0, nextHeadingIdx) : after;
}

function parseWorkflowFromMaster(markdown: string): Workflow[] {
  const rows = parseCurrentRows(markdown);
  return rows.map((row) => {
    const section = extractSection(markdown, row.name);
    const jobIdMatch = section.match(/Job ID:\s*`([^`]+)`/i);
    const summaryMatch = section.match(/#### What It Does[\s\S]*?\n([^\n]+)\n/i);
    const summary = stripMarkdown(summaryMatch?.[1] || "");

    const stepLines = Array.from(section.matchAll(/^\d+\.\s+(.+)$/gm)).map(
      (m) => stripMarkdown(m[1])
    );

    const nodes: WorkflowNode[] = [
      {
        id: `${slugify(row.name)}-trigger`,
        title: "Scheduled Trigger",
        type: "trigger",
        icon: "⏰",
        tech: "Scheduler",
        description: summary || `${row.name} scheduled automation.`,
        schedule: row.schedule,
        status: row.enabled ? "active" : "disabled",
      },
    ];

    const steps = stepLines.length
      ? stepLines
      : [`Execute workflow logic for ${row.name}`];

    for (let i = 0; i < steps.length; i += 1) {
      const step = steps[i];
      const type = inferNodeType(step);
      nodes.push({
        id: `${slugify(row.name)}-step-${i + 1}`,
        title: `Step ${i + 1}`,
        type,
        icon: type === "notification" ? "📱" : type === "llm" ? "🤖" : "⚙️",
        tech: i === 0 && row.model ? row.model : "Workflow step",
        description: step,
        status: row.enabled ? "active" : "disabled",
      });
    }

    const edges = nodes.slice(1).map((node, idx) => ({
      from: nodes[idx].id,
      to: node.id,
    }));

    return {
      id: jobIdMatch?.[1] || slugify(row.name),
      name: row.name,
      description: summary || `${row.name} automation.`,
      enabled: row.enabled,
      nodes,
      edges,
    };
  });
}

function parseSystemCronWorkflows(): Workflow[] {
  const out = run("crontab -l 2>/dev/null");
  if (!out) return [];

  return out
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line, i) => {
      const parts = line.split(/\s+/);
      if (parts.length < 6) return null;
      const schedule = parts.slice(0, 5).join(" ");
      const command = parts.slice(5).join(" ");
      const scriptMatch = command.match(/\/([^/\s]+(?:\.py|\.sh|\.ts|\.js))/);
      const shortName = scriptMatch?.[1] || `Cron Job ${i + 1}`;
      const workflowName = `${shortName} (System Cron)`;
      const baseId = `system-cron-${i}-${slugify(shortName)}`;
      const isTelegram = /telegram/i.test(command);

      const nodes: WorkflowNode[] = [
        {
          id: `${baseId}-trigger`,
          title: "Scheduled Trigger",
          type: "trigger",
          icon: "⏰",
          tech: "System crontab",
          description: "Invokes workflow on cron schedule.",
          schedule,
          status: "active",
        },
        {
          id: `${baseId}-action`,
          title: shortName,
          type: isTelegram ? "notification" : "action",
          icon: isTelegram ? "📱" : "⚙️",
          tech: "Shell command",
          description: command,
          status: "active",
        },
      ];

      return {
        id: baseId,
        name: workflowName,
        description: command,
        enabled: true,
        nodes,
        edges: [{ from: nodes[0].id, to: nodes[1].id }],
      } as Workflow;
    })
    .filter((wf): wf is Workflow => wf !== null);
}

function dedupeWorkflows(lists: Workflow[][]): Workflow[] {
  const seen = new Set<string>();
  const out: Workflow[] = [];

  for (const list of lists) {
    for (const wf of list) {
      const key = `${wf.id}::${wf.name.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(wf);
    }
  }

  return out;
}

export async function GET() {
  let masterWorkflows: Workflow[] = [];
  if (fs.existsSync(MASTER_WORKFLOWS_PATH)) {
    const markdown = fs.readFileSync(MASTER_WORKFLOWS_PATH, "utf-8");
    masterWorkflows = parseWorkflowFromMaster(markdown);
  }

  const systemCronWorkflows = parseSystemCronWorkflows();
  const workflows = dedupeWorkflows([
    masterWorkflows,
    systemCronWorkflows,
    fallbackWorkflows,
  ]);

  return NextResponse.json(workflows);
}
