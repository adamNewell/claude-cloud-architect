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

await (async () => {
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

    case "write": {
      const dbPath = args.db ?? `.archimedes/sessions/${args.session}/tags.db`;

      if (!args["target-ref"]) {
        console.error(JSON.stringify({ error: "--target-ref is required" }));
        process.exit(1);
      }
      if (!args["target-repo"]) {
        console.error(JSON.stringify({ error: "--target-repo is required" }));
        process.exit(1);
      }
      if (!args.kind) {
        console.error(JSON.stringify({ error: "--kind is required" }));
        process.exit(1);
      }
      if (!args["source-tool"]) {
        console.error(JSON.stringify({ error: "--source-tool is required" }));
        process.exit(1);
      }

      const db = openDb(dbPath);
      const weight = args.weight ?? "MACHINE";
      const status = weight === "HUMAN" ? "VALIDATED" : "CANDIDATE";
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      try {
        const stmt = db.prepare(`
          INSERT INTO tags
            (id, target_type, target_ref, target_repo, kind, value, confidence,
             weight_class, source_tool, source_query, source_evidence,
             status, session_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(target_ref, kind, source_tool, session_id)
          DO UPDATE SET updated_at = excluded.updated_at,
                        confidence = MAX(confidence, excluded.confidence)
          RETURNING id
        `);

        const row = stmt.get(
          id,
          args["target-type"] ?? "FILE",
          args["target-ref"],
          args["target-repo"],
          args.kind,
          args.value ?? "{}",
          parseFloat(args.confidence ?? "0.5"),
          weight,
          args["source-tool"],
          args["source-query"] ?? null,
          args["source-evidence"] ?? null,
          status,
          args.session,
          now, now
        ) as any;

        db.close();
        console.log(JSON.stringify({ ok: true, id: row.id }));
      } catch (e: any) {
        db.close();
        console.error(JSON.stringify({ error: e.message }));
        process.exit(1);
      }
      break;
    }

    case "query": {
      if (!args.sql) {
        console.error(JSON.stringify({ error: "--sql is required" }));
        process.exit(1);
      }
      const db = openDb(args.db ?? `.archimedes/sessions/${args.session}/tags.db`);
      try {
        const rows = db.query(args.sql).all();
        console.log(JSON.stringify(rows));
      } catch (e: any) {
        console.error(JSON.stringify({ error: e.message }));
        process.exit(1);
      } finally { db.close(); }
      break;
    }

    case "promote": {
      if (!args["tag-id"]) {
        console.error(JSON.stringify({ error: "--tag-id is required" }));
        process.exit(1);
      }
      const db = openDb(args.db ?? `.archimedes/sessions/${args.session}/tags.db`);
      try {
        const now = new Date().toISOString();
        db.run(
          "UPDATE tags SET status='PROMOTED', weight_class='PROMOTED', updated_at=? WHERE id=?",
          [now, args["tag-id"]]
        );
        console.log(JSON.stringify({ ok: true, id: args["tag-id"], status: "PROMOTED" }));
      } catch (e: any) {
        console.error(JSON.stringify({ error: e.message }));
        process.exit(1);
      } finally { db.close(); }
      break;
    }

    case "reject": {
      if (!args["tag-id"]) {
        console.error(JSON.stringify({ error: "--tag-id is required" }));
        process.exit(1);
      }
      const db = openDb(args.db ?? `.archimedes/sessions/${args.session}/tags.db`);
      try {
        const now = new Date().toISOString();
        db.run("UPDATE tags SET status='REJECTED', updated_at=? WHERE id=?", [now, args["tag-id"]]);
        console.log(JSON.stringify({ ok: true, id: args["tag-id"], status: "REJECTED" }));
      } catch (e: any) {
        console.error(JSON.stringify({ error: e.message }));
        process.exit(1);
      } finally { db.close(); }
      break;
    }

    case "export": {
      const db = openDb(args.db ?? `.archimedes/sessions/${args.session}/tags.db`);
      try {
        const tags = db.query(
          "SELECT * FROM tags WHERE session_id=? AND status!='REJECTED' ORDER BY created_at"
        ).all(args.session);
        console.log(JSON.stringify(tags, null, 2));
      } catch (e: any) {
        console.error(JSON.stringify({ error: e.message }));
        process.exit(1);
      } finally { db.close(); }
      break;
    }

    case "write-from-ast-grep": {
      // Validate required args
      if (!args.rule) {
        console.error(JSON.stringify({ error: "--rule is required" }));
        process.exit(1);
      }
      if (!args.session) {
        console.error(JSON.stringify({ error: "--session is required" }));
        process.exit(1);
      }

      const dbPath = args.db ?? `.archimedes/sessions/${args.session}/tags.db`;

      // Read archimedes metadata from original rule file (before yq strips it)
      const ruleContent = yaml.load(readFileSync(args.rule, "utf-8")) as any;
      const meta = ruleContent.archimedes ?? {};
      const kind = meta.kind ?? "PATTERN";
      const confidence = meta.confidence ?? 0.7;
      const weight = meta.weight_class ?? "MACHINE";
      const targetType = meta.target_type ?? "FILE";
      const status = weight === "HUMAN" ? "VALIDATED" : "CANDIDATE";

      // Read ast-grep JSON from stdin
      const input = await Bun.stdin.text();
      let matches: any[];
      try {
        matches = JSON.parse(input || "[]");
      } catch (e: any) {
        console.error(JSON.stringify({ error: `Invalid JSON on stdin: ${e.message}` }));
        process.exit(1);
      }

      const db = openDb(dbPath);
      const stmt = db.prepare(`
        INSERT INTO tags
          (id, target_type, target_ref, target_repo, kind, value, confidence,
           weight_class, source_tool, source_query, source_evidence,
           status, session_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(target_ref, kind, source_tool, session_id)
        DO UPDATE SET updated_at = excluded.updated_at,
                      confidence = MAX(confidence, excluded.confidence)
        RETURNING id
      `);

      const now = new Date().toISOString();
      const ids: string[] = [];

      try {
        for (const match of matches) {
          const value = JSON.stringify({
            pattern_name: ruleContent.id,
            subkind: meta.subkind,
            rule_id: match.ruleId,
            line: match.range?.start?.line,
            column: match.range?.start?.column,
            language: match.language,
          });

          const row = stmt.get(
            crypto.randomUUID(), targetType, match.file,
            args["target-repo"] ?? "", kind, value, confidence,
            weight, args["source-tool"] ?? "ast-grep",
            ruleContent.id, match.text,
            status, args.session, now, now
          ) as any;
          ids.push(row.id);
        }
        db.close();
        console.log(JSON.stringify({ ok: true, written: ids.length, ids }));
      } catch (e: any) {
        db.close();
        console.error(JSON.stringify({ error: e.message }));
        process.exit(1);
      }
      break;
    }

    default:
      console.error(JSON.stringify({ error: `Unknown command: ${command}` }));
      process.exit(1);
  }
})();
