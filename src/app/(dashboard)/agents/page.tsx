"use client";
import { useEffect, useState, useCallback } from "react";
import { Bot, RefreshCw, Zap } from "lucide-react";

interface Session {
  key?: string; kind?: string; model?: string; lastActivity?: string;
  messageCount?: number; messages?: number; [k: string]: unknown;
}

const MODEL_COLORS: Record<string, string> = {
  "claude": "from-amber-500/10 to-orange-500/10 text-amber-400/80 border-amber-500/10",
  "gpt": "from-emerald-500/10 to-teal-500/10 text-emerald-400/80 border-emerald-500/10",
  "gemini": "from-blue-500/10 to-cyan-500/10 text-blue-400/80 border-blue-500/10",
  "ollama": "from-violet-500/10 to-purple-500/10 text-violet-400/80 border-violet-500/10",
  "default": "from-white/5 to-white/5 text-gray-600 dark:text-white/40 border-gray-200 dark:border-white/10",
};

function getModelStyle(model?: string): string {
  if (!model) return MODEL_COLORS.default;
  const lower = model.toLowerCase();
  for (const [key, val] of Object.entries(MODEL_COLORS)) {
    if (key !== "default" && lower.includes(key)) return val;
  }
  return MODEL_COLORS.default;
}

export default function AgentsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/agents");
    const data = await res.json();
    setSessions(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-3 tracking-tight">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-gray-200/80 dark:border-white/[0.06]">
              <Bot className="w-5 h-5 text-violet-400" />
            </div>
            Agents
          </h1>
          <p className="text-sm text-gray-600 dark:text-white/30 mt-1 ml-12">Active sessions and models</p>
        </div>
        <button onClick={load} className="p-2.5 rounded-xl hover:bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-white/30 hover:text-gray-500 dark:text-white/60 transition-all duration-200">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[1,2,3].map(i => <div key={i} className="glass-card h-24 animate-shimmer" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-3xl mb-3">🤖</div>
          <p className="text-gray-600 dark:text-white/40 text-sm">No active sessions</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map((s, i) => {
            const modelStyle = getModelStyle(s.model);
            return (
              <div key={i} className="glass-card gradient-border p-5 transition-all duration-300 hover:border-gray-300 dark:border-white/[0.1] animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-30" />
                    </div>
                    <div className="font-medium text-sm text-gray-800 dark:text-white/90">{s.key || `Session ${i}`}</div>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-white/[0.03] text-gray-600 dark:text-white/30 border border-gray-200/80 dark:border-white/[0.06]">{s.kind || "unknown"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-white/20 uppercase tracking-widest block mb-1">Model</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-md bg-gradient-to-r border text-[11px] ${modelStyle}`}>
                      <Zap className="w-3 h-3 mr-1 inline" />{s.model || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-white/20 uppercase tracking-widest block mb-1">Messages</span>
                    <span className="text-gray-500 dark:text-white/60">{s.messageCount || s.messages || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-white/20 uppercase tracking-widest block mb-1">Last Active</span>
                    <span className="text-gray-500 dark:text-white/60">{s.lastActivity || "—"}</span>
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="text-[11px] text-gray-500 dark:text-white/15 cursor-pointer hover:text-gray-600 dark:text-white/30 transition-colors">Raw data</summary>
                  <pre className="text-[11px] text-gray-500 dark:text-white/20 mt-2 overflow-x-auto bg-gray-100 dark:bg-black/20 rounded-lg p-3 font-mono">{JSON.stringify(s, null, 2)}</pre>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
