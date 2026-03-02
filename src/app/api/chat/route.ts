import { NextRequest } from "next/server";

const GATEWAY_URL = "http://127.0.0.1:18789/v1/chat/completions";
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";
const SESSION_KEY = process.env.OPENCLAW_CHAT_SESSION || "agent:main:main";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GATEWAY_TOKEN}`,
      "x-openclaw-session-key": SESSION_KEY,
    },
    body: JSON.stringify({
      model: "openclaw:main",
      stream: true,
      messages: messages.slice(-1), // Only send latest; gateway has full session context
    }),
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ error: "Gateway error" }), { status: res.status });
  }

  // Forward the SSE stream
  return new Response(res.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
