"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggleCollapsed: () => void;
  width: number;
  setWidth: (w: number) => void;
  effectiveWidth: number; // collapsed ? 64 : width
  isMobile: boolean;
  setIsMobile: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false, setCollapsed: () => {}, toggleCollapsed: () => {},
  width: 256, setWidth: () => {}, effectiveWidth: 256, isMobile: false, setIsMobile: () => {},
});

export function useSidebar() { return useContext(SidebarContext); }

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const COLLAPSED_WIDTH = 64;
const DEFAULT_WIDTH = 256;
const STORAGE_KEY = "naviboard-sidebar";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [width, setWidthState] = useState(DEFAULT_WIDTH);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.collapsed === "boolean") setCollapsedState(parsed.collapsed);
        if (typeof parsed.width === "number") setWidthState(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed.width)));
      }
    } catch {}
    setMounted(true);

    // Detect mobile screen size
    function checkMobile() {
      setIsMobile(window.innerWidth < 1024);
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const persist = useCallback((c: boolean, w: number) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ collapsed: c, width: w })); } catch {}
  }, []);

  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedState(v);
    persist(v, width);
  }, [width, persist]);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState(prev => {
      const next = !prev;
      persist(next, width);
      return next;
    });
  }, [width, persist]);

  const setWidth = useCallback((w: number) => {
    const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w));
    setWidthState(clamped);
    persist(collapsed, clamped);
  }, [collapsed, persist]);

  const effectiveWidth = mounted ? (collapsed ? COLLAPSED_WIDTH : width) : DEFAULT_WIDTH;

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggleCollapsed, width, setWidth, effectiveWidth, isMobile, setIsMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}
