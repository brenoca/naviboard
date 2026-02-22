"use client";
import { useEffect, useState, useCallback } from "react";
import { Link2, RefreshCw, Mail, Book, Building, Github, Cpu, Linkedin, Check } from "lucide-react";

interface Integration { name: string; icon: string; status: string; detail?: string; }

const ICONS: Record<string, React.ElementType> = { mail: Mail, book: Book, building: Building, github: Github, cpu: Cpu, linkedin: Linkedin };

const BRAND_GRADIENTS: Record<string, string> = {
  mail: "from-red-500/10 to-orange-500/10",
  github: "from-gray-500/10 to-slate-500/10",
  book: "from-blue-500/10 to-indigo-500/10",
  building: "from-violet-500/10 to-purple-500/10",
  cpu: "from-emerald-500/10 to-teal-500/10",
  linkedin: "from-blue-600/10 to-cyan-500/10",
};

const BRAND_ICON_COLORS: Record<string, string> = {
  mail: "text-red-400",
  github: "text-white/70",
  book: "text-blue-400",
  building: "text-violet-400",
  cpu: "text-emerald-400",
  linkedin: "text-blue-400",
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/integrations");
    setIntegrations(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-3 tracking-tight">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-white/[0.06]">
              <Link2 className="w-5 h-5 text-violet-400" />
            </div>
            Integrations
          </h1>
          <p className="text-sm text-white/30 mt-1 ml-12">Connected services</p>
        </div>
        <button onClick={load} className="p-2.5 rounded-xl hover:bg-white/[0.05] text-white/30 hover:text-white/60 transition-all duration-200">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="glass-card h-36 animate-shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((intg, i) => {
            const Icon = ICONS[intg.icon] || Link2;
            const gradient = BRAND_GRADIENTS[intg.icon] || "from-white/5 to-white/5";
            const iconColor = BRAND_ICON_COLORS[intg.icon] || "text-white/50";
            const connected = intg.status === "connected";

            return (
              <div key={i} className="glass-card p-6 transition-all duration-300 hover:border-white/[0.1] hover:-translate-y-0.5 group animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} border border-white/[0.06] transition-all duration-300 group-hover:scale-105`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  {connected ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/10">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400/80 font-medium">Connected</span>
                    </div>
                  ) : (
                    <span className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.03] text-white/25 border border-white/[0.04]">
                      {intg.status.replace("_", " ")}
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-white/85 mb-1">{intg.name}</div>
                {intg.detail && (
                  <div className="text-[11px] text-white/25 font-mono truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">{intg.detail}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
