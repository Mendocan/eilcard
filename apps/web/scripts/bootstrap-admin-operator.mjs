/**
 * Bootstrap the first admin operator from environment variables.
 *
 * Required: DATABASE_URL, BETTER_AUTH_SECRET, ADMIN_PASSWORD
 * Optional: ADMIN_BOOTSTRAP_EMAIL (default admin@<app-domain>)
 *           ADMIN_BOOTSTRAP_NAME (default "Platform Admin")
 *
 * Local:
 *   cd apps/web && node scripts/bootstrap-admin-operator.mjs
 *
 * Production:
 *   docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate \
 *     node apps/web/scripts/bootstrap-admin-operator.mjs
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import postgres from "postgres";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");

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
const adminPassword = process.env.ADMIN_PASSWORD?.trim();
const authSecret = process.env.BETTER_AUTH_SECRET?.trim();

if (!connectionString) {
  console.error("[bootstrap-admin] DATABASE_URL is not set");
  process.exit(1);
}
if (!adminPassword || adminPassword.length < 8) {
  console.error("[bootstrap-admin] ADMIN_PASSWORD must be at least 8 characters");
  process.exit(1);
}
if (!authSecret) {
  console.error("[bootstrap-admin] BETTER_AUTH_SECRET is not set");
  process.exit(1);
}

function getBootstrapEmail() {
  const fromEnv = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  if (fromEnv) return fromEnv;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://eilcard.com";
  try {
    return `admin@${new URL(appUrl).hostname.toLowerCase()}`;
  } catch {
    return "admin@eilcard.com";
  }
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

const email = getBootstrapEmail();
const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "Platform Admin";
const sql = postgres(connectionString, { max: 1 });

try {
  const existing = await sql`
    SELECT count(*)::int AS c FROM admin_operators
  `;
  if ((existing[0]?.c ?? 0) > 0) {
    console.log("[bootstrap-admin] Operators already exist — skipping");
    process.exit(0);
  }

  const passwordHash = await hashPassword(adminPassword);
  const [row] = await sql`
    INSERT INTO admin_operators (email, name, password_hash, role)
    VALUES (${email}, ${name}, ${passwordHash}, 'admin')
    RETURNING id, email, name, role
  `;

  console.log(`[bootstrap-admin] Created admin operator ${row.email} (${row.name})`);
  console.log("[bootstrap-admin] Sign in at /admin/login with this email and ADMIN_PASSWORD");
  console.log("[bootstrap-admin] Rotate the password from Admin → Team after first login");
} finally {
  await sql.end();
}
