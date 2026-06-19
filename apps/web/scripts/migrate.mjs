// Self-contained migration runner — applies .sql files in ./drizzle in order.
// No drizzle-kit needed at runtime. Tracks applied files in __migrations table.
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const drizzleDir = join(appRoot, "drizzle");

for (const [file, override] of [
  [".env", false],
  [".env.local", true],
]) {
  const path = join(appRoot, file);
  if (existsSync(path)) {
    dotenv.config({ path, override, quiet: true });
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "[migrate] DATABASE_URL is not set (export it or add to apps/web/.env or .env.local)"
  );
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function main() {
  await sql`CREATE TABLE IF NOT EXISTS __migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`;

  const files = (await readdir(drizzleDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = await sql`SELECT name FROM __migrations`;
  const appliedSet = new Set(applied.map((r) => r.name));

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`[migrate] skip ${file} (already applied)`);
      continue;
    }

    const raw = await readFile(join(drizzleDir, file), "utf8");
    const statements = raw
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`[migrate] applying ${file} (${statements.length} statements)`);
    await sql.begin(async (tx) => {
      for (const stmt of statements) {
        await tx.unsafe(stmt);
      }
      await tx`INSERT INTO __migrations (name) VALUES (${file})`;
    });
    console.log(`[migrate] done ${file}`);
  }

  console.log("[migrate] all migrations applied");
}

main()
  .then(() => sql.end())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error("[migrate] failed:", err.message);
    await sql.end();
    process.exit(1);
  });
