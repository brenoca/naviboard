import { NextRequest } from "next/server";

const GATEWAY_URL = "http://127.0.0.1:18789/v1/chat/completions";
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "4c34491c0d1da3a3f2d04706d0d0fa027b8a458a75d4395a";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GATEWAY_TOKEN}`,
    },
    body: JSON.stringify({
      model: "openclaw:main",
      stream: true,
      user: "naviboard-chat",
      messages,
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
