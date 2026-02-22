"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Heart, Plus, X, Utensils, Dumbbell, Moon, Timer, Droplets,
  TrendingUp, Flame, Footprints, Brain, Trash2, ChevronLeft, ChevronRight
} from "lucide-react";

interface HealthEntry {
  id: number; type: string; date: string; time: string;
  title: string; value: string; unit: string; notes: string; metadata: string;
}

interface DailyMetrics {
  date: string; weight?: number; body_fat?: number; water_liters?: number;
  calories?: number; protein?: number; steps?: number; sleep_hours?: number;
  sleep_quality?: string; fasting_start?: string; fasting_end?: string;
  fasting_hours?: number; mood?: string; energy?: number; notes?: string;
}

const ENTRY_TYPES = [
  { id: "diet", label: "Diet", icon: Utensils, color: "from-emerald-500/20 to-emerald-600/5", accent: "text-emerald-400", border: "border-emerald-500/20" },
  { id: "workout", label: "Workout", icon: Dumbbell, color: "from-blue-500/20 to-blue-600/5", accent: "text-blue-400", border: "border-blue-500/20" },
  { id: "sleep", label: "Sleep", icon: Moon, color: "from-violet-500/20 to-violet-600/5", accent: "text-violet-400", border: "border-violet-500/20" },
  { id: "fasting", label: "Fasting", icon: Timer, color: "from-amber-500/20 to-amber-600/5", accent: "text-amber-400", border: "border-amber-500/20" },
  { id: "supplement", label: "Supplement", icon: Droplets, color: "from-cyan-500/20 to-cyan-600/5", accent: "text-cyan-400", border: "border-cyan-500/20" },
];

const MOODS = ["😫", "😕", "😐", "🙂", "😁"];
// Available for future sleep quality selector
// const SLEEP_QUALITY = ["Poor", "Fair", "Good", "Great", "Excellent"];

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function HealthPage() {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<DailyMetrics[]>([]);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState("diet");
  const [loading, setLoading] = useState(true);

  // Add form state
  const [formTitle, setFormTitle] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [dayRes, histRes] = await Promise.all([
      fetch(`/api/health?date=${selectedDate}`),
      fetch(`/api/health?range=30`),
    ]);
    const dayData = await dayRes.json();
    const histData = await histRes.json();
    setEntries(dayData.entries || []);
    setMetrics(dayData.metrics || null);
    setMetricsHistory(Array.isArray(histData.metrics) ? histData.metrics : []);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => { load(); }, [load]);

  function shiftDate(days: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(formatDate(d));
  }

  const isToday = selectedDate === formatDate(new Date());

  async function addEntry() {
    if (!formTitle.trim()) return;
    await fetch("/api/health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: addType, date: selectedDate, time: formTime,
        title: formTitle, value: formValue, unit: formUnit, notes: formNotes,
      }),
    });
    setFormTitle(""); setFormValue(""); setFormUnit(""); setFormTime(""); setFormNotes("");
    setShowAddModal(false);
    load();
  }

  async function deleteEntry(id: number) {
    await fetch("/api/health", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function updateMetric(field: string, value: string | number) {
    await fetch("/api/health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "metrics", data: { date: selectedDate, [field]: value } }),
    });
    load();
  }

  const dayLabel = isToday ? "Today" : new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/5 border border-rose-500/10">
              <Heart className="w-5 h-5 text-rose-400" />
            </div>
            Health
          </h1>
          <p className="text-white/30 text-sm mt-1">Track your diet, workouts, sleep, and fasting</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30">
          <Plus className="w-4 h-4" /> Log Entry
        </button>
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button onClick={() => shiftDate(-1)} className="p-2 rounded-lg glass-card hover:bg-white/[0.06] transition-colors">
          <ChevronLeft className="w-4 h-4 text-white/40" />
        </button>
        <div className="text-center min-w-[160px]">
          <div className="text-lg font-semibold">{dayLabel}</div>
          <div className="text-xs text-white/30">{selectedDate}</div>
        </div>
        <button onClick={() => shiftDate(1)} disabled={isToday}
          className="p-2 rounded-lg glass-card hover:bg-white/[0.06] transition-colors disabled:opacity-20">
          <ChevronRight className="w-4 h-4 text-white/40" />
        </button>
        {!isToday && (
          <button onClick={() => setSelectedDate(formatDate(new Date()))}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Today</button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { id: "overview", label: "Overview", icon: TrendingUp },
          ...ENTRY_TYPES,
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-violet-500/20 to-blue-500/20 text-white border border-violet-500/20 shadow-lg shadow-violet-500/10"
                : "glass-card text-white/40 hover:text-white/70"
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 h-28 shimmer" />
          ))}
        </div>
      ) : activeTab === "overview" ? (
        /* Overview Dashboard */
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon={Flame} label="Calories" value={metrics?.calories} unit="kcal"
              color="from-orange-500/20 to-orange-600/5" accent="text-orange-400"
              onEdit={(v) => updateMetric("calories", parseInt(v))} />
            <MetricCard icon={Droplets} label="Water" value={metrics?.water_liters} unit="L"
              color="from-cyan-500/20 to-cyan-600/5" accent="text-cyan-400"
              onEdit={(v) => updateMetric("water_liters", parseFloat(v))} />
            <MetricCard icon={Moon} label="Sleep" value={metrics?.sleep_hours} unit="hrs"
              color="from-violet-500/20 to-violet-600/5" accent="text-violet-400"
              onEdit={(v) => updateMetric("sleep_hours", parseFloat(v))} />
            <MetricCard icon={Footprints} label="Steps" value={metrics?.steps} unit=""
              color="from-emerald-500/20 to-emerald-600/5" accent="text-emerald-400"
              onEdit={(v) => updateMetric("steps", parseInt(v))} />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon={TrendingUp} label="Weight" value={metrics?.weight} unit="kg"
              color="from-blue-500/20 to-blue-600/5" accent="text-blue-400"
              onEdit={(v) => updateMetric("weight", parseFloat(v))} />
            <MetricCard icon={Dumbbell} label="Protein" value={metrics?.protein} unit="g"
              color="from-rose-500/20 to-rose-600/5" accent="text-rose-400"
              onEdit={(v) => updateMetric("protein", parseInt(v))} />
            <MetricCard icon={Timer} label="Fasting" value={metrics?.fasting_hours} unit="hrs"
              color="from-amber-500/20 to-amber-600/5" accent="text-amber-400"
              onEdit={(v) => updateMetric("fasting_hours", parseFloat(v))} />
            <div className="glass-card rounded-2xl p-4 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-pink-400" />
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Mood</span>
              </div>
              <div className="flex gap-2 mt-1">
                {MOODS.map((m, i) => (
                  <button key={i} onClick={() => updateMetric("mood", m)}
                    className={`text-lg transition-all duration-200 hover:scale-125 ${metrics?.mood === m ? "scale-125 drop-shadow-lg" : "opacity-40 hover:opacity-80"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Energy Level */}
          <div className="glass-card rounded-2xl p-5 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/60">Energy Level</span>
              <span className="text-sm font-semibold">{metrics?.energy || 0}/10</span>
            </div>
            <div className="flex gap-1.5">
              {[...Array(10)].map((_, i) => (
                <button key={i} onClick={() => updateMetric("energy", i + 1)}
                  className={`flex-1 h-3 rounded-full transition-all duration-300 ${
                    i < (metrics?.energy || 0)
                      ? i < 3 ? "bg-red-500/60" : i < 6 ? "bg-amber-500/60" : "bg-emerald-500/60"
                      : "bg-white/[0.06]"
                  } hover:scale-y-150`} />
              ))}
            </div>
          </div>

          {/* Today's Entries */}
          <div>
            <h2 className="text-sm font-medium text-white/40 mb-3 uppercase tracking-wider">Today&apos;s Log</h2>
            {entries.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center border border-white/[0.06]">
                <p className="text-white/20 text-sm">No entries yet for this day</p>
                <button onClick={() => setShowAddModal(true)}
                  className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors">+ Add your first entry</button>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry, i) => {
                  const typeInfo = ENTRY_TYPES.find(t => t.id === entry.type);
                  const Icon = typeInfo?.icon || Heart;
                  return (
                    <div key={entry.id} className="glass-card rounded-xl p-4 border border-white/[0.06] group transition-all duration-300 hover:border-white/[0.1]"
                      style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${typeInfo?.color || "from-white/10 to-white/5"}`}>
                          <Icon className={`w-4 h-4 ${typeInfo?.accent || "text-white/60"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{entry.title}</span>
                            {entry.value && (
                              <span className="text-xs text-white/40">{entry.value}{entry.unit && ` ${entry.unit}`}</span>
                            )}
                          </div>
                          {entry.notes && <div className="text-xs text-white/30 mt-0.5 truncate">{entry.notes}</div>}
                        </div>
                        {entry.time && <span className="text-[10px] text-white/20">{entry.time}</span>}
                        <button onClick={() => deleteEntry(entry.id)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all duration-200">
                          <Trash2 className="w-3.5 h-3.5 text-red-400/60" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weight Trend (last 30 days) */}
          {metricsHistory.filter(m => m.weight).length > 1 && (
            <div className="glass-card rounded-2xl p-5 border border-white/[0.06]">
              <h2 className="text-sm font-medium text-white/40 mb-4 uppercase tracking-wider">Weight Trend (30 days)</h2>
              <div className="flex items-end gap-1 h-32">
                {metricsHistory.filter(m => m.weight).reverse().map((m, i) => {
                  const weights = metricsHistory.filter(x => x.weight).map(x => x.weight!);
                  const min = Math.min(...weights) - 1;
                  const max = Math.max(...weights) + 1;
                  const pct = ((m.weight! - min) / (max - min)) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar" title={`${m.date}: ${m.weight}kg`}>
                      <div className="w-full rounded-t bg-gradient-to-t from-blue-500/40 to-blue-400/20 transition-all duration-300 group-hover/bar:from-blue-500/60"
                        style={{ height: `${Math.max(pct, 5)}%` }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Category View */
        <div>
          {(() => {
            const typeInfo = ENTRY_TYPES.find(t => t.id === activeTab);
            const filtered = entries.filter(e => e.type === activeTab);
            return (
              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <div className="glass-card rounded-2xl p-8 text-center border border-white/[0.06]">
                    <p className="text-white/20 text-sm">No {typeInfo?.label.toLowerCase()} entries for this day</p>
                    <button onClick={() => { setAddType(activeTab); setShowAddModal(true); }}
                      className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors">+ Add entry</button>
                  </div>
                ) : (
                  filtered.map((entry) => {
                    const Icon = typeInfo?.icon || Heart;
                    return (
                      <div key={entry.id} className={`glass-card rounded-xl p-4 border ${typeInfo?.border || "border-white/[0.06]"} group transition-all duration-300`}>
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${typeInfo?.accent}`} />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{entry.title}</div>
                            <div className="flex items-center gap-3 mt-1">
                              {entry.value && <span className="text-xs text-white/50">{entry.value}{entry.unit && ` ${entry.unit}`}</span>}
                              {entry.time && <span className="text-xs text-white/20">{entry.time}</span>}
                            </div>
                            {entry.notes && <div className="text-xs text-white/30 mt-1.5">{entry.notes}</div>}
                          </div>
                          <button onClick={() => deleteEntry(entry.id)}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all">
                            <Trash2 className="w-3.5 h-3.5 text-red-400/60" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div onClick={e => e.stopPropagation()}
            className="glass-card border border-white/[0.08] rounded-2xl p-6 w-full max-w-md space-y-4 animate-slide-up shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Log Entry</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            {/* Type Selector */}
            <div className="flex gap-2 flex-wrap">
              {ENTRY_TYPES.map(t => (
                <button key={t.id} onClick={() => setAddType(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    addType === t.id
                      ? `bg-gradient-to-r ${t.color} ${t.accent} border ${t.border}`
                      : "bg-white/[0.03] text-white/40 hover:text-white/60"
                  }`}>
                  <t.icon className="w-3 h-3" />{t.label}
                </button>
              ))}
            </div>

            <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder={
              addType === "diet" ? "What did you eat?" :
              addType === "workout" ? "What exercise?" :
              addType === "sleep" ? "Sleep note" :
              addType === "fasting" ? "Fasting window" :
              "Supplement name"
            } className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />

            <div className="grid grid-cols-3 gap-3">
              <input value={formValue} onChange={e => setFormValue(e.target.value)} placeholder="Amount"
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
              <input value={formUnit} onChange={e => setFormUnit(e.target.value)} placeholder={
                addType === "diet" ? "kcal / g" : addType === "workout" ? "min / reps" : "hrs"
              } className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
              <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)}
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
            </div>

            <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Notes (optional)"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm h-20 resize-none focus:outline-none focus:border-violet-500/50 transition-colors" />

            <button onClick={addEntry}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-violet-500/20">
              Add Entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Reusable Metric Card */
function MetricCard({ icon: Icon, label, value, unit, color, accent, onEdit }: {
  icon: React.ElementType; label: string; value?: number | null;
  unit: string; color: string; accent: string;
  onEdit: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");

  return (
    <div className="glass-card rounded-2xl p-4 border border-white/[0.06] group transition-all duration-300 hover:border-white/[0.1]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${color}`}>
            <Icon className={`w-3.5 h-3.5 ${accent}`} />
          </div>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
        </div>
      </div>
      {editing ? (
        <input autoFocus value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onBlur={() => { if (editVal) onEdit(editVal); setEditing(false); }}
          onKeyDown={e => { if (e.key === "Enter") { if (editVal) onEdit(editVal); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
          className="bg-transparent text-2xl font-bold w-full focus:outline-none" placeholder="0" />
      ) : (
        <div className="cursor-pointer" onClick={() => { setEditVal(value?.toString() || ""); setEditing(true); }}>
          <span className="text-2xl font-bold">{value ?? "—"}</span>
          {unit && value && <span className="text-xs text-white/30 ml-1">{unit}</span>}
        </div>
      )}
    </div>
  );
}
