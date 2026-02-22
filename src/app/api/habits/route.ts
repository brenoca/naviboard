export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

db.exec(`CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '✅',
  color TEXT DEFAULT 'violet',
  frequency TEXT DEFAULT 'daily',
  target INTEGER DEFAULT 1,
  unit TEXT DEFAULT '',
  category TEXT DEFAULT '',
  archived INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`);

db.exec(`CREATE TABLE IF NOT EXISTS habit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  value INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(habit_id, date),
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
)`);

export async function GET(req: NextRequest) {
  const range = parseInt(req.nextUrl.searchParams.get("range") || "90");
  const includeArchived = req.nextUrl.searchParams.get("archived") === "true";

  const habits = db.prepare(
    `SELECT * FROM habits ${includeArchived ? "" : "WHERE archived = 0"} ORDER BY sort_order, created_at`
  ).all();

  const logs = db.prepare(
    "SELECT * FROM habit_logs WHERE date >= date('now', ? || ' days') ORDER BY date DESC"
  ).all(`-${range}`);

  return NextResponse.json({ habits, logs });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "log") {
    const { habit_id, date, value, notes } = body;
    const d = date || new Date().toISOString().slice(0, 10);
    const existing = db.prepare("SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?").get(habit_id, d) as { id: number } | undefined;
    if (existing) {
      if (value === 0) {
        db.prepare("DELETE FROM habit_logs WHERE id = ?").run(existing.id);
      } else {
        db.prepare("UPDATE habit_logs SET value = ?, notes = ? WHERE id = ?").run(value || 1, notes || "", existing.id);
      }
    } else if (value !== 0) {
      db.prepare("INSERT INTO habit_logs (habit_id, date, value, notes) VALUES (?, ?, ?, ?)").run(habit_id, d, value || 1, notes || "");
    }
    return NextResponse.json({ ok: true });
  }

  // Create habit
  const { name, icon, color, frequency, target, unit, category } = body;
  const maxOrder = db.prepare("SELECT MAX(sort_order) as m FROM habits").get() as { m: number | null };
  const result = db.prepare(
    "INSERT INTO habits (name, icon, color, frequency, target, unit, category, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(name, icon || "✅", color || "violet", frequency || "daily", target || 1, unit || "", category || "", (maxOrder.m || 0) + 1);
  return NextResponse.json({ ok: true, id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  const { id, ...fields } = await req.json();
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) { sets.push(`${k} = ?`); vals.push(v); }
  }
  if (sets.length > 0) {
    vals.push(id);
    db.prepare(`UPDATE habits SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  db.prepare("DELETE FROM habit_logs WHERE habit_id = ?").run(id);
  db.prepare("DELETE FROM habits WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
