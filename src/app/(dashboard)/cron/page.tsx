"use client";
import { useEffect, useState, useCallback } from "react";
import { Clock, Play, Trash2, ToggleLeft, ToggleRight, RefreshCw, Terminal, Cpu } from "lucide-react";

interface CronJob {
  id?: string;
  name?: string;
  schedule?: string;
  enabled?: boolean;
  source?: "openclaw" | "system";
  nextRun?: string;
  lastRun?: string;
  payload?: string;
  [key: string]: unknown;
}

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/cron");
    const data = await res.json();
    setJobs(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  async function doAction(action: string, id: string) {
    await fetch("/api/cron", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id }),
    });
    loadJobs();
  }

  const isSystem = (job: CronJob) => job.source === "system";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-3 tracking-tight">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-gray-200/80 dark:border-white/[0.06]">
              <Clock className="w-5 h-5 text-violet-400" />
            </div>
            Cron Jobs
          </h1>
          <p className="text-sm text-gray-600 dark:text-white/30 mt-1 ml-12">Scheduled tasks and automation</p>
        </div>
        <button onClick={loadJobs} className="p-2.5 rounded-xl hover:bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-white/30 hover:text-gray-500 dark:text-white/60 transition-all duration-200">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="glass-card h-20 animate-shimmer" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-3xl mb-3">⏰</div>
          <p className="text-gray-600 dark:text-white/40 text-sm">No cron jobs found</p>
          <p className="text-xs text-gray-500 dark:text-white/20 mt-1.5">Use <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/[0.05] rounded text-violet-400/60">openclaw cron add</code> to create jobs</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => {
            const id = job.id || String(i);
            const sys = isSystem(job);
            return (
              <div key={id} className="glass-card gradient-border p-5 transition-all duration-300 hover:border-gray-300 dark:border-white/[0.1] animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-medium text-sm text-gray-800 dark:text-white/90">{job.name || id}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        sys ? "bg-amber-500/10 text-amber-400/80 border border-amber-500/10" : "bg-violet-500/10 text-violet-400/80 border border-violet-500/10"
                      }`}>
                        {sys ? <><Terminal className="w-3 h-3" /> system</> : <><Cpu className="w-3 h-3" /> openclaw</>}
                      </span>
                      {job.enabled !== false && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-white/30 mt-1.5 font-mono tracking-wide">{job.schedule || "—"}</div>
                    {job.nextRun && <div className="text-[11px] text-gray-500 dark:text-white/20 mt-1">Next: {new Date(job.nextRun).toLocaleString()}</div>}
                  </div>
                  <div className="flex items-center gap-1">
                    {!sys && (
                      <>
                        <button onClick={() => doAction(job.enabled ? "disable" : "enable", id)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:bg-white/[0.05] transition-all duration-200" title={job.enabled ? "Disable" : "Enable"}>
                          {job.enabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-gray-500 dark:text-white/20" />}
                        </button>
                        <button onClick={() => doAction("run", id)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-white/30 hover:text-violet-400 transition-all duration-200" title="Run now">
                          <Play className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm("Delete this job?")) doAction("remove", id); }}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-50 dark:bg-red-500/10 text-gray-500 dark:text-white/20 hover:text-red-400 transition-all duration-200" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {job.payload && (
                      <button onClick={() => setExpanded(expanded === id ? null : id)}
                        className="text-[11px] text-gray-500 dark:text-white/20 hover:text-gray-600 dark:text-white/50 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:bg-white/[0.03] transition-all duration-200">
                        {expanded === id ? "hide" : "details"}
                      </button>
                    )}
                  </div>
                </div>
                {expanded === id && job.payload && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/[0.04] animate-fade-in">
                    <pre className="text-xs text-gray-600 dark:text-white/30 font-mono whitespace-pre-wrap break-all bg-gray-100 dark:bg-black/20 rounded-lg p-3">{job.payload}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
