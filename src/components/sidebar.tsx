"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Clock, CheckSquare, Bot, Puzzle, Link2, BarChart3, Heart, BookOpen, Target, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/brain", label: "Second Brain", icon: Brain },
  { href: "/cron", label: "Cron Jobs", icon: Clock },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/skills", label: "Skills", icon: Puzzle },
  { href: "/integrations", label: "Integrations", icon: Link2 },
  { href: "/health", label: "Health", icon: Heart },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/usage", label: "LLM Usage", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="lg:hidden fixed top-3 left-3 z-50 p-2 glass-card rounded-lg">
        <Menu className="w-5 h-5 text-white/60" />
      </button>
      {open && <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in" onClick={() => setOpen(false)} />}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 flex flex-col z-50 transition-all duration-500 ease-out",
        "bg-[#0a0a0f]/80 backdrop-blur-2xl border-r border-white/[0.06]",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <Link href="/brain" className="flex items-center gap-3 group">
              <div className="relative">
                <span className="text-xl">🧚</span>
                <div className="absolute inset-0 blur-lg bg-violet-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div>
                <span className="text-base font-semibold tracking-tight text-white">Navi</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Online</span>
                </div>
              </div>
            </Link>
            <button onClick={() => setOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-white/5 transition-colors"><X className="w-4 h-4 text-white/40" /></button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 mb-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/20">Navigation</span>
          </div>
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 group",
                  active
                    ? "text-white bg-white/[0.06]"
                    : "text-white/40 hover:text-white/80 hover:bg-white/[0.03]"
                )}>
                {/* Active glow indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-violet-400 to-blue-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                )}
                <item.icon className={cn("w-4 h-4 shrink-0 transition-all duration-300", active ? "text-violet-400" : "group-hover:text-white/60")} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <div className="text-[10px] text-white/15 uppercase tracking-widest">Powered by OpenClaw</div>
        </div>
      </aside>
    </>
  );
}
