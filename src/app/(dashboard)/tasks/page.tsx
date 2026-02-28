"use client";
import { useEffect, useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, X, CheckSquare, Sparkles, Rocket, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Task {
  id: number;
  name: string;
  status: string;
  priority: string;
  category: string;
  due_date: string;
  notes: string;
  updated_at?: string;
  execution_run_id?: string;
}

const DONE_FILTERS = [
  { label: "All", value: "all" },
  { label: "7d", value: "7" },
  { label: "30d", value: "30" },
  { label: "Hide", value: "hide" },
];

const COLUMNS = [
  { id: "idea", label: "Idea", emoji: "💡" },
  { id: "todo", label: "To Do", emoji: "📋" },
  { id: "in_progress", label: "In Progress", emoji: "🔄" },
  { id: "blocked", label: "Blocked", emoji: "🚫" },
  { id: "done", label: "Done", emoji: "✅" },
];

const PRIORITY_COLORS: Record<string, string> = {
  High: "border-l-red-500/70",
  Medium: "border-l-amber-500/70",
  Low: "border-l-emerald-500/70",
};

const PRIORITY_BADGES: Record<string, string> = {
  High: "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20",
  Medium: "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20",
  Low: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editing, setEditing] = useState<Task | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [loadingEnrich, setLoadingEnrich] = useState<Record<number, boolean>>({});
  const [loadingExecute, setLoadingExecute] = useState<Record<number, boolean>>({});
  const [pollingId, setPollingId] = useState<number | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDone, setFilterDone] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/tasks");
    setTasks(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll for execution status updates
  useEffect(() => {
    if (pollingId !== null) {
      const pollInterval = setInterval(async () => {
        const res = await fetch("/api/tasks");
        const updatedTasks = await res.json();
        setTasks(updatedTasks);

        // Check if we should stop polling
        const hasInProgress = updatedTasks.some((t: Task) => t.execution_run_id !== '');
        if (!hasInProgress) {
          setPollingId(null);
        }
      }, 2000);

      return () => clearInterval(pollInterval);
    }
  }, [pollingId]);

  const categories = Array.from(new Set(tasks.map(t => t.category).filter(Boolean)));
  const priorities = ["High", "Medium", "Low"];

  function filterTasks(list: Task[]): Task[] {
    return list.filter(t => {
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (t.status === "done" && filterDone !== "all") {
        if (filterDone === "hide") return false;
        const days = parseInt(filterDone);
        const updated = t.updated_at ? new Date(t.updated_at).getTime() : 0;
        const cutoff = Date.now() - days * 86400000;
        if (updated < cutoff) return false;
      }
      return true;
    });
  }

  const activeFilterCount = [filterPriority, filterCategory, filterDone].filter(f => f !== "all").length;

  async function addTask(status: string) {
    if (!newName.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, status }),
    });
    setNewName("");
    setAdding(null);
    load();
  }

  async function updateTask(task: Partial<Task> & { id: number }) {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    load();
  }

  async function enrichTask(task: Task) {
    setLoadingEnrich(prev => ({ ...prev, [task.id]: true }));
    try {
      const res = await fetch("/api/tasks/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          name: task.name,
          category: task.category,
          status: task.status,
          priority: task.priority,
          notes: task.notes,
        }),
      });
      const data = await res.json();
      if (data.enrichedNotes) {
        setEditing(prev =>
          prev && prev.id === task.id
            ? { ...prev, notes: data.enrichedNotes }
            : prev
        );
      }
    } catch (error) {
      console.error("Enrich error:", error);
    } finally {
      setLoadingEnrich(prev => ({ ...prev, [task.id]: false }));
    }
  }

  async function executeTask(task: Task) {
    setLoadingExecute(prev => ({ ...prev, [task.id]: true }));
    try {
      await fetch("/api/tasks/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          name: task.name,
          category: task.category,
          status: task.status,
          priority: task.priority,
          notes: task.notes,
        }),
      });
      // Start polling for status updates
      if (!pollingId) {
        setPollingId(task.id);
      }
    } catch (error) {
      console.error("Execute error:", error);
    } finally {
      setLoadingExecute(prev => ({ ...prev, [task.id]: false }));
    }
  }

  async function deleteTask(id: number) {
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setEditing(null);
    load();
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const taskId = parseInt(result.draggableId);
    const newStatus = result.destination.droppableId;
    updateTask({ id: taskId, status: newStatus });
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-semibold flex items-center gap-3 tracking-tight">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-gray-200/80 dark:border-white/[0.06]">
            <CheckSquare className="w-5 h-5 text-violet-400" />
          </div>
          Tasks
        </h1>
        <p className="text-sm text-gray-600 dark:text-white/30 mt-1 ml-12">Kanban board</p>
      </div>

      {/* Filter bar */}
      <div className="mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
            activeFilterCount > 0
              ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
              : "bg-gray-100 dark:bg-white/[0.03] text-gray-600 dark:text-white/40 border border-gray-200/80 dark:border-white/[0.06]"
          } hover:bg-violet-500/15`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">{activeFilterCount}</span>
          )}
        </button>

        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-3 items-center animate-fade-in-up">
            {/* Priority */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 dark:text-white/30">Priority:</span>
              <div className="flex gap-1">
                <button onClick={() => setFilterPriority("all")}
                  className={`text-xs px-2 py-1 rounded-md transition-all ${filterPriority === "all" ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300" : "bg-gray-100 dark:bg-white/[0.03] text-gray-500 dark:text-white/30 hover:bg-gray-200 dark:hover:bg-white/[0.06]"}`}>All</button>
                {priorities.map(p => (
                  <button key={p} onClick={() => setFilterPriority(filterPriority === p ? "all" : p)}
                    className={`text-xs px-2 py-1 rounded-md transition-all ${filterPriority === p ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300" : "bg-gray-100 dark:bg-white/[0.03] text-gray-500 dark:text-white/30 hover:bg-gray-200 dark:hover:bg-white/[0.06]"}`}>{p}</button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 dark:text-white/30">Category:</span>
              <div className="flex gap-1">
                <button onClick={() => setFilterCategory("all")}
                  className={`text-xs px-2 py-1 rounded-md transition-all ${filterCategory === "all" ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300" : "bg-gray-100 dark:bg-white/[0.03] text-gray-500 dark:text-white/30 hover:bg-gray-200 dark:hover:bg-white/[0.06]"}`}>All</button>
                {categories.map(c => (
                  <button key={c} onClick={() => setFilterCategory(filterCategory === c ? "all" : c)}
                    className={`text-xs px-2 py-1 rounded-md transition-all ${filterCategory === c ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300" : "bg-gray-100 dark:bg-white/[0.03] text-gray-500 dark:text-white/30 hover:bg-gray-200 dark:hover:bg-white/[0.06]"}`}>{c}</button>
                ))}
              </div>
            </div>

            {/* Done filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 dark:text-white/30">Done:</span>
              <div className="flex gap-1">
                {DONE_FILTERS.map(f => (
                  <button key={f.value} onClick={() => setFilterDone(f.value)}
                    className={`text-xs px-2 py-1 rounded-md transition-all ${filterDone === f.value ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300" : "bg-gray-100 dark:bg-white/[0.03] text-gray-500 dark:text-white/30 hover:bg-gray-200 dark:hover:bg-white/[0.06]"}`}>{f.label}</button>
                ))}
              </div>
            </div>

            {/* Clear all */}
            {activeFilterCount > 0 && (
              <button onClick={() => { setFilterPriority("all"); setFilterCategory("all"); setFilterDone("all"); }}
                className="text-xs text-red-400/70 hover:text-red-400 transition-colors ml-1">Clear all</button>
            )}
          </div>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-2 sm:gap-4 md:gap-5 pb-4 md:overflow-visible overflow-x-auto snap-x snap-mandatory">
          {COLUMNS.map(col => {
            const colTasks = filterTasks(tasks.filter(t => t.status === col.id));
            return (
              <div key={col.id} className="min-w-[85vw] sm:min-w-[85vw] md:min-w-0 md:w-0 md:flex-1 max-w-[320px] md:max-w-none shrink-0 md:shrink px-1 snap-center">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span>{col.emoji}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-white/80">{col.label}</span>
                    <span className="text-xs text-gray-500 dark:text-white/20 ml-1 bg-gray-50 dark:bg-white/[0.03] px-1.5 py-0.5 rounded-md">{colTasks.length}</span>
                  </div>
                  <button onClick={() => { setAdding(col.id); setNewName(""); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-white/20 hover:text-gray-600 dark:text-white/50 transition-all duration-200">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Gradient underline */}
                <div className="h-px bg-gradient-to-r from-violet-500/20 via-blue-500/10 to-transparent mb-3" />

                {adding === col.id && (
                  <div className="glass-card p-3 mb-2 animate-fade-in-up">
                    <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") addTask(col.id); if (e.key === "Escape") setAdding(null); }}
                      placeholder="Task name..."
                      className="w-full bg-transparent text-sm focus:outline-none placeholder:text-gray-500 dark:text-white/15 text-gray-700 dark:text-white/80" />
                    <div className="flex gap-1.5 mt-2">
                      <button onClick={() => addTask(col.id)} className="text-xs px-3 py-1 bg-gradient-to-r from-violet-600 to-blue-600 rounded-md font-medium">Add</button>
                      <button onClick={() => setAdding(null)} className="text-xs px-3 py-1 bg-gray-100 dark:bg-white/[0.05] rounded-md text-gray-600 dark:text-white/40">Cancel</button>
                    </div>
                  </div>
                )}

                <Droppable droppableId={col.id}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 min-h-[100px]">
                      {colTasks.map((task, idx) => (
                        <Draggable key={task.id} draggableId={String(task.id)} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setEditing(task)}
                              className={`glass-card p-3.5 cursor-pointer transition-all duration-300 border-l-2 relative ${
                                task.execution_run_id ? "border-l-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]" : PRIORITY_COLORS[task.priority] || "border-l-transparent"
                              } hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/5 ${
                                snapshot.isDragging ? "shadow-xl shadow-violet-500/10 ring-1 ring-violet-500/20" : ""
                              }`}
                            >
                              {/* Execution indicator */}
                              {task.execution_run_id && (
                                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 text-[10px] font-medium animate-pulse">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                    Running...
                                  </span>
                                </div>
                              )}

                              {/* Execute button for todo tasks */}
                              {task.status === 'todo' && !task.execution_run_id && (
                                <div className="absolute top-2 right-2">
                                  <Button
                                    onClick={(e) => { e.stopPropagation(); executeTask(task); }}
                                    disabled={loadingExecute[task.id]}
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 bg-gradient-to-r from-violet-600 to-blue-600 hover:shadow-lg hover:shadow-violet-500/30 text-white transition-all duration-200 disabled:opacity-50"
                                    title="Execute with AI"
                                  >
                                    <Rocket className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}

                              <div className="text-sm font-medium text-gray-800 dark:text-white/85 pr-16 line-clamp-2">{task.name}</div>
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {task.priority && <span className={`text-[10px] px-2 py-0.5 rounded-md ${PRIORITY_BADGES[task.priority] || ""}`}>{task.priority}</span>}
                                {task.category && <span className="text-[10px] px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">{task.category}</span>}
                              </div>
                              {task.due_date && <div className="text-[10px] text-gray-500 dark:text-white/20 mt-2">{task.due_date}</div>}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={() => setEditing(null)}>
          <div onClick={e => e.stopPropagation()} className="glass-card gradient-border p-6 w-full max-w-md mx-4 sm:mx-6 space-y-4 animate-slide-up sm:min-w-[520px]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-white/90">Edit Task</h2>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:bg-white/[0.05] transition-colors"><X className="w-4 h-4 text-gray-600 dark:text-white/40" /></button>
            </div>
            <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}
              className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.06] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/40 transition-all duration-200" placeholder="Name" />
            <select value={editing.priority} onChange={e => setEditing({ ...editing, priority: e.target.value })}
              className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.06] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/40 transition-all duration-200">
              <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
            </select>
            <input value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })}
              className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.06] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/40 transition-all duration-200" placeholder="Category" />
            <input type="date" value={editing.due_date} onChange={e => setEditing({ ...editing, due_date: e.target.value })}
              className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.06] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/40 transition-all duration-200" />
            <textarea value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })}
              className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.06] rounded-lg px-4 py-2.5 text-sm h-24 resize-none focus:outline-none focus:border-violet-500/40 transition-all duration-200" placeholder="Notes" />
            <div className="flex gap-2 items-center">
              <Button
                onClick={() => enrichTask(editing!)}
                disabled={loadingEnrich[editing!.id]}
                variant="outline"
                className="px-3 py-1.5 text-sm bg-white/50 dark:bg-white/[0.05] hover:bg-white/70 dark:hover:bg-white/[0.1] text-violet-600 dark:text-violet-400 transition-all duration-200 disabled:opacity-50 border-violet-200/50 dark:border-violet-500/20"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {loadingEnrich[editing!.id] ? "Gen..." : "Enrich"}
              </Button>
              <span className="text-xs text-gray-500 dark:text-white/30 ml-2">(AI suggested notes)</span>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => deleteTask(editing.id)} className="px-4 py-2 text-sm bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/20 transition-all duration-200">Delete</button>
              <button onClick={() => { updateTask(editing); setEditing(null); }} className="px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all duration-300 font-medium">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
