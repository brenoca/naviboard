export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET - Fetch entries and daily metrics
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type"); // diet, workout, fasting, sleep, supplement
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD
  const range = req.nextUrl.searchParams.get("range"); // 7, 30, 90

  let entries;
  if (type && date) {
    entries = db.prepare("SELECT * FROM health_entries WHERE type = ? AND date = ? ORDER BY created_at DESC").all(type, date);
  } else if (type) {
    const limit = range ? parseInt(range) : 30;
    entries = db.prepare("SELECT * FROM health_entries WHERE type = ? ORDER BY date DESC, created_at DESC LIMIT ?").all(type, limit * 10);
  } else if (date) {
    entries = db.prepare("SELECT * FROM health_entries WHERE date = ? ORDER BY created_at DESC").all(date);
  } else {
    const days = range ? parseInt(range) : 7;
    entries = db.prepare("SELECT * FROM health_entries WHERE date >= date('now', ? || ' days') ORDER BY date DESC, created_at DESC").all(`-${days}`);
  }

  // Get daily metrics
  let metrics;
  if (date) {
    metrics = db.prepare("SELECT * FROM health_metrics WHERE date = ?").get(date);
  } else {
    const days = range ? parseInt(range) : 7;
    metrics = db.prepare("SELECT * FROM health_metrics WHERE date >= date('now', ? || ' days') ORDER BY date DESC").all(`-${days}`);
  }

  return NextResponse.json({ entries, metrics });
}

// POST - Add entry or update daily metrics
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "metrics") {
    // Upsert daily metrics
    const { date, ...fields } = body.data;
    const d = date || new Date().toISOString().slice(0, 10);
    const existing = db.prepare("SELECT id FROM health_metrics WHERE date = ?").get(d) as { id: number } | undefined;

    if (existing) {
      const sets: string[] = [];
      const vals: unknown[] = [];
      for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined && v !== null) {
          sets.push(`${k} = ?`);
          vals.push(v);
        }
      }
      if (sets.length > 0) {
        vals.push(existing.id);
        db.prepare(`UPDATE health_metrics SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
      }
    } else {
      const cols = ["date", ...Object.keys(fields)];
      const placeholders = cols.map(() => "?").join(", ");
      db.prepare(`INSERT INTO health_metrics (${cols.join(", ")}) VALUES (${placeholders})`).run(d, ...Object.values(fields));
    }
    return NextResponse.json({ ok: true });
  }

  // Add health entry
  const { type, date, time, title, value, unit, notes, metadata } = body;
  const stmt = db.prepare(
    "INSERT INTO health_entries (type, date, time, title, value, unit, notes, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const result = stmt.run(
    type,
    date || new Date().toISOString().slice(0, 10),
    time || "",
    title,
    value || "",
    unit || "",
    notes || "",
    metadata ? JSON.stringify(metadata) : "{}"
  );
  return NextResponse.json({ ok: true, id: result.lastInsertRowid });
}

// PUT - Update entry
export async function PUT(req: NextRequest) {
  const { id, ...fields } = await req.json();
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) {
      sets.push(`${k} = ?`);
      vals.push(k === "metadata" ? JSON.stringify(v) : v);
    }
  }
  if (sets.length > 0) {
    vals.push(id);
    db.prepare(`UPDATE health_entries SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  }
  return NextResponse.json({ ok: true });
}

// DELETE - Remove entry
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  db.prepare("DELETE FROM health_entries WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
