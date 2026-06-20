/**
 * Pilot helper: simulate subscription grace / expiry for a user (e.g. Sinyalle).
 * Does NOT touch Polar — only adjusts user_plans in the database.
 *
 * Usage:
 *   node simulate-subscription-lapse.mjs sinyal24 --grace-active
 *   node simulate-subscription-lapse.mjs sinyal24 --grace-expired
 *   node simulate-subscription-lapse.mjs sinyal24 --restore
 *
 * After --grace-expired, run subscription reconcile (cron script or API) to downgrade.
 *
 * Production:
 *   docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate \
 *     node apps/web/scripts/simulate-subscription-lapse.mjs sinyal24 --grace-expired
 */
import postgres from "postgres";

const target = process.argv[2];
const mode = process.argv[3];

const MODES = ["--grace-active", "--grace-expired", "--restore"];

if (!target || !MODES.includes(mode)) {
  console.error(
    "Usage: node simulate-subscription-lapse.mjs <handle|email> (--grace-active|--grace-expired|--restore)"
  );
  process.exit(1);
}

const graceDays = Number(process.env.SUBSCRIPTION_GRACE_DAYS ?? "21");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[simulate-subscription-lapse] DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

try {
  const isEmail = target.includes("@");
  let userId;

  if (isEmail) {
    const rows = await sql`
      SELECT id, email FROM users WHERE lower(email) = ${target.toLowerCase()} LIMIT 1
    `;
    if (rows.length === 0) {
      console.error(`[simulate-subscription-lapse] User not found: ${target}`);
      process.exit(1);
    }
    userId = rows[0].id;
  } else {
    const rows = await sql`
      SELECT u.id, u.email, c.handle
      FROM cards c
      INNER JOIN users u ON u.id = c.user_id
      WHERE c.handle = ${target}
      LIMIT 1
    `;
    if (rows.length === 0) {
      console.error(`[simulate-subscription-lapse] Card not found: @${target}`);
      process.exit(1);
    }
    userId = rows[0].id;
    console.log(`[simulate-subscription-lapse] User: ${rows[0].email} (@${rows[0].handle})`);
  }

  const [plan] = await sql`
    SELECT tier, expires_at, polar_subscription_id
    FROM user_plans
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  if (!plan) {
    console.error("[simulate-subscription-lapse] No user_plans row — set a paid tier first.");
    process.exit(1);
  }

  const now = new Date();

  if (mode === "--restore") {
    await sql`
      UPDATE user_plans
      SET
        tier = 'verified',
        expires_at = ${addDays(now, 365)},
        updated_at = now()
      WHERE user_id = ${userId}
    `;
    console.log("[simulate-subscription-lapse] Restored: tier=verified, expires_at=+365d");
    console.log("[simulate-subscription-lapse] Re-verify cards manually if verified was revoked.");
    process.exit(0);
  }

  if (mode === "--grace-active") {
    const expiresAt = addDays(now, graceDays);
    await sql`
      UPDATE user_plans
      SET tier = 'verified', expires_at = ${expiresAt}, updated_at = now()
      WHERE user_id = ${userId}
    `;
    console.log(
      `[simulate-subscription-lapse] Grace active: tier=verified, expires_at=${expiresAt.toISOString()} (+${graceDays}d)`
    );
    console.log("[simulate-subscription-lapse] Effective tier should remain verified until expiry.");
    process.exit(0);
  }

  if (mode === "--grace-expired") {
    const expiresAt = addDays(now, -1);
    await sql`
      UPDATE user_plans
      SET tier = 'verified', expires_at = ${expiresAt}, updated_at = now()
      WHERE user_id = ${userId}
    `;
    console.log(
      `[simulate-subscription-lapse] Grace expired: tier=verified (stored), expires_at=${expiresAt.toISOString()}`
    );
    console.log(
      "[simulate-subscription-lapse] Run reconcile to downgrade:\n" +
        "  curl -X POST -H \"Authorization: Bearer $CRON_SECRET\" https://eilcard.com/api/cron/subscription-reconcile"
    );
  }
} finally {
  await sql.end();
}
