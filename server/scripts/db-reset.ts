/**
 * npm run db:reset — rebuilds the local database from the SQL files in db/,
 * in the order listed in db/build-order.txt. DESTROYS the existing database.
 *
 * Supports `DELIMITER $$` like the mysql CLI / Workbench, so procedure and trigger
 * files run unchanged in all three. Limitation: a statement ends when a LINE ends
 * with the current delimiter, and full-line comments (-- or #) are skipped.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { env } from "../src/config/env.ts";

const dbDir = path.resolve(import.meta.dirname, "../../db");

function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let delimiter = ";";
  let buffer: string[] = [];

  for (const line of sql.split(/\r?\n/)) {
    const trimmed = line.trim();
    const directive = trimmed.match(/^DELIMITER\s+(\S+)$/i);
    if (directive) {
      delimiter = directive[1]!;
      continue;
    }
    if (buffer.length === 0 && (trimmed === "" || trimmed.startsWith("--") || trimmed.startsWith("#"))) {
      continue;
    }
    buffer.push(line);
    if (trimmed.endsWith(delimiter)) {
      const statement = buffer.join("\n").trimEnd().slice(0, -delimiter.length).trim();
      if (statement) statements.push(statement);
      buffer = [];
    }
  }
  const rest = buffer.join("\n").trim();
  if (rest) statements.push(rest);
  return statements;
}

const files = readFileSync(path.join(dbDir, "build-order.txt"), "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));

const conn = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
});

console.log(`Rebuilding '${env.db.database}' on ${env.db.host}:${env.db.port}\n`);
try {
  for (const file of files) {
    const fullPath = path.join(dbDir, file);
    if (!existsSync(fullPath)) {
      console.warn(`  skip  ${file} (missing)`);
      continue;
    }
    const statements = splitStatements(readFileSync(fullPath, "utf8"));
    for (const [i, statement] of statements.entries()) {
      try {
        await conn.query(statement);
      } catch (err) {
        console.error(`\n  FAILED in ${file}, statement ${i + 1}:\n${statement.slice(0, 500)}\n`);
        throw err;
      }
    }
    console.log(`  ok    ${file} (${statements.length} statements)`);
  }
  console.log("\nDone.");
} finally {
  await conn.end();
}
