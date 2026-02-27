"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Target, Plus, X, Trash2, Archive, ChevronLeft, ChevronRight,
  Flame, TrendingUp, Calendar, Settings2
} from "lucide-react";

interface Habit {
  id: number; name: string; icon: string; color: string;
  frequency: string; target: number; unit: string;
  category: string; archived: number; sort_order: number;
}

interface HabitLog {
  id: number; habit_id: number; date: string; value: number; notes: string;
}

const COLORS: Record<string, { bg: string; border: string; text: string; check: string; ring: string }> = {
  violet: { bg: "bg-violet-500/15", border: "border-violet-500/20", text: "text-violet-400", check: "bg-violet-500", ring: "ring-violet-500/30" },
  blue: { bg: "bg-blue-500/15", border: "border-blue-500/20", text: "text-blue-400", check: "bg-blue-500", ring: "ring-blue-500/30" },
  emerald: { bg: "bg-emerald-500/15", border: "border-emerald-500/20", text: "text-emerald-400", check: "bg-emerald-500", ring: "ring-emerald-500/30" },
  amber: { bg: "bg-amber-500/15", border: "border-amber-500/20", text: "text-amber-400", check: "bg-amber-500", ring: "ring-amber-500/30" },
  rose: { bg: "bg-rose-500/15", border: "border-rose-500/20", text: "text-rose-400", check: "bg-rose-500", ring: "ring-rose-500/30" },
  cyan: { bg: "bg-cyan-500/15", border: "border-cyan-500/20", text: "text-cyan-400", check: "bg-cyan-500", ring: "ring-cyan-500/30" },
  orange: { bg: "bg-orange-500/15", border: "border-orange-500/20", text: "text-orange-400", check: "bg-orange-500", ring: "ring-orange-500/30" },
  pink: { bg: "bg-pink-500/15", border: "border-pink-500/20", text: "text-pink-400", check: "bg-pink-500", ring: "ring-pink-500/30" },
};

const ICONS = ["✅", "💪", "📚", "🧘", "🏃", "💧", "🍎", "💊", "🎯", "🧠", "✍️", "🎸", "🌅", "😴", "🚫", "💰", "🧹", "📱"];

function formatDate(d: Date): string { return d.toISOString().slice(0, 10); }

function getDaysArray(count: number): string[] {
  const days: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(formatDate(d));
  }
  return days;
}

function getStreak(habitId: number, logs: HabitLog[]): number {
  const habitLogs = new Set(logs.filter(l => l.habit_id === habitId).map(l => l.date));
  let streak = 0;
  const d = new Date();
  if (!habitLogs.has(formatDate(d))) {
    d.setDate(d.getDate() - 1);
    if (!habitLogs.has(formatDate(d))) return 0;
  }
  while (habitLogs.has(formatDate(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function getCompletionRate(habitId: number, logs: HabitLog[], days: number): number {
  const habitLogs = new Set(logs.filter(l => l.habit_id === habitId).map(l => l.date));
  const allDays = getDaysArray(days);
  const completed = allDays.filter(d => habitLogs.has(d)).length;
  return days > 0 ? Math.round((completed / days) * 100) : 0;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  // Form
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("✅");
  const [formColor, setFormColor] = useState("violet");
  const [formCategory, setFormCategory] = useState("");
  const [formTarget, setFormTarget] = useState(1);
  const [formUnit, setFormUnit] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/habits?range=90");
    const data = await res.json();
    setHabits(data.habits || []);
    setLogs(data.logs || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleLog(habitId: number, date: string) {
    const existing = logs.find(l => l.habit_id === habitId && l.date === date);
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "log", habit_id: habitId, date, value: existing ? 0 : 1 }),
    });
    load();
  }

  async function addHabit() {
    if (!formName.trim()) return;
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName, icon: formIcon, color: formColor, category: formCategory, target: formTarget, unit: formUnit }),
    });
    resetForm();
    load();
  }

  async function updateHabit() {
    if (!editHabit) return;
    await fetch("/api/habits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editHabit.id, name: formName, icon: formIcon, color: formColor, category: formCategory }),
    });
    setEditHabit(null);
    resetForm();
    load();
  }

  async function archiveHabit(id: number) {
    await fetch("/api/habits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, archived: 1 }),
    });
    load();
  }

  async function deleteHabit(id: number) {
    if (!confirm("Delete this habit and all its history?")) return;
    await fetch("/api/habits", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setEditHabit(null);
    load();
  }

  function resetForm() {
    setFormName(""); setFormIcon("✅"); setFormColor("violet");
    setFormCategory(""); setFormTarget(1); setFormUnit("");
    setShowAdd(false);
  }

  function startEdit(h: Habit) {
    setFormName(h.name); setFormIcon(h.icon); setFormColor(h.color); setFormCategory(h.category);
    setEditHabit(h);
  }

  // Week days to display
  const weekDays = getDaysArray(7).map((d, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i) + weekOffset * 7);
    return formatDate(date);
  });

  const today = formatDate(new Date());
  const todayCompleted = habits.filter(h => logs.some(l => l.habit_id === h.id && l.date === today)).length;
  const totalActive = habits.filter(h => !h.archived).length;
  const bestStreak = Math.max(0, ...habits.map(h => getStreak(h.id, logs)));

  // Group by category
  const categories = Array.from(new Set(habits.filter(h => !h.archived).map(h => h.category || "Uncategorized")));

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/10">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            Habits
          </h1>
          <p className="text-gray-600 dark:text-white/30 text-sm mt-1">Build consistency, track your streaks</p>
        </div>
        <button onClick={() => { resetForm(); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-violet-500/20">
          <Plus className="w-4 h-4" /> New Habit
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-4 border border-gray-200/80 dark:border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] text-gray-600 dark:text-white/30 uppercase tracking-wider">Today</span>
          </div>
          <div className="text-2xl font-bold">{todayCompleted}<span className="text-sm text-gray-500 dark:text-white/20">/{totalActive}</span></div>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-gray-200/80 dark:border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] text-gray-600 dark:text-white/30 uppercase tracking-wider">Completion</span>
          </div>
          <div className="text-2xl font-bold">{totalActive > 0 ? Math.round((todayCompleted / totalActive) * 100) : 0}<span className="text-sm text-gray-500 dark:text-white/20">%</span></div>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-gray-200/80 dark:border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] text-gray-600 dark:text-white/30 uppercase tracking-wider">Best Streak</span>
          </div>
          <div className="text-2xl font-bold">{bestStreak}<span className="text-sm text-gray-500 dark:text-white/20"> days</span></div>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-gray-200/80 dark:border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] text-gray-600 dark:text-white/30 uppercase tracking-wider">Active</span>
          </div>
          <div className="text-2xl font-bold">{totalActive}<span className="text-sm text-gray-500 dark:text-white/20"> habits</span></div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-1.5 rounded-lg glass-card hover:bg-gray-100 dark:bg-white/[0.06] transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-white/40" />
          </button>
          <button onClick={() => setWeekOffset(weekOffset + 1)} disabled={weekOffset >= 0}
            className="p-1.5 rounded-lg glass-card hover:bg-gray-100 dark:bg-white/[0.06] transition-colors disabled:opacity-20">
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-white/40" />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">This week</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="glass-card rounded-2xl h-16 shimmer" />)}
        </div>
      ) : habits.filter(h => !h.archived).length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-gray-200/80 dark:border-white/[0.06]">
          <Target className="w-10 h-10 text-gray-500 dark:text-white/10 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-white/30 text-sm">No habits yet</p>
          <button onClick={() => { resetForm(); setShowAdd(true); }}
            className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors">+ Create your first habit</button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {categories.map(cat => {
              const catHabits = habits.filter(h => !h.archived && (h.category || "Uncategorized") === cat);
              if (catHabits.length === 0) return null;
              return (
                <div key={cat} className="mb-4 sm:mb-6">
                  {categories.length > 1 && (
                    <div className="text-[10px] text-gray-500 dark:text-white/20 uppercase tracking-wider mb-3 px-1">Heading {cat}</div>
                  )}

                  {/* Column headers — day labels */}
                  <div className="flex items-center mb-2 overflow-x-auto">
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-[10px] font-medium text-gray-500 dark:text-white/20 px-1">Habit</div>
                      {weekDays.map(d => {
                        const date = new Date(d + "T12:00:00");
                        const isToday = d === today;
                        return (
                          <div key={d} className={`flex-1 text-center text-[10px] min-w-[60px] ${isToday ? "text-violet-400 font-medium" : "text-gray-500 dark:text-white/20"}`}>
                            {date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}
                            <div className={`text-[9px] ${isToday ? "text-violet-400/60" : "text-gray-500 dark:text-white/10"}`}>{date.getDate()}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Habit rows */}
                  <div className="space-y-2">
                    {catHabits.map((habit, i) => {
                      const c = COLORS[habit.color] || COLORS.violet;
                      const streak = getStreak(habit.id, logs);
                      const rate = getCompletionRate(habit.id, logs, 30);
                      return (
                        <div key={habit.id} className="glass-card rounded-xl border border-gray-200/80 dark:border-white/[0.06] p-3 flex items-center gap-3 group transition-all duration-300 hover:border-gray-300 dark:border-white/[0.1]"
                          style={{ animationDelay: `${i * 40}ms` }}>
                          {/* Habit info */}
                          <div className="w-[140px] sm:w-[180px] md:w-[200px] lg:w-[220px] shrink-0 flex items-center gap-3">
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center text-lg text-xs sm:text-base shrink-0`}>
                              {habit.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-medium truncate">{habit.name}</div>
                              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                                {streak > 0 && (
                                  <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                                    🔥 {streak}d
                                  </span>
                                )}
                                <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-white/20">{rate}% (30d)</span>
                              </div>
                            </div>
                            <button onClick={() => startEdit(habit)}
                              className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:bg-white/5 transition-all ml-auto">
                              <Settings2 className="w-3 h-3 text-gray-600 dark:text-white/30" />
                            </button>
                          </div>

                          {/* Week checkboxes */}
                          <div className="flex-1 flex items-center justify-start">
                            {weekDays.map(d => {
                              const logged = logs.some(l => l.habit_id === habit.id && l.date === d);
                              const isToday = d === today;
                              return (
                                <div key={d} className="flex-1 flex justify-center">
                                  <button onClick={() => toggleLog(habit.id, d)}
                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all duration-300 flex items-center justify-center text-xs sm:text-sm ${
                                      logged
                                        ? `${c.check} text-white shadow-lg shadow-${habit.color}-500/20 scale-100`
                                        : isToday
                                          ? `bg-gray-100 dark:bg-white/[0.06] border border-dashed ${c.border} hover:${c.bg} hover:scale-110`
                                          : "bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:bg-white/[0.06] hover:scale-110"
                                    }`}>
                                    {logged && <span>✓</span>}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      {(showAdd || editHabit) && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
          onClick={() => { setShowAdd(false); setEditHabit(null); resetForm(); }}>
          <div onClick={e => e.stopPropagation()}
            className="glass-card border border-gray-200 dark:border-white/[0.08] rounded-2xl p-6 w-full max-w-md mx-4 sm:mx-6 space-y-5 animate-slide-up shadow-2xl shadow-black/50 sm:min-w-[450px]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editHabit ? "Edit Habit" : "New Habit"}</h2>
              <button onClick={() => { setShowAdd(false); setEditHabit(null); resetForm(); }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:bg-white/5 transition-colors">
                <X className="w-4 h-4 text-gray-600 dark:text-white/40" />
              </button>
            </div>

            {/* Name */}
            <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Habit name..."
              className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" autoFocus />

            {/* Icon picker */}
            <div>
              <label className="text-[10px] text-gray-600 dark:text-white/30 uppercase tracking-wider mb-2 block">Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(ic => (
                  <button key={ic} onClick={() => setFormIcon(ic)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all duration-200 ${
                      formIcon === ic ? "bg-violet-500/20 border border-violet-500/30 scale-110" : "bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:bg-white/[0.06]"
                    }`}>{ic}</button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="text-[10px] text-gray-600 dark:text-white/30 uppercase tracking-wider mb-2 block">Color</label>
              <div className="flex gap-2">
                {Object.keys(COLORS).map(c => (
                  <button key={c} onClick={() => setFormColor(c)}
                    className={`w-8 h-8 rounded-full ${COLORS[c].check} transition-all duration-200 ${
                      formColor === c ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0a0a0f] " + COLORS[c].ring + " scale-110" : "opacity-50 hover:opacity-80"
                    }`} />
                ))}
              </div>
            </div>

            {/* Category */}
            <input value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="Category (optional)"
              className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />

            {/* Actions */}
            <div className="flex gap-2 justify-between">
              {editHabit && (
                <div className="flex gap-2">
                  <button onClick={() => { archiveHabit(editHabit.id); setEditHabit(null); resetForm(); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-white/[0.03] text-gray-600 dark:text-white/40 hover:text-gray-500 dark:text-white/60 transition-colors">
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </button>
                  <button onClick={() => deleteHabit(editHabit.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl bg-red-50 dark:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
              <button onClick={editHabit ? updateHabit : addHabit}
                className="ml-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-violet-500/20">
                {editHabit ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
