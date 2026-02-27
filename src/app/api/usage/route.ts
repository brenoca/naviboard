export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SESSIONS_DIR = "/home/ubuntu/.openclaw/agents/main/sessions";

interface UsageEntry {
  timestamp: string;
  provider: string;
  model: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  cost: number;
}

interface ModelStats {
  provider: string;
  model: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
  totalCost: number;
}

interface DailyStats {
  date: string;
  requests: number;
  totalTokens: number;
  totalCost: number;
  models: Record<string, number>; // model -> request count
}

export async function GET(req: NextRequest) {
  const range = parseInt(req.nextUrl.searchParams.get("range") || "30");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - range);
  const cutoffMs = cutoff.getTime();

  const modelStats: Record<string, ModelStats> = {};
  const dailyStats: Record<string, DailyStats> = {};
  const entries: UsageEntry[] = [];
  let totalRequests = 0;
  let totalTokens = 0;
  let totalCost = 0;

  try {
    const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith(".jsonl"));

    for (const file of files) {
      const filePath = path.join(SESSIONS_DIR, file);
      let currentModel = "unknown";
      let currentProvider = "unknown";

      const content = fs.readFileSync(filePath, "utf-8");
      for (const line of content.split("\n")) {
        if (!line) continue;
        try {
          const d = JSON.parse(line);

          // Track model changes
          if (d.type === "model_change") {
            currentModel = d.modelId || "unknown";
            currentProvider = d.provider || "unknown";
          } else if (d.customType === "model-snapshot" && d.data) {
            currentModel = d.data.modelId || currentModel;
            currentProvider = d.data.provider || currentProvider;
          }

          // Extract usage from assistant messages (usage is inside d.message)
          const msg = d.message;
          if (d.type === "message" && msg?.role === "assistant" && msg?.usage) {
            const ts = d.timestamp || msg?.timestamp;
            if (!ts) continue;

            const msgTime = typeof ts === "number" ? ts : new Date(ts).getTime();
            if (msgTime < cutoffMs) continue;

            // Use model from message if available, fallback to tracked
            const msgProvider = msg.provider || d.provider || currentProvider;
            const msgModel = msg.model || d.model || currentModel;
            const usage = msg.usage;
            const cost = typeof usage.cost === "object" ? usage.cost.total || 0 : usage.cost || 0;

            const entry: UsageEntry = {
              timestamp: typeof ts === "number" ? new Date(ts).toISOString() : ts,
              provider: msgProvider,
              model: msgModel,
              input: usage.input || 0,
              output: usage.output || 0,
              cacheRead: usage.cacheRead || 0,
              cacheWrite: usage.cacheWrite || 0,
              totalTokens: usage.totalTokens || 0,
              cost,
            };

            entries.push(entry);

            // Aggregate by model
            const key = `${msgProvider}/${msgModel}`;
            if (!modelStats[key]) {
              modelStats[key] = {
                provider: msgProvider, model: msgModel,
                requests: 0, inputTokens: 0, outputTokens: 0,
                cacheReadTokens: 0, cacheWriteTokens: 0,
                totalTokens: 0, totalCost: 0,
              };
            }
            const ms = modelStats[key];
            ms.requests++;
            ms.inputTokens += entry.input;
            ms.outputTokens += entry.output;
            ms.cacheReadTokens += entry.cacheRead;
            ms.cacheWriteTokens += entry.cacheWrite;
            ms.totalTokens += entry.totalTokens;
            ms.totalCost += cost;

            // Aggregate by day
            const date = entry.timestamp.slice(0, 10);
            if (!dailyStats[date]) {
              dailyStats[date] = { date, requests: 0, totalTokens: 0, totalCost: 0, models: {} };
            }
            const ds = dailyStats[date];
            ds.requests++;
            ds.totalTokens += entry.totalTokens;
            ds.totalCost += cost;
            ds.models[key] = (ds.models[key] || 0) + 1;

            totalRequests++;
            totalTokens += entry.totalTokens;
            totalCost += cost;
          }
        } catch {
          // skip unparseable lines
        }
      }
    }
  } catch {
    // sessions dir not found
  }

  // Sort models by cost desc
  const models = Object.values(modelStats).sort((a, b) => b.totalCost - a.totalCost);

  // Sort daily stats by date
  const daily = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    summary: { totalRequests, totalTokens, totalCost, modelCount: models.length, range },
    models,
    daily,
  });
}
