/**
 * Designate the platform operator registry account (separate from customers).
 *
 * 1. Register at /register with PLATFORM_OPERATOR_EMAIL (default platform@eilcard.com)
 * 2. Run: node apps/web/scripts/ensure-platform-operator.mjs
 *
 * Local:
 *   cd apps/web && node scripts/ensure-platform-operator.mjs
 *
 * Production:
 *   docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate \
 *     node apps/web/scripts/ensure-platform-operator.mjs
 */
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[ensure-platform-operator] DATABASE_URL is not set");
  process.exit(1);
}

function getExpectedEmail() {
  const fromEnv = process.env.PLATFORM_OPERATOR_EMAIL?.trim().toLowerCase();
  if (fromEnv) return fromEnv;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://eilcard.com";
  try {
    return `platform@${new URL(appUrl).hostname.toLowerCase()}`;
  } catch {
    return "platform@eilcard.com";
  }
}

const expectedEmail = getExpectedEmail();
const sql = postgres(connectionString, { max: 1 });

try {
  const users = await sql`
    SELECT id, email, name FROM users WHERE lower(email) = ${expectedEmail} LIMIT 1
  `;

  if (users.length === 0) {
    console.error(
      `[ensure-platform-operator] No user with email ${expectedEmail}. Register at /register first, then re-run.`
    );
    process.exit(1);
  }

  const user = users[0];

  await sql`
    UPDATE users SET is_platform_operator = false WHERE is_platform_operator = true AND id <> ${user.id}
  `;

  await sql`
    UPDATE users SET is_platform_operator = true, updated_at = now() WHERE id = ${user.id}
  `;

  const [plan] = await sql`
    SELECT id FROM user_plans WHERE user_id = ${user.id} LIMIT 1
  `;

  if (plan) {
    await sql`
      UPDATE user_plans SET tier = 'pro', updated_at = now() WHERE user_id = ${user.id}
    `;
  } else {
    await sql`
      INSERT INTO user_plans (user_id, tier) VALUES (${user.id}, 'pro')
    `;
  }

  const [cardsRow] = await sql`
    SELECT count(*)::int AS c FROM cards WHERE user_id = ${user.id}
  `;

  console.log(`[ensure-platform-operator] Designated ${expectedEmail} (${user.name})`);
  console.log(`[ensure-platform-operator] Tier: pro · Cards: ${cardsRow?.c ?? 0}`);
  console.log(
    "[ensure-platform-operator] Reserved handles/domains (eilcard, eilcard.com) are now limited to this account."
  );
} finally {
  await sql.end();
}
