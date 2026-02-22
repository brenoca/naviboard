"use client";
import { useEffect, useState, useCallback } from "react";
import { BarChart3, RefreshCw, Zap, MessageSquare, Cpu } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface UsageData {
  sessions: number;
  modelUsage: Record<string, { requests: number; tokensIn: number; tokensOut: number }>;
}

const COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b"];

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/usage");
    setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const chartData = data ? Object.entries(data.modelUsage).map(([model, stats]) => ({
    model: model.split("/").pop() || model,
    requests: stats.requests,
    tokensIn: stats.tokensIn,
    tokensOut: stats.tokensOut,
    total: stats.tokensIn + stats.tokensOut,
  })) : [];

  const totalRequests = chartData.reduce((s, d) => s + d.requests, 0);
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-3 tracking-tight">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-gray-200/80 dark:border-white/[0.06]">
              <BarChart3 className="w-5 h-5 text-violet-400" />
            </div>
            LLM Usage
          </h1>
          <p className="text-sm text-gray-600 dark:text-white/30 mt-1 ml-12">Token consumption and model activity</p>
        </div>
        <button onClick={load} className="p-2.5 rounded-xl hover:bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-white/30 hover:text-gray-500 dark:text-white/60 transition-all duration-200">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1,2,3].map(i => <div key={i} className="glass-card h-24 animate-shimmer" />)}
        </div>
      ) : !data ? (
        <div className="glass-card p-12 text-center">
          <div className="text-3xl mb-3">📊</div>
          <p className="text-gray-600 dark:text-white/40 text-sm">No usage data</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Active Sessions", value: data.sessions, icon: Zap, gradient: "from-violet-500/10 to-purple-500/10" },
              { label: "Models Used", value: Object.keys(data.modelUsage).length, icon: Cpu, gradient: "from-blue-500/10 to-cyan-500/10" },
              { label: "Total Requests", value: totalRequests, icon: MessageSquare, gradient: "from-emerald-500/10 to-teal-500/10" },
            ].map((stat, i) => (
              <div key={i} className={`glass-card p-6 animate-fade-in-up`} style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-gray-600 dark:text-white/25 uppercase tracking-widest font-medium">{stat.label}</span>
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                    <stat.icon className="w-3.5 h-3.5 text-gray-600 dark:text-white/40" />
                  </div>
                </div>
                <div className="text-3xl font-semibold text-gray-800 dark:text-white/90 animate-count-up">{stat.value.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="glass-card p-6 mb-6 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
              <h2 className="text-xs font-medium uppercase tracking-widest text-gray-600 dark:text-white/30 mb-6">Requests by Model</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="model" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.04)" }} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.04)" }} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10,10,15,0.95)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 12,
                        fontSize: 12,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        backdropFilter: "blur(20px)",
                      }}
                      itemStyle={{ color: "rgba(255,255,255,0.7)" }}
                      labelStyle={{ color: "rgba(255,255,255,0.4)", marginBottom: 4 }}
                    />
                    <Bar dataKey="requests" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: "320ms" }}>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200/80 dark:border-white/[0.06]">
                <th className="text-left p-4 text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/25 font-medium">Model</th>
                <th className="text-right p-4 text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/25 font-medium">Requests</th>
                <th className="text-right p-4 text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/25 font-medium">Tokens In</th>
                <th className="text-right p-4 text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/25 font-medium">Tokens Out</th>
              </tr></thead>
              <tbody>
                {chartData.map((d, i) => (
                  <tr key={i} className="border-b border-gray-200 dark:border-white/[0.03] hover:bg-gray-50 dark:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        {d.model}
                      </div>
                    </td>
                    <td className="p-4 text-right text-gray-600 dark:text-white/70">{d.requests.toLocaleString()}</td>
                    <td className="p-4 text-right text-gray-600 dark:text-white/40">{d.tokensIn.toLocaleString()}</td>
                    <td className="p-4 text-right text-gray-600 dark:text-white/40">{d.tokensOut.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
