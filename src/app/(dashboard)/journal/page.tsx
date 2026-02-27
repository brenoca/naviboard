"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen, ChevronLeft, ChevronRight, Save, Eye, Edit3,
  Search, X, Calendar, Hash, Sparkles
} from "lucide-react";

interface JournalEntry {
  id?: number; date: string; content?: string; preview?: string;
  mood?: string; tags?: string; word_count?: number;
}

const MOODS = [
  { emoji: "😫", label: "Rough" },
  { emoji: "😕", label: "Meh" },
  { emoji: "😐", label: "Okay" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😁", label: "Great" },
];

const PROMPTS = [
  "What's on your mind today?",
  "What are you grateful for?",
  "What did you learn today?",
  "What challenge did you face?",
  "What made you smile?",
  "What's your intention for tomorrow?",
  "Describe today in three words.",
  "What would you do differently?",
];

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getStreakDays(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;
  const dates = new Set(entries.map(e => e.date));
  let streak = 0;
  const d = new Date();
  // Check if today or yesterday has an entry (allow current day gap)
  if (!dates.has(formatDate(d))) {
    d.setDate(d.getDate() - 1);
    if (!dates.has(formatDate(d))) return 0;
  }
  while (dates.has(formatDate(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [, setEntry] = useState<JournalEntry | null>(null);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [editMode, setEditMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<JournalEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [prompt, setPrompt] = useState("");
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isToday = selectedDate === formatDate(new Date());

  const loadEntry = useCallback(async (date: string) => {
    const res = await fetch(`/api/journal?date=${date}`);
    const data = await res.json();
    if (data.entry) {
      setEntry(data.entry);
      setContent(data.entry.content || "");
      setMood(data.entry.mood || "");
      setTags(data.entry.tags ? JSON.parse(data.entry.tags) : []);
      setEditMode(false);
    } else {
      setEntry(null);
      setContent("");
      setMood("");
      setTags([]);
      setEditMode(true);
    }
    setSaved(false);
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/journal?range=90");
    const data = await res.json();
    setHistory(data.entries || []);
  }, []);

  useEffect(() => { loadEntry(selectedDate); loadHistory(); }, [selectedDate, loadEntry, loadHistory]);

  useEffect(() => {
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  }, [selectedDate]);

  async function save() {
    setSaving(true);
    await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, content, mood, tags }),
    });
    setSaving(false);
    setSaved(true);
    loadHistory();
    setTimeout(() => setSaved(false), 2000);
  }

  function handleContentChange(val: string) {
    setContent(val);
    setSaved(false);
    // Auto-save after 2s of inactivity
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (val.trim()) save();
    }, 2000);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  }

  function removeTag(t: string) {
    setTags(tags.filter(x => x !== t));
  }

  function shiftDate(days: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(formatDate(d));
  }

  async function doSearch() {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/journal?search=${encodeURIComponent(searchQuery)}`);
    const data = await res.json();
    setSearchResults(data.entries || []);
    setSearching(false);
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const streak = getStreakDays(history);
  const dayLabel = isToday ? "Today" : new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // Calendar heatmap for last 90 days
  const entryDates = new Set(history.map(e => e.date));

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/5 border border-indigo-500/10">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            Journal
          </h1>
          <p className="text-gray-600 dark:text-white/30 text-sm mt-1">Daily reflections and thoughts</p>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card border border-amber-500/10">
              <span className="text-amber-400 text-sm">🔥</span>
              <span className="text-xs font-medium text-amber-400">{streak} day streak</span>
            </div>
          )}
          <button onClick={() => setShowHistory(!showHistory)}
            className="p-2.5 rounded-xl glass-card hover:bg-gray-100 dark:bg-white/[0.06] transition-colors" title="History">
            <Calendar className="w-4 h-4 text-gray-600 dark:text-white/40" />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Editor */}
        <div className="flex-1 min-w-0">
          {/* Date Navigator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => shiftDate(-1)} className="p-2 rounded-lg glass-card hover:bg-gray-100 dark:bg-white/[0.06] transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-white/40" />
              </button>
              <div>
                <div className="text-lg font-semibold">{dayLabel}</div>
                <div className="text-xs text-gray-500 dark:text-white/20">{selectedDate}</div>
              </div>
              <button onClick={() => shiftDate(1)} disabled={isToday}
                className="p-2 rounded-lg glass-card hover:bg-gray-100 dark:bg-white/[0.06] transition-colors disabled:opacity-20">
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-white/40" />
              </button>
              {!isToday && (
                <button onClick={() => setSelectedDate(formatDate(new Date()))}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors ml-2">Today</button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-white/20">{wordCount} words</span>
              <button onClick={() => setEditMode(!editMode)}
                className="p-2 rounded-lg glass-card hover:bg-gray-100 dark:bg-white/[0.06] transition-colors" title={editMode ? "Preview" : "Edit"}>
                {editMode ? <Eye className="w-4 h-4 text-gray-600 dark:text-white/40" /> : <Edit3 className="w-4 h-4 text-gray-600 dark:text-white/40" />}
              </button>
              <button onClick={save} disabled={saving}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  saved
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                    : "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/20"
                }`}>
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
              </button>
            </div>
          </div>

          {/* Mood Selector */}
          <div className="glass-card rounded-2xl p-4 border border-gray-200/80 dark:border-white/[0.06] mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-white/30 uppercase tracking-wider">How are you feeling?</span>
              <div className="flex gap-3">
                {MOODS.map(m => (
                  <button key={m.emoji} onClick={() => setMood(m.emoji)}
                    className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                      mood === m.emoji ? "scale-125" : "opacity-40 hover:opacity-80 hover:scale-110"
                    }`}>
                    <span className="text-xl">{m.emoji}</span>
                    <span className={`text-[9px] ${mood === m.emoji ? "text-gray-500 dark:text-white/60" : "text-transparent dark:text-white/0"} transition-colors`}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Editor / Preview */}
          <div className="glass-card rounded-2xl border border-gray-200/80 dark:border-white/[0.06] overflow-hidden min-h-[400px]">
            {editMode ? (
              <div className="relative">
                {!content && (
                  <div className="absolute top-5 left-6 right-6 pointer-events-none">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-white/15">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm italic">{prompt}</span>
                    </div>
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={e => handleContentChange(e.target.value)}
                  className="w-full min-h-[400px] bg-transparent p-6 text-[15px] leading-relaxed text-gray-800 dark:text-white/90 resize-none focus:outline-none font-[system-ui]"
                  placeholder=""
                  autoFocus
                />
              </div>
            ) : (
              <div className="p-6 markdown-body text-[15px] leading-relaxed min-h-[400px]">
                {content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500 dark:text-white/20 italic">No entry for this day yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="mt-4 glass-card rounded-2xl p-4 border border-gray-200/80 dark:border-white/[0.06]">
            <div className="flex items-center gap-2 flex-wrap">
              <Hash className="w-3.5 h-3.5 text-gray-500 dark:text-white/20" />
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs border border-violet-500/10">
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="add tag..."
                className="bg-transparent text-xs text-gray-600 dark:text-white/40 focus:text-gray-700 dark:text-white/80 focus:outline-none w-24" />
            </div>
          </div>
        </div>

        {/* Sidebar — History & Search */}
        {showHistory && (
          <div className="w-full sm:w-72 shrink-0 animate-fade-in">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-white/20" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}
                placeholder="Search entries..."
                className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.06] rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-violet-500/30 transition-colors" />
            </div>

            {/* Mini Heatmap */}
            <div className="glass-card rounded-2xl p-4 border border-gray-200/80 dark:border-white/[0.06] mb-4">
              <div className="text-[10px] text-gray-500 dark:text-white/20 uppercase tracking-wider mb-3">Activity (90 days)</div>
              <div className="grid grid-cols-13 gap-[3px]">
                {[...Array(91)].map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (90 - i));
                  const ds = formatDate(d);
                  const has = entryDates.has(ds);
                  const isSel = ds === selectedDate;
                  return (
                    <button key={i} onClick={() => setSelectedDate(ds)}
                      className={`w-[14px] h-[14px] rounded-sm transition-all duration-200 ${
                        isSel ? "ring-1 ring-violet-400 bg-violet-500/60" :
                        has ? "bg-emerald-500/40 hover:bg-emerald-500/60" :
                        "bg-white/[0.04] hover:bg-white/[0.08]"
                      }`}
                      title={ds} />
                  );
                })}
              </div>
            </div>

            {/* Search Results or Recent Entries */}
            <div className="space-y-2">
              <div className="text-[10px] text-gray-500 dark:text-white/20 uppercase tracking-wider px-1">
                {searchResults.length > 0 ? `${searchResults.length} results` : searching ? "Searching..." : "Recent Entries"}
              </div>
              {(searchResults.length > 0 ? searchResults : history.slice(0, 20)).map(e => (
                <button key={e.date} onClick={() => { setSelectedDate(e.date); setSearchResults([]); setSearchQuery(""); }}
                  className={`w-full text-left glass-card rounded-xl p-3 border transition-all duration-200 ${
                    selectedDate === e.date ? "border-violet-500/20 bg-violet-500/5" : "border-gray-200 dark:border-white/[0.04] hover:border-gray-200 dark:border-white/[0.08]"
                  }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">
                      {new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {e.mood && <span className="text-xs">{e.mood}</span>}
                      {e.word_count ? <span className="text-[10px] text-gray-500 dark:text-white/20">{e.word_count}w</span> : null}
                    </div>
                  </div>
                  {e.preview && <div className="text-[11px] text-gray-600 dark:text-white/30 line-clamp-2">{e.preview}</div>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
