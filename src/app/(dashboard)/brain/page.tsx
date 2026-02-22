"use client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Save, Eye, Edit3, FolderOpen, Search, X } from "lucide-react";

interface FileEntry { path: string; name: string; }

export default function BrainPage() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [readonly, setReadonly] = useState(false);

  useEffect(() => {
    fetch("/api/brain/files").then(r => r.json()).then(setFiles);
  }, []);

  async function loadFile(path: string) {
    const res = await fetch(`/api/brain/file?path=${encodeURIComponent(path)}`);
    const data = await res.json();
    setContent(data.content);
    setSelected(path);
    setDirty(false);
    setReadonly(!!data.readonly);
    if (data.readonly) setEditMode(false);
  }

  async function saveFile() {
    if (!selected) return;
    setSaving(true);
    await fetch("/api/brain/file", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: selected, content }),
    });
    setSaving(false);
    setDirty(false);
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ path: string; line: number; text: string }[]>([]);
  const [searching, setSearching] = useState(false);

  async function doSearch() {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/brain/search?q=${encodeURIComponent(searchQuery)}`);
    const data = await res.json();
    setSearchResults(data.results || []);
    setSearching(false);
  }

  const grouped: Record<string, FileEntry[]> = {};
  for (const f of files) {
    const dir = f.path.includes("/") ? f.path.split("/").slice(0, -1).join("/") : ".";
    if (!grouped[dir]) grouped[dir] = [];
    grouped[dir].push(f);
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-4rem)]">
      {/* File tree sidebar */}
      <div className="w-72 shrink-0 glass-card overflow-y-auto animate-fade-in">
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-2.5">
          <FolderOpen className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-medium uppercase tracking-widest text-white/50">Files</span>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/[0.06]">
          <div className="relative group">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-violet-400 transition-colors" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
              placeholder="Search content..."
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-8 pr-8 py-2 text-xs focus:outline-none focus:border-violet-500/40 focus:shadow-[0_0_12px_rgba(139,92,246,0.1)] transition-all duration-300 placeholder:text-white/15" />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="border-b border-white/[0.06]">
            <div className="px-4 py-2 text-[10px] text-violet-400/60 font-medium uppercase tracking-widest">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
            </div>
            {searchResults.map((r, i) => (
              <button key={i} onClick={() => loadFile(r.path)}
                className="w-full text-left px-4 py-2.5 hover:bg-white/[0.03] border-b border-white/[0.03] last:border-0 transition-colors">
                <div className="text-xs text-violet-400 truncate">{r.path}</div>
                <div className="text-[10px] text-white/30 truncate mt-0.5">L{r.line}: {r.text}</div>
              </button>
            ))}
          </div>
        )}
        {searching && <div className="px-4 py-3 text-xs text-white/20 animate-pulse">Searching...</div>}

        {/* File tree */}
        <div className="py-2">
          {Object.entries(grouped).sort().map(([dir, dirFiles]) => (
            <div key={dir}>
              {dir !== "." && (
                <div className="px-4 py-2 text-[10px] text-white/20 font-medium uppercase tracking-widest">{dir}/</div>
              )}
              {dirFiles.sort((a, b) => a.name.localeCompare(b.name)).map(f => (
                <button key={f.path} onClick={() => loadFile(f.path)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-all duration-200 group relative ${
                    selected === f.path
                      ? "text-white bg-white/[0.05]"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
                  }`}>
                  {selected === f.path && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full bg-gradient-to-b from-violet-400 to-blue-400 shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
                  )}
                  <FileText className={`w-3.5 h-3.5 shrink-0 transition-colors ${selected === f.path ? "text-violet-400" : "group-hover:text-white/50"}`} />
                  <span className="truncate text-[13px]">{f.name}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col glass-card overflow-hidden animate-slide-in-right">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <span className="text-sm text-white/40 truncate font-mono">{selected || "Select a file"}</span>
          <div className="flex items-center gap-2">
            {selected && !readonly && (
              <>
                <button onClick={() => setEditMode(!editMode)}
                  className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white/80 transition-all duration-200">
                  {editMode ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                </button>
                <button onClick={saveFile} disabled={!dirty || saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-30 bg-gradient-to-r from-violet-600 to-blue-600 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                  <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
                </button>
              </>
            )}
            {selected && readonly && (
              <span className="text-[10px] text-white/20 px-3 py-1.5 bg-white/[0.03] rounded-lg uppercase tracking-widest">read-only</span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {!selected ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/20 text-sm">Select a markdown file from the sidebar</p>
            </div>
          ) : editMode ? (
            <textarea value={content} onChange={e => { setContent(e.target.value); setDirty(true); }}
              className="w-full h-full bg-transparent text-sm font-mono text-white/80 resize-none focus:outline-none leading-relaxed" />
          ) : (
            <div className="markdown-body text-sm animate-fade-in">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
