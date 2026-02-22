"use client";
import { useEffect, useState, useCallback } from "react";
import { Puzzle, RefreshCw, Search, ExternalLink, AlertTriangle } from "lucide-react";

interface Skill {
  name: string;
  emoji: string;
  description: string;
  source: string;
  status: "ready" | "missing";
  missing?: { bins?: string[]; anyBins?: string[]; env?: string[]; config?: string[]; os?: string[] };
  homepage?: string;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState("");
  const [filter, setFilter] = useState<"all" | "ready" | "missing">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/skills");
    const data = await res.json();
    setSkills(data.skills || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function search() {
    if (!searchQuery.trim()) return;
    const res = await fetch(`/api/skills?search=${encodeURIComponent(searchQuery)}`);
    const data = await res.json();
    setSearchResults(data.results || "No results");
  }

  const filtered = skills.filter(s => {
    if (filter === "ready") return s.status === "ready";
    if (filter === "missing") return s.status === "missing";
    return true;
  });

  const readyCount = skills.filter(s => s.status === "ready").length;
  const missingCount = skills.filter(s => s.status === "missing").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-3 tracking-tight">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-white/[0.06]">
              <Puzzle className="w-5 h-5 text-violet-400" />
            </div>
            Skills
          </h1>
          <p className="text-sm text-white/30 mt-1 ml-12">
            <span className="text-emerald-400/60">{readyCount} ready</span>
            <span className="mx-2 text-white/10">·</span>
            <span className="text-amber-400/60">{missingCount} missing</span>
          </p>
        </div>
        <button onClick={load} className="p-2.5 rounded-xl hover:bg-white/[0.05] text-white/30 hover:text-white/60 transition-all duration-200">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {(["all", "ready", "missing"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
              filter === f
                ? "bg-gradient-to-r from-violet-600/80 to-blue-600/80 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                : "bg-white/[0.03] text-white/30 hover:text-white/60 hover:bg-white/[0.05] border border-white/[0.04]"
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Search ClawHub */}
      <div className="flex gap-2 mb-8">
        <div className="relative flex-1 group">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/15 group-focus-within:text-violet-400 transition-colors" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Search ClawHub for new skills..."
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-violet-500/40 focus:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all duration-300 placeholder:text-white/15" />
        </div>
        <button onClick={search} className="px-5 py-3 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all duration-300">
          <Search className="w-4 h-4" />
        </button>
      </div>

      {searchResults && (
        <div className="glass-card p-5 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white/80">ClawHub Results</h3>
            <button onClick={() => setSearchResults("")} className="text-[11px] text-white/20 hover:text-white/50 transition-colors">dismiss</button>
          </div>
          <pre className="text-xs text-white/40 whitespace-pre-wrap font-mono">{searchResults}</pre>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="glass-card h-32 animate-shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((s, i) => (
            <div key={i} className="glass-card p-5 transition-all duration-300 hover:border-white/[0.1] hover:-translate-y-0.5 group animate-fade-in-up"
              style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0 mt-0.5">{s.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/85">{s.name}</span>
                    {s.homepage && (
                      <a href={s.homepage} target="_blank" rel="noopener noreferrer"
                        className="text-white/10 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-white/30 mt-1 line-clamp-2 leading-relaxed">{s.description}</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                  s.source === "openclaw-workspace" ? "bg-violet-500/10 text-violet-400/60 border border-violet-500/10" : "bg-white/[0.03] text-white/20 border border-white/[0.04]"
                }`}>{s.source === "openclaw-workspace" ? "workspace" : "bundled"}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                  s.status === "ready" ? "bg-emerald-500/10 text-emerald-400/70" : "bg-amber-500/10 text-amber-400/70"
                }`}>
                  {s.status === "ready" ? "✓ ready" : "✗ missing"}
                </span>
              </div>
              {s.status === "missing" && s.missing && (
                <div className="mt-2 flex items-start gap-1.5 text-[10px] text-amber-400/40 font-mono bg-amber-500/5 rounded-lg p-2">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>
                    {[
                      ...(s.missing.bins || []).map(b => `bin:${b}`),
                      ...(s.missing.env || []).map(e => `env:${e}`),
                      ...(s.missing.config || []).map(c => `config:${c}`),
                      ...(s.missing.os || []).map(o => `os:${o}`),
                    ].join(", ")}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
