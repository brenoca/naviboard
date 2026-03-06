"use client";
import { useEffect, useState } from "react";

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

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch("/api/workflows/list");
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setWorkflows(data.workflows || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  const getIconForWorkflow = (name: string): string => {
    if (name.toLowerCase().includes("habit")) return "🌙";
    if (name.toLowerCase().includes("email") || name.toLowerCase().includes("linkedin")) return "📧";
    if (name.toLowerCase().includes("model") || name.toLowerCase().includes("benchmark")) return "🤖";
    if (name.toLowerCase().includes("agent") || name.toLowerCase().includes("browser")) return "🦾";
    if (name.toLowerCase().includes("resend") || name.toLowerCase().includes("email")) return "✉️";
    return "⚙️";
  };

  const getFormattedTime = () => {
    const now = new Date();
    return now.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-black p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <svg className="animate-spin h-12 w-12 text-violet-500 mx-auto" viewBox="0 0 24 24" fill="none">
            <path stroke="currentColor" strokeLinecap="round" d="M12 3v3m6.366-.366-2.12 2.12M21 12h-3m2.12-3.646-2.12 2.12M12 21v-3m-6.366.366 2.12-2.12M3 12h3m-2.12 3.646 2.12-2.12" strokeWidth="2"/>
          </svg>
          <p className="text-white/60">Loading workflows...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-slate-900 to-black p-6 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-xl">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h2 className="text-2xl font-bold text-white">Failed to load workflows</h2>
          <p className="text-gray-400">{error}</p>
          <button onClick={fetchWorkflows} className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            🔁 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-black p-6 md:p-12">
      {/* Header */}
      <header className="mb-8 pb-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <svg className="w-8 h-8 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Workflows & Automations
          </h1>
          <p className="text-lg text-gray-400/80 flex items-center gap-2">
            🤖 Mother Navi&apos;s automated workflows for daily operations
          </p>
        </div>

        {/* Statistics */}
        <div className="flex gap-4">
          {workflows.length > 0 && (
            <div className="bg-violet-500/10 px-4 py-2 rounded-lg border border-violet-500/30 text-center">
              <div className="text-2xl font-bold text-white">{workflows.length}</div>
              <div className="text-xs text-gray-400 uppercase">Active Workflows</div>
            </div>
          )}
          <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10 text-center">
            <div className="text-2xl font-bold text-white">{getFormattedTime()}</div>
            <div className="text-xs text-gray-400 uppercase">Now</div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      {workflows.length === 0 ? (
        <div className="text-center py-12 text-white/60">
          No workflows found. Use the skills system to create automations.
        </div>
      ) : (
        <div className="grid gap-6">
          {workflows.map((workflow, index) => (
            <div key={`${workflow.folder}-${index}`} className="group bg-white/[0.03] rounded-xl border border-white/10 hover:border-violet-500/40 transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
              {/* Card Header */}
              <div className="p-6 pb-4 border-b border-white/5 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-pulse-slow">{getIconForWorkflow(workflow.name)}</span>
                  <div>
                    <h2 className="text-lg font-bold text-white/90">{workflow.name}</h2>
                    {workflow.description && (
                      <p className="text-sm text-gray-400 max-w-md mt-1">{workflow.description}</p>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                {workflow.status ? (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
                    workflow.status.includes('✅') || workflow.status.includes('Running')
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-gray-700 text-gray-400 border border-gray-600"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      workflow.status.includes('✅') ? 'bg-emerald-500' : 'bg-gray-500'
                    }`}></span>
                    {workflow.status}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    ℹ️ No Status Set
                  </span>
                )}
              </div>

              {/* Metadata Grid */}
              <div className="p-6 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {workflow.jobId && (
                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5 hover:border-violet-500/30 transition-colors">
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">🔗 Job ID</span>
                    <code className="text-sm text-violet-400">{workflow.jobId}</code>
                  </div>
                )}

                {workflow.schedule && (
                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5 hover:border-violet-500/30 transition-colors">
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">⏰ Schedule</span>
                    <span className="text-sm text-white/90">{workflow.schedule}</span>
                  </div>
                )}

                {workflow.trigger && (
                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5 hover:border-violet-500/30 transition-colors">
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">⚡ Trigger</span>
                    <span className="text-sm text-white/90">{workflow.trigger}</span>
                  </div>
                )}

                {workflow.model && (
                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5 hover:border-violet-500/30 transition-colors">
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">🤖 Model</span>
                    <span className="text-sm text-white/90 flex items-center gap-2">AI {workflow.model}</span>
                  </div>
                )}

                {workflow.session && (
                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5 hover:border-violet-500/30 transition-colors">
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">📊 Session</span>
                    <span className="text-sm text-white/90">{workflow.session}</span>
                  </div>
                )}

                {workflow.delivery && (
                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5 hover:border-violet-500/30 transition-colors">
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">📥 Delivery</span>
                    <span className="text-sm text-white/90">{workflow.delivery}</span>
                  </div>
                )}
              </div>

              {/* How it Works */}
              {workflow.functionality.length > 0 && (
                <div className="px-6 pb-4">
                  <h3 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    How it works:
                  </h3>
                  <ul className="space-y-1 text-sm text-gray-300/80 ml-6 list-disc pl-2">
                    {workflow.functionality.map((step, k) => (
                      <li key={k}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Implementation Files */}
              {workflow.files.length > 0 && (
                <div className="px-6 pb-6 flex items-center">
                  <span className="text-xs text-gray-500 uppercase tracking-wider mr-3">📁</span>
                  <div className="flex flex-wrap gap-2">
                    {workflow.files.map((file, k) => (
                      <code key={k} className="text-xs bg-violet-500/10 text-violet-400 px-3 py-2 rounded-lg border border-violet-500/20 font-mono max-w-[200px] truncate hover:bg-violet-500/20 transition-colors" title={file}>
                        {file.split('/').pop()}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Commands Section */}
              {workflow.commands && (
                <div className="px-6 pb-4">
                  <details className="group/details">
                    <summary className="flex items-center text-sm font-semibold text-white/70 cursor-pointer list-none hover:text-white transition-colors pb-2 border-b border-white/5 select-none">
                      <svg className="w-4 h-4 mr-2 transform group-details-open:rotate-90 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                      📋 View Commands
                    </summary>
                    <div className="mt-3 bg-gray-900/50 rounded-lg p-4 border border-white/10">
                      <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">{workflow.commands}</pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-white/10 text-center text-sm text-gray-500 italic">
        All workflows are automatically discovered from `/skills/*` SKILL.md documentation files.
        {error && <span className="ml-2 text-red-400">(Last updated: {new Date().toLocaleTimeString('en-US')})</span>}
      </footer>
    </div>
  );
}
