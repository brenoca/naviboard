"use client";
import { Sidebar } from "@/components/sidebar";
import { SidebarProvider, useSidebar } from "@/components/sidebar-context";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { effectiveWidth } = useSidebar();

  return (
    <div className="min-h-screen">
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent z-50" />
      <Sidebar />
      <main
        className="min-h-screen p-6 pt-16 lg:pt-8 lg:p-8 transition-all duration-300"
        style={{ marginLeft: effectiveWidth }}
      >
        <div className="max-w-7xl mx-auto animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
