/**
 * One-time backfill: mark existing accounts as email-verified.
 *
 * Use before enabling requireEmailVerification, or to grandfather
 * accounts that registered before verification was implemented.
 *
 *   cd apps/web && node scripts/backfill-email-verified.mjs
 *
 * Production:
 *   docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate \
 *     node apps/web/scripts/backfill-email-verified.mjs
 *
 * Options:
 *   --dry-run   Print affected users without updating
 */
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[backfill-email-verified] DATABASE_URL is not set");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const sql = postgres(connectionString, { max: 1 });

try {
  const pending = await sql`
    SELECT id, email, name, created_at
    FROM users
    WHERE email_verified = false
    ORDER BY created_at ASC
  `;

  if (pending.length === 0) {
    console.log("[backfill-email-verified] All users already verified.");
    process.exit(0);
  }

  console.log(
    `[backfill-email-verified] ${pending.length} user(s) with email_verified=false:`
  );
  for (const row of pending) {
    console.log(`  - ${row.email} (${row.name})`);
  }

  if (dryRun) {
    console.log("[backfill-email-verified] Dry run — no changes made.");
    process.exit(0);
  }

  const updated = await sql`
    UPDATE users
    SET email_verified = true, updated_at = now()
    WHERE email_verified = false
    RETURNING id
  `;

  console.log(`[backfill-email-verified] Marked ${updated.length} user(s) as verified.`);
} finally {
  await sql.end();
}
