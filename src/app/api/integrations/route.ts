export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import fs from "fs";
import { run } from "@/lib/exec";

interface Integration {
  name: string;
  icon: string;
  status: "connected" | "not_configured" | "error";
  detail?: string;
}

function fileExists(p: string): boolean {
  try { return fs.existsSync(p); } catch { return false; }
}

function maskSecret(s: string): string {
  if (s.length <= 8) return "****";
  return s.slice(0, 4) + "..." + s.slice(-4);
}

export async function GET() {
  const integrations: Integration[] = [];

  // Gmail
  const gmailPath = "/home/ubuntu/.openclaw/secrets/gmail-smtp.json";
  if (fileExists(gmailPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(gmailPath, "utf-8"));
      integrations.push({ name: "Gmail (SMTP)", icon: "mail", status: "connected", detail: maskSecret(data.user || data.email || "") });
    } catch {
      integrations.push({ name: "Gmail (SMTP)", icon: "mail", status: "error" });
    }
  } else {
    integrations.push({ name: "Gmail (SMTP)", icon: "mail", status: "not_configured" });
  }

  // Notion Personal
  const notionPersonal = `${process.env.HOME}/.config/notion/api_key_personal`;
  if (fileExists(notionPersonal)) {
    const key = fs.readFileSync(notionPersonal, "utf-8").trim();
    integrations.push({ name: "Notion (Personal)", icon: "book", status: "connected", detail: maskSecret(key) });
  } else {
    integrations.push({ name: "Notion (Personal)", icon: "book", status: "not_configured" });
  }

  // Notion Enverge
  const notionEnverge = `${process.env.HOME}/.config/notion/api_key`;
  if (fileExists(notionEnverge)) {
    const key = fs.readFileSync(notionEnverge, "utf-8").trim();
    integrations.push({ name: "Notion (Enverge)", icon: "building", status: "connected", detail: maskSecret(key) });
  } else {
    integrations.push({ name: "Notion (Enverge)", icon: "building", status: "not_configured" });
  }

  // LinkedIn
  const linkedinPath = "/home/ubuntu/.openclaw/secrets/linkedin.json";
  integrations.push({
    name: "LinkedIn", icon: "linkedin",
    status: fileExists(linkedinPath) ? "connected" : "not_configured"
  });

  // GitHub
  const gitCreds = `${process.env.HOME}/.git-credentials`;
  if (fileExists(gitCreds)) {
    integrations.push({ name: "GitHub", icon: "github", status: "connected", detail: "PAT configured" });
  } else {
    integrations.push({ name: "GitHub", icon: "github", status: "not_configured" });
  }

  // Ollama
  try {
    const out = run("curl -s http://localhost:11434/api/tags 2>/dev/null", 5000);
    const data = JSON.parse(out);
    integrations.push({ name: "Ollama", icon: "cpu", status: "connected", detail: `${data.models?.length || 0} models` });
  } catch {
    integrations.push({ name: "Ollama", icon: "cpu", status: "not_configured" });
  }

  return NextResponse.json(integrations);
}
