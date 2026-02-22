import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.join(dbDir, "tasks.db"));
db.pragma("journal_mode = WAL");

db.exec(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'Medium',
  category TEXT DEFAULT '',
  due_date TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`);

// Health tracking tables
db.exec(`CREATE TABLE IF NOT EXISTS health_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  date TEXT NOT NULL DEFAULT (date('now')),
  time TEXT DEFAULT '',
  title TEXT NOT NULL,
  value TEXT DEFAULT '',
  unit TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
)`);

db.exec(`CREATE TABLE IF NOT EXISTS health_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL DEFAULT (date('now')),
  weight REAL,
  body_fat REAL,
  water_liters REAL,
  calories INTEGER,
  protein INTEGER,
  steps INTEGER,
  sleep_hours REAL,
  sleep_quality TEXT,
  fasting_start TEXT,
  fasting_end TEXT,
  fasting_hours REAL,
  mood TEXT,
  energy INTEGER,
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(date)
)`);

export default db;
