export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const tasks = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const { name, status = "todo", priority = "Medium", category = "", due_date = "", notes = "" } = await req.json();
  const result = db.prepare(
    "INSERT INTO tasks (name, status, priority, category, due_date, notes) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(name, status, priority, category, due_date, notes);
  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  const { id, ...fields } = await req.json();
  const sets = Object.keys(fields).map(k => `${k} = ?`).join(", ");
  const vals = Object.values(fields);
  db.prepare(`UPDATE tasks SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(...vals, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
