/**
 * Configure @sinyal24 for E3-B/C pilot: Registry+ edition + capabilities.agent_gateway.
 *
 * Prerequisites:
 *   - Card handle sinyal24 exists (Sinyalle pilot account)
 *   - PILOT_AGENT_GATEWAY_URL points at live gateway (default: agent-gateway.eilcard.com interim host)
 *
 * Production:
 *   docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate \
 *     node apps/web/scripts/seed-sinyalle-pilot-gateway.mjs
 */
import postgres from "postgres";

const HANDLE = process.env.PILOT_CARD_HANDLE ?? "sinyal24";
const GATEWAY_URL = (
  process.env.PILOT_AGENT_GATEWAY_URL ??
  process.env.GATEWAY_ISSUER ??
  "https://agent-gateway.eilcard.com"
).replace(/\/$/, "");

const CAPABILITIES = {
  agent_gateway: GATEWAY_URL,
  auth: "oauth2",
  scopes: ["read:profile", "read:orders", "write:post", "act:comment"],
  actions: [
    {
      id: "create_post",
      label: "Create blog post",
      method: "POST",
      path: "/v1/posts",
      scopes: ["write:post"],
      idempotent: true,
    },
    {
      id: "add_comment",
      label: "Add comment",
      method: "POST",
      path: "/v1/act/comment",
      scopes: ["act:comment"],
      idempotent: true,
    },
  ],
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[seed-sinyalle-pilot-gateway] DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

try {
  const cards = await sql`
    SELECT id, user_id, handle, domain, edition, schema_version, body
    FROM cards
    WHERE handle = ${HANDLE}
    LIMIT 1
  `;

  if (cards.length === 0) {
    console.error(`[seed-sinyalle-pilot-gateway] Card not found: @${HANDLE}`);
    process.exit(1);
  }

  const card = cards[0];
  const body = { ...(card.body ?? {}), capabilities: CAPABILITIES };

  await sql`
    UPDATE cards
    SET
      edition = 'registry_plus',
      schema_version = '1.2',
      body = ${sql.json(body)},
      updated_at = now()
    WHERE id = ${card.id}
  `;

  const [plan] = await sql`
    SELECT id, tier, enterprise_addon FROM user_plans WHERE user_id = ${card.user_id} LIMIT 1
  `;

  if (plan) {
    await sql`
      UPDATE user_plans
      SET
        tier = 'pro',
        enterprise_addon = true,
        expires_at = COALESCE(expires_at, now() + interval '1 year'),
        updated_at = now()
      WHERE user_id = ${card.user_id}
    `;
  } else {
    await sql`
      INSERT INTO user_plans (user_id, tier, enterprise_addon, expires_at)
      VALUES (${card.user_id}, 'pro', true, now() + interval '1 year')
    `;
  }

  console.log(`[seed-sinyalle-pilot-gateway] @${HANDLE} → registry_plus / schema 1.2`);
  console.log(`[seed-sinyalle-pilot-gateway] capabilities.agent_gateway = ${GATEWAY_URL}`);
  console.log(`[seed-sinyalle-pilot-gateway] scopes: ${CAPABILITIES.scopes.join(", ")}`);
  console.log(`[seed-sinyalle-pilot-gateway] User plan → pro + enterprise_addon`);
  console.log(
    "[seed-sinyalle-pilot-gateway] Verify: curl -s " +
      `"https://eilcard.com/api/v1/resolve?domain=${card.domain ?? "sinyalle.com"}" | jq .card.capabilities`
  );
} finally {
  await sql.end();
}
