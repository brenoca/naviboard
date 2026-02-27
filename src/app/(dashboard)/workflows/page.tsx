"use client";
import { useEffect, useRef, useState } from "react";
import { GitBranch, Zap, ChevronDown } from "lucide-react";
import { workflows, type Workflow, type WorkflowNode } from "@/lib/workflows";

/* ── colour helpers ─────────────────────────────────────────── */
const borderColor: Record<string, string> = {
  trigger: "border-amber-500/60",
  condition: "border-violet-500/60",
  router: "border-violet-500/60",
  action: "border-blue-500/60",
  llm: "border-emerald-500/60",
  notification: "border-cyan-500/60",
};
const bgGlow: Record<string, string> = {
  trigger: "from-amber-500/10 to-amber-600/5",
  condition: "from-violet-500/10 to-violet-600/5",
  router: "from-violet-500/10 to-violet-600/5",
  action: "from-blue-500/10 to-blue-600/5",
  llm: "from-emerald-500/10 to-emerald-600/5",
  notification: "from-cyan-500/10 to-cyan-600/5",
};
const badgeColor: Record<string, string> = {
  trigger: "bg-amber-500/20 text-amber-300",
  condition: "bg-violet-500/20 text-violet-300",
  router: "bg-violet-500/20 text-violet-300",
  action: "bg-blue-500/20 text-blue-300",
  llm: "bg-emerald-500/20 text-emerald-300",
  notification: "bg-cyan-500/20 text-cyan-300",
};

/* ── layout helpers: assign columns by BFS from edges ──────── */
function assignColumns(wf: Workflow) {
  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();
  wf.nodes.forEach(n => { adj.set(n.id, []); inDeg.set(n.id, 0); });
  wf.edges.forEach(e => { adj.get(e.from)?.push(e.to); inDeg.set(e.to, (inDeg.get(e.to) || 0) + 1); });

  const col = new Map<string, number>();
  const queue = wf.nodes.filter(n => (inDeg.get(n.id) || 0) === 0).map(n => n.id);
  queue.forEach(id => col.set(id, 0));

  let i = 0;
  while (i < queue.length) {
    const cur = queue[i++];
    const c = col.get(cur)!;
    for (const next of adj.get(cur) || []) {
      const nc = Math.max(col.get(next) ?? 0, c + 1);
      col.set(next, nc);
      if (!queue.includes(next)) queue.push(next);
    }
  }
  return col;
}

/* ── Node card ─────────────────────────────────────────────── */
function NodeCard({ node, style, idx }: { node: WorkflowNode; style?: React.CSSProperties; idx: number }) {
  return (
    <div
      data-node-id={node.id}
      style={{ ...style, animation: `fadeInUp 0.4s ease-out ${idx * 80}ms both` }}
      className={`
        relative w-[200px] shrink-0 rounded-xl border-2 ${borderColor[node.type]}
        bg-gradient-to-br ${bgGlow[node.type]}
        backdrop-blur-xl bg-white/[0.03] dark:bg-white/[0.03]
        p-3 flex flex-col gap-1.5
        shadow-lg hover:shadow-xl transition-shadow duration-300
      `}
    >
      {/* status dot */}
      <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${node.status === 'active' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-gray-500'}`} />
      {/* icon + title */}
      <div className="flex items-center gap-2">
        <span className="text-lg leading-none">{node.icon}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{node.title}</span>
      </div>
      {/* type badge */}
      <span className={`self-start text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeColor[node.type]}`}>
        {node.type === 'llm' ? 'LLM Agent' : node.type.charAt(0).toUpperCase() + node.type.slice(1)}
      </span>
      {/* tech */}
      {node.tech && <span className="text-[10px] text-gray-500 dark:text-white/30">{node.tech}</span>}
      {/* description */}
      <p className="text-[11px] text-gray-600 dark:text-white/50 leading-tight">{node.description}</p>
      {node.schedule && <span className="text-[10px] text-amber-400/80">🕐 {node.schedule}</span>}
    </div>
  );
}

/* ── SVG connector drawing ─────────────────────────────────── */
function Connectors({ wf, containerRef }: { wf: Workflow; containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [paths, setPaths] = useState<{ d: string; label?: string; mx: number; my: number }[]>([]);

  useEffect(() => {
    function calc() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const result: typeof paths = [];

      for (const edge of wf.edges) {
        const fromEl = el.querySelector(`[data-node-id="${edge.from}"]`) as HTMLElement | null;
        const toEl = el.querySelector(`[data-node-id="${edge.to}"]`) as HTMLElement | null;
        if (!fromEl || !toEl) continue;

        const fr = fromEl.getBoundingClientRect();
        const tr = toEl.getBoundingClientRect();

        const x1 = fr.right - rect.left;
        const y1 = fr.top + fr.height / 2 - rect.top;
        const x2 = tr.left - rect.left;
        const y2 = tr.top + tr.height / 2 - rect.top;

        const cpx = (x1 + x2) / 2;
        const d = `M ${x1} ${y1} C ${cpx} ${y1}, ${cpx} ${y2}, ${x2} ${y2}`;
        result.push({ d, label: edge.label, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 });
      }
      setPaths(result);
    }
    calc();
    window.addEventListener("resize", calc);
    const t = setTimeout(calc, 500); // after animations
    return () => { window.removeEventListener("resize", calc); clearTimeout(t); };
  }, [wf, containerRef]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M 0 0 L 8 3 L 0 6 Z" className="fill-white/20" />
        </marker>
      </defs>
      {paths.map((p, i) => (
        <g key={i}>
          <path
            d={p.d}
            fill="none"
            className="stroke-white/15"
            strokeWidth={2}
            markerEnd="url(#arrow)"
            strokeDasharray="500"
            strokeDashoffset="500"
            style={{ animation: `drawLine 0.8s ease forwards ${0.3 + i * 0.1}s` }}
          />
          {p.label && (
            <text x={p.mx} y={p.my - 6} textAnchor="middle" className="fill-white/40 text-[10px]" style={{ fontSize: 10 }}>
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ── Workflow flow chart ───────────────────────────────────── */
function WorkflowChart({ wf }: { wf: Workflow }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const colMap = assignColumns(wf);

  // group nodes by column
  const maxCol = Math.max(...Array.from(colMap.values()), 0);
  const columns: WorkflowNode[][] = Array.from({ length: maxCol + 1 }, () => []);
  wf.nodes.forEach(n => {
    const c = colMap.get(n.id) ?? 0;
    columns[c].push(n);
  });

  let nodeIdx = 0;

  return (
    <div className="relative overflow-x-auto pb-4" ref={containerRef}>
      <div className="flex gap-12 items-start min-w-max px-2 py-4">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-4 items-center">
            {col.map(node => {
              const i = nodeIdx++;
              return <NodeCard key={node.id} node={node} idx={i} />;
            })}
          </div>
        ))}
      </div>
      <Connectors wf={wf} containerRef={containerRef} />
    </div>
  );
}

/* ── Workflow summary card (collapsed) ─────────────────────── */
function WorkflowCard({ wf }: { wf: Workflow }) {
  const [expanded, setExpanded] = useState(false);
  const nodeCount = wf.nodes.length;
  const triggerNode = wf.nodes.find(n => n.type === 'trigger');
  const types = Array.from(new Set(wf.nodes.map(n => n.tech))).filter(Boolean);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Summary row — always visible, clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition-colors duration-200"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 shrink-0">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{wf.name}</h2>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${wf.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {wf.enabled ? '● Active' : '○ Disabled'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5 truncate">{wf.description}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-[10px] text-gray-500 dark:text-white/30 flex items-center gap-1">
                <span className="text-violet-400">⬡</span> {nodeCount} nodes
              </span>
              {triggerNode?.schedule && (
                <span className="text-[10px] text-amber-400/80 flex items-center gap-1">
                  🕐 {triggerNode.schedule}
                </span>
              )}
              {types.slice(0, 3).map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-gray-500 dark:text-white/30 border border-gray-200/50 dark:border-white/[0.06]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-white/20 shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded chart */}
      {expanded && (
        <div className="border-t border-gray-200/50 dark:border-white/[0.06] p-5 animate-fade-in-up">
          <WorkflowChart wf={wf} />
        </div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */
export default function WorkflowsPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-gray-200/80 dark:border-white/[0.06]">
            <GitBranch className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Workflows</h1>
            <p className="text-sm text-gray-500 dark:text-white/30 mt-0.5">Automation pipelines powering Navi</p>
          </div>
        </div>
      </div>

      {/* Workflow list */}
      <div className="space-y-3">
        {workflows.map(wf => (
          <WorkflowCard key={wf.id} wf={wf} />
        ))}
      </div>

      {/* CSS keyframe for line drawing */}
      <style jsx global>{`
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
