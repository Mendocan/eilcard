/**
 * One-off: run DNS check for a card's latest pending verification (same logic as dashboard).
 * Usage: node apps/web/scripts/verify-card-dns.mjs eilcard
 */
import { promises as dns } from "node:dns";
import postgres from "postgres";

const handle = process.argv[2];
if (!handle) {
  console.error("Usage: node verify-card-dns.mjs <handle>");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[verify-card-dns] DATABASE_URL is not set");
  process.exit(1);
}

const TOKEN_PREFIX = "digitalcard-verify=";
const sql = postgres(connectionString, { max: 1 });

try {
  const cards = await sql`
    SELECT id, domain, verified FROM cards WHERE handle = ${handle} LIMIT 1
  `;
  if (cards.length === 0) {
    console.error(`[verify-card-dns] Card not found: @${handle}`);
    process.exit(1);
  }
  const card = cards[0];
  if (card.verified) {
    console.log(`[verify-card-dns] @${handle} already verified`);
    process.exit(0);
  }
  if (!card.domain) {
    console.error("[verify-card-dns] No domain on card");
    process.exit(1);
  }

  const pending = await sql`
    SELECT id, token FROM domain_verifications
    WHERE card_id = ${card.id} AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (pending.length === 0) {
    console.error("[verify-card-dns] No pending verification — click 'Generate TXT' in dashboard first");
    process.exit(1);
  }

  const expected = `${TOKEN_PREFIX}${pending[0].token}`;
  const records = await dns.resolveTxt(card.domain);
  const ok = records.some((entry) => entry.join("").includes(expected));

  if (!ok) {
    console.error(`[verify-card-dns] TXT not found for ${card.domain}`);
    console.error(`[verify-card-dns] Expected: ${expected}`);
    process.exit(1);
  }

  await sql`
    UPDATE domain_verifications
    SET status = 'verified', verified_at = now()
    WHERE id = ${pending[0].id}
  `;
  await sql`
    UPDATE domain_verifications
    SET status = 'failed'
    WHERE card_id = ${card.id} AND status = 'pending' AND id <> ${pending[0].id}
  `;
  await sql`
    UPDATE cards
    SET verified = true, verification_method = ARRAY['dns']::text[], updated_at = now()
    WHERE id = ${card.id}
  `;

  console.log(`[verify-card-dns] @${handle} verified for ${card.domain}`);
} finally {
  await sql.end();
}
