"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, Send, Loader2, Trash2, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // Add empty assistant message for streaming
    setMessages([...newMessages, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("Failed to send");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullContent };
                return updated;
              });
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      // If we got no streamed content, try parsing as non-streamed response
      if (!fullContent && buffer) {
        try {
          const parsed = JSON.parse(buffer);
          const content = parsed.choices?.[0]?.message?.content || "";
          if (content) {
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content };
              return updated;
            });
          }
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "⚠️ Failed to get a response. Is the gateway running?",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-semibold flex items-center gap-3 tracking-tight">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-gray-200/80 dark:border-white/[0.06]">
            <MessageCircle className="w-5 h-5 text-blue-400" />
          </div>
          Chat
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-white/30 mt-1 ml-12">Talk to Navi</p>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-md text-gray-500 dark:text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
            <img src="/navi-avatar.png" alt="Navi" className="w-16 h-16 rounded-full mb-4 opacity-50" />
            <p className="text-sm text-gray-500 dark:text-white/30">Send a message to start chatting</p>
            <p className="text-xs text-gray-400 dark:text-white/15 mt-1">Shift+Enter for new line</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="shrink-0 mt-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/[0.06] flex items-center justify-center overflow-hidden">
                  <img src="/navi-avatar.png" alt="Navi" className="w-5 h-5 rounded-full" />
                </div>
              </div>
            )}

            <div
              className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-br-md"
                  : "bg-gray-100 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.06] text-gray-800 dark:text-white/80 rounded-bl-md"
              }`}
            >
              {msg.content}
              {msg.role === "assistant" && !msg.content && streaming && (
                <span className="inline-flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              )}
            </div>

            {msg.role === "user" && (
              <div className="shrink-0 mt-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-white/[0.06] flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-violet-400" />
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-3 border-t border-gray-200/80 dark:border-white/[0.06]">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Navi..."
            rows={1}
            className="flex-1 bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/[0.06] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/40 transition-all duration-200 resize-none placeholder:text-gray-400 dark:placeholder:text-white/20"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="p-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white disabled:opacity-30 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-200 shrink-0 cursor-pointer"
          >
            {streaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
