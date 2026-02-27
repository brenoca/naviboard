"use client";
import { useEffect, useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, X, CheckSquare, Sparkles, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Task {
  id: number;
  name: string;
  status: string;
  priority: string;
  category: string;
  due_date: string;
  notes: string;
  execution_run_id?: string;
}

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
  High: "bg-red-50 dark:bg-red-500/10 text-red-400/80 border border-red-500/10",
  Medium: "bg-amber-500/10 text-amber-400/80 border border-amber-500/10",
  Low: "bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/10",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editing, setEditing] = useState<Task | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [loadingEnrich, setLoadingEnrich] = useState<Record<number, boolean>>({});
  const [loadingExecute, setLoadingExecute] = useState<Record<number, boolean>>({});
  const [pollingId, setPollingId] = useState<number | null>(null);

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

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-2 sm:gap-4 md:gap-5 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="min-w-[180px] sm:min-w-[220px] md:min-w-[260px] w-fit shrink-0 px-1">
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
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-medium animate-pulse">
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

                              <div className="text-sm font-medium text-gray-800 dark:text-white/85 pr-16">{task.name}</div>
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {task.priority && <span className={`text-[10px] px-2 py-0.5 rounded-md ${PRIORITY_BADGES[task.priority] || ""}`}>{task.priority}</span>}
                                {task.category && <span className="text-[10px] px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400/70 border border-violet-500/10">{task.category}</span>}
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
              <button onClick={() => deleteTask(editing.id)} className="px-4 py-2 text-sm bg-red-50 dark:bg-red-500/10 text-red-400/80 rounded-lg hover:bg-red-500/20 transition-all duration-200">Delete</button>
              <button onClick={() => { updateTask(editing); setEditing(null); }} className="px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all duration-300 font-medium">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
