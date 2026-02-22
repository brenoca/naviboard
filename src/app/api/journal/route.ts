export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// Ensure table exists
db.exec(`CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  content TEXT DEFAULT '',
  mood TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  word_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`);

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const range = req.nextUrl.searchParams.get("range"); // number of days
  const search = req.nextUrl.searchParams.get("search");

  if (search) {
    const results = db.prepare(
      "SELECT id, date, substr(content, 1, 200) as preview, mood, tags, word_count FROM journal_entries WHERE content LIKE ? ORDER BY date DESC LIMIT 50"
    ).all(`%${search}%`);
    return NextResponse.json({ entries: results });
  }

  if (date) {
    const entry = db.prepare("SELECT * FROM journal_entries WHERE date = ?").get(date);
    return NextResponse.json({ entry: entry || null });
  }

  const days = range ? parseInt(range) : 90;
  const entries = db.prepare(
    "SELECT id, date, substr(content, 1, 150) as preview, mood, tags, word_count FROM journal_entries WHERE date >= date('now', ? || ' days') ORDER BY date DESC"
  ).all(`-${days}`);
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const { date, content, mood, tags } = await req.json();
  const d = date || new Date().toISOString().slice(0, 10);
  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const tagsJson = tags ? JSON.stringify(tags) : "[]";

  const existing = db.prepare("SELECT id FROM journal_entries WHERE date = ?").get(d) as { id: number } | undefined;
  if (existing) {
    db.prepare(
      "UPDATE journal_entries SET content = ?, mood = ?, tags = ?, word_count = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(content || "", mood || "", tagsJson, wordCount, existing.id);
  } else {
    db.prepare(
      "INSERT INTO journal_entries (date, content, mood, tags, word_count) VALUES (?, ?, ?, ?, ?)"
    ).run(d, content || "", mood || "", tagsJson, wordCount);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { date } = await req.json();
  db.prepare("DELETE FROM journal_entries WHERE date = ?").run(date);
  return NextResponse.json({ ok: true });
}
