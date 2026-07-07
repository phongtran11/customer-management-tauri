import Database from "@tauri-apps/plugin-sql";

// =============================================================================
// Database Singleton
// =============================================================================

let dbInstance: Database | null = null;

/**
 * Returns a singleton Database connection to the SQLite database.
 * Subsequent calls return the same instance without re-opening.
 */
export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load("sqlite:customer_mgmt.db");
  }
  return dbInstance;
}

// =============================================================================
// SQL Migrations
// =============================================================================

/**
 * Initial migration SQL.
 * Creates the `customers` and `attachments` tables if they do not already exist.
 *
 * - customers: id, name, phone, created_at
 * - attachments: id, customer_id (FK), file_path, created_at
 *   - ON DELETE CASCADE ensures attachments are removed when a customer is deleted.
 */
const MIGRATION_SQL = `
  PRAGMA journal_mode=WAL;
  PRAGMA foreign_keys=ON;

  CREATE TABLE IF NOT EXISTS customers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    phone      TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    file_path   TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
`;

/**
 * Runs all required migrations against the SQLite database.
 * Safe to call on every app start — uses IF NOT EXISTS guards.
 */
export async function runMigrations(): Promise<void> {
  const db = await getDb();
  // Execute each statement individually (plugin-sql doesn't support multi-statement batches)
  const statements = MIGRATION_SQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await db.execute(statement);
  }
}
