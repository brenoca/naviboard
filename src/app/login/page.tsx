"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) {
      setToken(t);
      setLoading(true);
      fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      }).then(res => {
        if (res.ok) {
          router.push("/brain");
        } else {
          setError("Invalid token");
          setLoading(false);
        }
      });
    }
  }, [searchParams, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.ok) {
      router.push("/brain");
    } else {
      setError("Invalid token");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {loading && searchParams.get("token") && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="text-center animate-fade-in-up">
            <img src="/navi-avatar.png" alt="Navi" className="w-12 h-12 rounded-xl animate-pulse-glow inline-block mb-4" />
            <p className="text-sm text-gray-600 dark:text-white/40">Authenticating...</p>
          </div>
        </div>
      )}
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[128px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/8 rounded-full blur-[128px] animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] animate-float" style={{ animationDelay: "-1.5s" }} />
      </div>

      {/* Login card */}
      <form
        onSubmit={handleSubmit}
        className={`relative glass-card gradient-border p-8 w-full max-w-sm space-y-6 animate-fade-in-up ${error ? "animate-shake" : ""}`}
      >
        {/* Fairy glow */}
        <div className="text-center">
          <div className="inline-block relative">
            <img src="/navi-avatar.png" alt="Navi" className="w-10 h-10 rounded-xl animate-pulse-glow inline-block" />
            <div className="absolute inset-0 blur-xl bg-violet-500/20 rounded-full animate-breathe" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mt-3 tracking-tight">Navi Dashboard</h1>
          <p className="text-xs text-gray-600 dark:text-white/30 mt-1 tracking-wide uppercase">Personal AI Assistant</p>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <input
              type="password"
              placeholder="Enter access token"
              value={token}
              onChange={(e) => { setToken(e.target.value); setError(""); }}
              className="w-full bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm placeholder:text-gray-500 dark:placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-gray-50 dark:focus:bg-white/[0.05] transition-all duration-300 focus:shadow-[0_0_20px_rgba(139,92,246,0.1)]"
            />
          </div>

          {error && (
            <p className="text-red-400/80 text-xs text-center animate-fade-in">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full relative overflow-hidden rounded-lg py-3 text-sm font-medium text-white transition-all duration-300 disabled:opacity-50 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] active:scale-[0.98]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <img src="/navi-avatar.png" alt="Navi" className="w-12 h-12 rounded-xl animate-pulse-glow" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
