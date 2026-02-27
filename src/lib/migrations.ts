import db from "./db";

// Migration that adds execution_run_id column to tasks table
export function migrationAddExecutionRunId(): void {
  db.pragma("foreign_keys = off");
  try {
    db.exec("ALTER TABLE tasks ADD COLUMN execution_run_id TEXT DEFAULT ''");
    console.log("Migration added execution_run_id column");
  } catch {
    console.log("Column execution_run_id may already exist");
  }
}

// Run migrations
export function runMigrations(): void {
  try {
    migrationAddExecutionRunId();
  } catch {
    // Migration already applied or error
  }
}