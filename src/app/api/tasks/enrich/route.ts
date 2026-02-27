import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OLLAMA_URL = "http://127.0.0.1:11434/v1/chat/completions";
const MODEL = "gpt-oss:120b";

const SYSTEM_PROMPT = `You are a task planning expert. When given a task, you enrich it with structured, actionable detail. Always respond in this exact format:

## Goal
A clear 1-2 sentence statement of what success looks like.

## Description
A brief paragraph explaining what this task is about and why it matters.

## Execution Steps
A numbered list of concrete steps to complete the task.

## Success Criteria
A bullet list of measurable outcomes that confirm the task is done.

## Notes
Any risks, dependencies, or tips worth knowing.

Be concise and practical. No fluff. Write for someone who needs to pick this up and execute it.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, status, priority, notes } = body;

    const userPrompt = [
      `Task: ${name}`,
      category ? `Category: ${category}` : "",
      `Priority: ${priority || "Medium"}`,
      `Status: ${status || "idea"}`,
      notes ? `Existing Notes: ${notes}` : "",
      "",
      "Enrich this task with a goal, description, execution steps, success criteria, and notes.",
    ].filter(Boolean).join("\n");

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Ollama error:", err);
      return NextResponse.json({ error: "LLM call failed" }, { status: 502 });
    }

    const data = await response.json();
    const enrichedNotes = data.choices?.[0]?.message?.content?.trim() || "";

    if (!enrichedNotes) {
      return NextResponse.json({ error: "Empty response from LLM" }, { status: 502 });
    }

    return NextResponse.json({ enrichedNotes });
  } catch (error) {
    console.error("Enrich error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
