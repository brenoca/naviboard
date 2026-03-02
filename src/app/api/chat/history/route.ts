import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const SESSIONS_DIR = join(process.env.HOME || "/home/ubuntu", ".openclaw/agents/main/sessions");
const SESSIONS_JSON = join(SESSIONS_DIR, "sessions.json");
const SESSION_KEY = process.env.OPENCLAW_CHAT_SESSION || "agent:main:main";

interface TranscriptEntry {
  type: string;
  id?: string;
  message?: {
    role: string;
    content: string | Array<{ type: string; text?: string }>;
  };
}

function extractText(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((c) => c.type === "text" && c.text)
      .map((c) => c.text!)
      .join("\n");
  }
  return "";
}

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");

    // Find session ID from sessions.json
    const sessionsData = JSON.parse(readFileSync(SESSIONS_JSON, "utf8"));
    const session = sessionsData[SESSION_KEY];
    if (!session?.sessionId) {
      return NextResponse.json([]);
    }

    const transcriptPath = join(SESSIONS_DIR, `${session.sessionId}.jsonl`);
    const lines = readFileSync(transcriptPath, "utf8").trim().split("\n");

    const messages: Array<{ role: string; content: string; timestamp?: string }> = [];

    for (const line of lines) {
      try {
        const entry: TranscriptEntry = JSON.parse(line);
        if (entry.type !== "message" || !entry.message) continue;

        const { role, content } = entry.message;
        if (role !== "user" && role !== "assistant") continue;

        const text = extractText(content);
        if (!text) continue;

        // Skip system-like messages, heartbeats, NO_REPLY, compaction
        if (text === "HEARTBEAT_OK" || text === "NO_REPLY") continue;
        if (text.startsWith("Read HEARTBEAT.md")) continue;
        if (text.startsWith("Pre-compaction memory flush")) continue;
        if (text.startsWith("The conversation history before this point was compacted")) continue;
        if (text.startsWith("[System Message]")) continue;
        if (text.startsWith("System:")) continue;

        // Skip messages that are just tool narration (starts with code blocks or function calls)
        if (role === "assistant" && text.length < 10) continue;

        messages.push({ role, content: text });
      } catch {
        // skip malformed lines
      }
    }

    // Return last N messages
    return NextResponse.json(messages.slice(-limit));
  } catch (err) {
    console.error("History error:", err);
    return NextResponse.json([]);
  }
}
