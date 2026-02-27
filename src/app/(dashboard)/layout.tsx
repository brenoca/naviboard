"use client";
import { Sidebar } from "@/components/sidebar";
import { SidebarProvider, useSidebar } from "@/components/sidebar-context";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { effectiveWidth, isMobile } = useSidebar();

  return (
    <div className="min-h-screen">
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent z-50" />
      <Sidebar />
      <main
        className="min-h-screen p-4 sm:p-6 pt-12 sm:pt-16 lg:pt-8 transition-all duration-300"
        style={{ marginLeft: isMobile ? 0 : effectiveWidth }}
      >
        <div className="mx-auto animate-fade-in-up">
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
