"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain, Clock, CheckSquare, Bot, Puzzle, Link2, BarChart3,
  Heart, BookOpen, Target, Menu, X, Sun, Moon, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { useSidebar } from "@/components/sidebar-context";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [animating, setAnimating] = useState(false);
  const { collapsed, toggleCollapsed, width, setWidth, effectiveWidth } = useSidebar();
  const [resizing, setResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  function handleThemeToggle() {
    setAnimating(true);
    toggleTheme();
    setTimeout(() => setAnimating(false), 500);
  }

  // Resize drag handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);
    const startX = e.clientX;
    const startWidth = width;

    function onMouseMove(ev: MouseEvent) {
      const delta = ev.clientX - startX;
      setWidth(startWidth + delta);
    }
    function onMouseUp() {
      setResizing(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width, setWidth]);

  // Double-click resize handle to reset width
  const handleDoubleClick = useCallback(() => {
    setWidth(256);
  }, [setWidth]);

  // Keyboard shortcut: Ctrl+B to toggle
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed top-3 left-3 z-50 p-2 glass-card rounded-lg">
        <Menu className="w-5 h-5 text-gray-600 dark:text-white/60" />
      </button>
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in" onClick={() => setMobileOpen(false)} />}

      <aside
        ref={sidebarRef}
        style={{ width: mobileOpen ? 256 : effectiveWidth }}
        className={cn(
          "fixed top-0 left-0 h-full flex flex-col z-50 transition-all ease-out select-none",
          resizing ? "duration-0" : "duration-300",
          "bg-[#f5f5f7]/80 dark:bg-[#0a0a0f]/80 backdrop-blur-2xl border-r border-gray-200 dark:border-white/[0.06]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>

        {/* Brand */}
        <div className={cn("border-b border-gray-200 dark:border-white/[0.06] transition-all duration-300", collapsed ? "px-2 py-4" : "px-5 py-5")}>
          <div className="flex items-center justify-between">
            <Link href="/brain" className={cn("flex items-center group", collapsed ? "justify-center w-full" : "gap-3")}>
              <div className="relative shrink-0">
                <span className="text-xl">🧚</span>
                <div className="absolute inset-0 blur-lg bg-violet-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              {!collapsed && (
                <div>
                  <span className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">Navi</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
                    <span className="text-[10px] text-gray-600 dark:text-white/30 uppercase tracking-widest">Online</span>
                  </div>
                </div>
              )}
            </Link>
            {!collapsed && (
              <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-gray-200 dark:hover:bg-white/5 transition-colors">
                <X className="w-4 h-4 text-gray-600 dark:text-white/40" />
              </button>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden", collapsed ? "px-1.5" : "px-3")}>
          {!collapsed && (
            <div className="px-3 mb-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-500 dark:text-white/20">Navigation</span>
            </div>
          )}
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center rounded-lg text-sm transition-all duration-300 group",
                  collapsed ? "justify-center px-0 py-2.5 mx-auto" : "gap-3 px-3 py-2.5",
                  active
                    ? "text-gray-900 dark:text-white bg-gray-200/60 dark:bg-white/[0.06]"
                    : "text-gray-600 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                )}>
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-violet-400 to-blue-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                )}
                <item.icon className={cn("w-4 h-4 shrink-0 transition-all duration-300", active ? "text-violet-500 dark:text-violet-400" : "group-hover:text-gray-500 dark:group-hover:text-white/60")} />
                {!collapsed && <span className="font-medium truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className={cn("border-t border-gray-200 dark:border-white/[0.06] space-y-2", collapsed ? "px-1.5 py-3" : "px-4 py-4")}>
          {/* Collapse toggle */}
          <button onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg transition-all duration-300",
              "hover:bg-gray-200 dark:hover:bg-white/[0.06] text-gray-500 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/60",
              collapsed ? "w-full py-2" : "w-full py-2 px-3"
            )}>
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
            {!collapsed && <span className="text-xs font-medium">Collapse</span>}
          </button>

          {/* Theme Toggle */}
          <button onClick={handleThemeToggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className={cn(
              "flex items-center justify-center gap-2 rounded-full transition-all duration-300",
              "bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] hover:bg-gray-200 dark:hover:bg-white/[0.08]",
              collapsed ? "w-full py-2" : "w-full py-2 px-3"
            )}>
            <div className={animating ? "animate-theme-toggle" : ""}>
              {theme === "dark" ? <Moon className="w-4 h-4 text-violet-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </div>
            {!collapsed && <span className="text-xs text-gray-500 dark:text-white/40 font-medium">{theme === "dark" ? "Dark" : "Light"}</span>}
          </button>

          {!collapsed && (
            <div className="text-[10px] text-gray-500 dark:text-white/15 uppercase tracking-widest text-center pt-1">Powered by OpenClaw</div>
          )}
        </div>

        {/* Resize handle — only when not collapsed and on desktop */}
        {!collapsed && (
          <div
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            className="hidden lg:flex absolute top-0 -right-[6px] w-[12px] h-full cursor-col-resize items-center justify-center group/resize z-50"
          >
            <div className={cn(
              "w-[3px] h-8 rounded-full transition-all duration-200",
              resizing
                ? "bg-violet-400 h-12 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                : "bg-gray-300 dark:bg-white/10 group-hover/resize:bg-violet-400 group-hover/resize:h-12 group-hover/resize:shadow-[0_0_8px_rgba(139,92,246,0.3)]"
            )} />
          </div>
        )}
      </aside>
    </>
  );
}
