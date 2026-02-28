import initSqlJs from 'sql.js/dist/sql-asm.js';
import type { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

// ---------------------------------------------------------------------------
// Types — drop-in replacement for better-sqlite3's synchronous API
// ---------------------------------------------------------------------------

interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

interface PreparedStatement {
  run(...params: unknown[]): RunResult;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

export interface CompatDatabase {
  prepare(sql: string): PreparedStatement;
  exec(sql: string): void;
  pragma(pragma: string): unknown;
}

// ---------------------------------------------------------------------------
// Initialize sql.js using the asm.js build (no WASM file needed).
// Top-level await keeps getDb() synchronous for all callers.
// ---------------------------------------------------------------------------

const SQL = await initSqlJs();

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------

let rawDb: SqlJsDatabase | null = null;
let compatDb: CompatDatabase | null = null;
let resolvedDbPath: string = '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDbPath(): string {
  if (resolvedDbPath) return resolvedDbPath;

  const envPath = process.env.KOMMA_DB_PATH;
  if (envPath) {
    const dir = path.dirname(envPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    resolvedDbPath = envPath;
    return resolvedDbPath;
  }

  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const dataDir = homeDir ? path.join(homeDir, '.komma') : path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  resolvedDbPath = path.join(dataDir, 'komma.db');
  return resolvedDbPath;
}

/** Persist the in-memory database to disk after mutations. */
function saveToDisk(): void {
  if (!rawDb) return;
  const data = rawDb.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(getDbPath(), buffer);
}

/** Convert spread params to the array format sql.js expects. */
function toBindParams(params: unknown[]): (number | string | Uint8Array | null)[] | null {
  if (params.length === 0) return null;
  return params.map(p => {
    if (p === undefined) return null;
    if (typeof p === 'bigint') return Number(p);
    return p as number | string | Uint8Array | null;
  });
}

// ---------------------------------------------------------------------------
// Compatibility wrapper
// ---------------------------------------------------------------------------

function createCompatDb(db: SqlJsDatabase): CompatDatabase {
  return {
    prepare(sql: string): PreparedStatement {
      return {
        run(...params: unknown[]): RunResult {
          db.run(sql, toBindParams(params) as any);
          const changes = db.getRowsModified();
          const idResult = db.exec('SELECT last_insert_rowid()');
          const lastInsertRowid =
            idResult.length > 0 && idResult[0].values.length > 0
              ? Number(idResult[0].values[0][0])
              : 0;
          saveToDisk();
          return { changes, lastInsertRowid };
        },

        get(...params: unknown[]): unknown {
          const stmt = db.prepare(sql);
          const bound = toBindParams(params);
          if (bound) stmt.bind(bound as any);
          let row: unknown = undefined;
          if (stmt.step()) {
            row = stmt.getAsObject();
          }
          stmt.free();
          return row;
        },

        all(...params: unknown[]): unknown[] {
          const stmt = db.prepare(sql);
          const bound = toBindParams(params);
          if (bound) stmt.bind(bound as any);
          const rows: unknown[] = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          stmt.free();
          return rows;
        },
      };
    },

    exec(sql: string): void {
      db.exec(sql);
      saveToDisk();
    },

    pragma(pragma: string): unknown {
      try {
        const result = db.exec(`PRAGMA ${pragma}`);
        if (result.length > 0 && result[0].values.length > 0) {
          return result[0].values[0][0];
        }
      } catch {
        // Some pragmas (e.g. journal_mode=WAL) are meaningless for sql.js
      }
      return undefined;
    },
  };
}

// ---------------------------------------------------------------------------
// Public API — identical signature to the previous better-sqlite3 version
// ---------------------------------------------------------------------------

export function getDb(): CompatDatabase {
  if (compatDb) return compatDb;

  const dbPath = getDbPath();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    rawDb = new SQL.Database(buffer);
  } else {
    rawDb = new SQL.Database();
  }

  compatDb = createCompatDb(rawDb);

  // Pragmas (WAL is a no-op for sql.js but harmless)
  compatDb.pragma('journal_mode = WAL');
  compatDb.pragma('foreign_keys = ON');

  // Schema — identical to the original
  compatDb.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT UNIQUE NOT NULL,
      title TEXT,
      frontmatter_json TEXT,
      last_opened_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      selected_text TEXT NOT NULL,
      instruction TEXT NOT NULL,
      line_hint TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      request_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS changelogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      request_id TEXT NOT NULL,
      summary TEXT,
      comments_snapshot TEXT,
      diff_preview TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      stream_log TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      context_selection TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'save',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return compatDb;
}
