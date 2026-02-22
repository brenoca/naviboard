import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Top gradient accent bar */}
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent z-50" />
      <Sidebar />
      <main className="lg:ml-64 min-h-screen p-6 pt-16 lg:pt-8 lg:p-8">
        <div className="max-w-7xl mx-auto animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  );
}
