#!/usr/bin/env bun
import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { dirname } from "path";
import yaml from "js-yaml";
import { readFileSync } from "fs";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL DEFAULT 'FILE',
  target_ref TEXT NOT NULL,
  target_repo TEXT NOT NULL,
  kind TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '{}',
  confidence REAL NOT NULL DEFAULT 0.5,
  weight_class TEXT NOT NULL DEFAULT 'MACHINE',
  source_tool TEXT NOT NULL,
  source_query TEXT,
  source_evidence TEXT,
  status TEXT NOT NULL DEFAULT 'CANDIDATE',
  parent_tag_id TEXT,
  related_tags TEXT DEFAULT '[]',
  session_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  validated_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_tags_session ON tags(session_id);
CREATE INDEX IF NOT EXISTS idx_tags_kind ON tags(kind);
CREATE INDEX IF NOT EXISTS idx_tags_status ON tags(status);
CREATE INDEX IF NOT EXISTS idx_tags_target_ref ON tags(target_ref);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_dedup
  ON tags(target_ref, kind, source_tool, session_id);
`;

function parseArgs(argv: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      result[argv[i].slice(2)] = argv[i + 1] ?? "true";
      i++;
    }
  }
  return result;
}

function openDb(dbPath: string): Database {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

const [command, ...rest] = Bun.argv.slice(2);
const args = parseArgs(rest);

switch (command) {
  case "init": {
    if (!args.session && !args.db) {
      console.error(JSON.stringify({ error: "Either --session or --db is required" }));
      process.exit(1);
    }
    try {
      const db = openDb(args.db ?? `.archimedes/sessions/${args.session}/tags.db`);
      db.exec(SCHEMA);
      db.close();
      console.log(JSON.stringify({ ok: true, session: args.session }));
    } catch (e: any) {
      console.error(JSON.stringify({ error: e.message }));
      process.exit(1);
    }
    break;
  }

  default:
    console.error(JSON.stringify({ error: `Unknown command: ${command}` }));
    process.exit(1);
}
