"use client";
import { useEffect, useState, useCallback } from "react";
import { BarChart3, RefreshCw, Coins, Cpu, Zap, Hash, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from "recharts";

interface ModelStats {
  provider: string; model: string; requests: number;
  inputTokens: number; outputTokens: number;
  cacheReadTokens: number; cacheWriteTokens: number;
  totalTokens: number; totalCost: number;
}

interface DailyStats {
  date: string; requests: number; totalTokens: number; totalCost: number;
  models: Record<string, number>;
}

interface Summary {
  totalRequests: number; totalTokens: number; totalCost: number;
  modelCount: number; range: number;
}

interface UsageData {
  summary: Summary; models: ModelStats[]; daily: DailyStats[];
}

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "#d97706", google: "#3b82f6", ollama: "#10b981", openai: "#8b5cf6",
};
const CHART_COLORS = ["#d97706", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#f59e0b", "#ec4899"];

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function formatCost(n: number): string {
  if (n === 0) return "$0.00";
  if (n < 0.01) return "$" + n.toFixed(4);
  return "$" + n.toFixed(2);
}

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/usage?range=${range}`);
    setData(await res.json());
    setLoading(false);
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const pieData = data?.models.map((m, i) => ({
    name: m.model, value: m.totalTokens, fill: CHART_COLORS[i % CHART_COLORS.length],
  })) || [];

  const dailyChartData = data?.daily.map(d => ({
    date: d.date.slice(5), // MM-DD
    requests: d.requests,
    tokens: d.totalTokens,
    cost: d.totalCost,
  })) || [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/10">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            LLM Usage
          </h1>
          <p className="text-sm text-gray-600 dark:text-white/30 mt-1">Token consumption and model activity</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                range === r
                  ? "bg-gradient-to-r from-violet-500/20 to-blue-500/20 text-gray-900 dark:text-white border border-violet-500/20"
                  : "glass-card text-gray-600 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70"
              }`}>{r}d</button>
          ))}
          <button onClick={load} className="p-2.5 rounded-xl glass-card hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-600 dark:text-white/30 transition-all duration-200">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="glass-card rounded-2xl h-28 shimmer" />)}
        </div>
      ) : !data || data.summary.totalRequests === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-gray-200/80 dark:border-white/[0.06]">
          <BarChart3 className="w-10 h-10 text-gray-300 dark:text-white/10 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-white/40 text-sm">No usage data for this period</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Hash, label: "Total Requests", value: data.summary.totalRequests.toLocaleString(), color: "from-violet-500/20 to-violet-600/5", accent: "text-violet-400" },
              { icon: Zap, label: "Total Tokens", value: formatTokens(data.summary.totalTokens), color: "from-blue-500/20 to-blue-600/5", accent: "text-blue-400" },
              { icon: Coins, label: "Total Cost", value: formatCost(data.summary.totalCost), color: "from-emerald-500/20 to-emerald-600/5", accent: "text-emerald-400" },
              { icon: Cpu, label: "Models Used", value: data.summary.modelCount.toString(), color: "from-amber-500/20 to-amber-600/5", accent: "text-amber-400" },
            ].map((stat, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 border border-gray-200/80 dark:border-white/[0.06] transition-all duration-300 hover:border-gray-300 dark:hover:border-white/[0.1]"
                style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-gray-600 dark:text-white/25 uppercase tracking-widest font-medium">{stat.label}</span>
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className={`w-3.5 h-3.5 ${stat.accent}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Daily Activity Chart */}
          {dailyChartData.length > 1 && (
            <div className="glass-card rounded-2xl p-6 border border-gray-200/80 dark:border-white/[0.06] mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-medium uppercase tracking-widest text-gray-600 dark:text-white/30 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Daily Activity
                </h2>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyChartData}>
                    <defs>
                      <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#888", fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                    <Tooltip
                      contentStyle={{ background: "rgba(15,15,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, backdropFilter: "blur(12px)" }}
                      labelStyle={{ color: "#999" }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [Number(value).toLocaleString(), "Requests"]}
                    />
                    <Area type="monotone" dataKey="requests" stroke="#3b82f6" fill="url(#reqGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Model Breakdown + Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Requests by Model Bar Chart */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-gray-200/80 dark:border-white/[0.06]">
              <h2 className="text-xs font-medium uppercase tracking-widest text-gray-600 dark:text-white/30 mb-6 flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5" /> Requests by Model
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.models.map(m => ({
                    model: m.model.length > 20 ? m.model.slice(0, 18) + "…" : m.model,
                    requests: m.requests,
                    provider: m.provider,
                  }))}>
                    <XAxis dataKey="model" tick={{ fill: "#888", fontSize: 10 }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: "#888", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: "rgba(15,15,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                    />
                    <Bar dataKey="requests" radius={[6, 6, 0, 0]}>
                      {data.models.map((m, i) => (
                        <Cell key={i} fill={PROVIDER_COLORS[m.provider] || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Token Distribution Pie */}
            <div className="glass-card rounded-2xl p-6 border border-gray-200/80 dark:border-white/[0.06]">
              <h2 className="text-xs font-medium uppercase tracking-widest text-gray-600 dark:text-white/30 mb-6 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> Token Share
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value"
                      labelLine={false}
                    />
                    <Tooltip
                      contentStyle={{ background: "rgba(15,15,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => formatTokens(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="space-y-1.5 mt-2">
                {data.models.slice(0, 5).map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PROVIDER_COLORS[m.provider] || CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-gray-600 dark:text-white/50 truncate flex-1">{m.model}</span>
                    <span className="text-gray-500 dark:text-white/30 font-mono">{formatTokens(m.totalTokens)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Model Details Table */}
          <div className="glass-card rounded-2xl border border-gray-200/80 dark:border-white/[0.06] overflow-hidden">
            <div className="p-5 border-b border-gray-200/80 dark:border-white/[0.06]">
              <h2 className="text-xs font-medium uppercase tracking-widest text-gray-600 dark:text-white/30 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5" /> Model Breakdown
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200/80 dark:border-white/[0.06]">
                    <th className="text-left p-4 text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/25 font-medium">Provider</th>
                    <th className="text-left p-4 text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/25 font-medium">Model</th>
                    <th className="text-right p-4 text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/25 font-medium">Requests</th>
                    <th className="text-right p-4 text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/25 font-medium">Input</th>
                    <th className="text-right p-4 text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/25 font-medium">Output</th>
                    <th className="text-right p-4 text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/25 font-medium">Cache R/W</th>
                    <th className="text-right p-4 text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/25 font-medium">Total</th>
                    <th className="text-right p-4 text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/25 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {data.models.map((m, i) => {
                    const color = PROVIDER_COLORS[m.provider] || CHART_COLORS[i % CHART_COLORS.length];
                    return (
                      <tr key={i} className="border-b border-gray-100 dark:border-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-xs text-gray-600 dark:text-white/50 capitalize">{m.provider}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs font-medium">{m.model}</td>
                        <td className="p-4 text-right font-mono">{m.requests.toLocaleString()}</td>
                        <td className="p-4 text-right text-gray-600 dark:text-white/40 font-mono">{formatTokens(m.inputTokens)}</td>
                        <td className="p-4 text-right text-gray-600 dark:text-white/40 font-mono">{formatTokens(m.outputTokens)}</td>
                        <td className="p-4 text-right text-gray-500 dark:text-white/30 font-mono text-xs">
                          {formatTokens(m.cacheReadTokens)} / {formatTokens(m.cacheWriteTokens)}
                        </td>
                        <td className="p-4 text-right font-mono font-medium">{formatTokens(m.totalTokens)}</td>
                        <td className="p-4 text-right font-mono font-medium">
                          <span className={m.totalCost > 0 ? "text-emerald-500" : "text-gray-500 dark:text-white/30"}>
                            {formatCost(m.totalCost)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 dark:border-white/[0.08] font-medium">
                    <td colSpan={2} className="p-4 text-xs text-gray-600 dark:text-white/50 uppercase tracking-wider">Total</td>
                    <td className="p-4 text-right font-mono">{data.summary.totalRequests.toLocaleString()}</td>
                    <td className="p-4 text-right font-mono text-gray-600 dark:text-white/40">{formatTokens(data.models.reduce((s, m) => s + m.inputTokens, 0))}</td>
                    <td className="p-4 text-right font-mono text-gray-600 dark:text-white/40">{formatTokens(data.models.reduce((s, m) => s + m.outputTokens, 0))}</td>
                    <td className="p-4 text-right font-mono text-gray-500 dark:text-white/30 text-xs">
                      {formatTokens(data.models.reduce((s, m) => s + m.cacheReadTokens, 0))} / {formatTokens(data.models.reduce((s, m) => s + m.cacheWriteTokens, 0))}
                    </td>
                    <td className="p-4 text-right font-mono">{formatTokens(data.summary.totalTokens)}</td>
                    <td className="p-4 text-right font-mono text-emerald-500">{formatCost(data.summary.totalCost)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
