/**
 * Create the official @eilcard organization card for the platform operator account.
 *
 * Prerequisites:
 *   1. platform@eilcard.com registered at /register
 *   2. ensure-platform-operator.mjs already run
 *
 * Local:
 *   cd apps/web && node scripts/seed-platform-operator-card.mjs
 *
 * Production:
 *   docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate \
 *     node apps/web/scripts/seed-platform-operator-card.mjs
 */
import postgres from "postgres";

const HANDLE = "eilcard";
const DOMAIN = "eilcard.com";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[seed-platform-operator-card] DATABASE_URL is not set");
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

const CARD_BODY = {
  type: "organization",
  name: {
    official: "EIL Card",
    short: "EIL",
  },
  contact: {
    email: "support@eilcard.com",
    website: "https://eilcard.com",
  },
  description: {
    tagline: "Domain-verified entity identity for AI agents",
    summary:
      "EIL Card is the registry for canonical organization and person identity. Agents resolve domain or handle to verified JSON — with optional /.well-known/digital-card fallback on the entity's domain.",
  },
  products: [
    {
      id: "registry",
      name: "Entity registry",
      description: "Publish, verify, and resolve digital cards",
      url: "https://eilcard.com/docs",
    },
    {
      id: "sdk",
      name: "TypeScript SDK",
      description: "@digitalcard/sdk for agent and LangChain integrations",
      url: "https://www.npmjs.com/package/@digitalcard/sdk",
    },
    {
      id: "agents",
      name: "Agent integration guide",
      description: "OpenAI, Anthropic, and Gemini tool templates",
      url: "https://eilcard.com/docs/agents",
    },
  ],
  legal: { country: "TR", type: "technology_company" },
  actions: [
    { type: "email", label: "Support", value: "support@eilcard.com" },
    { type: "link", label: "Documentation", url: "https://eilcard.com/docs" },
    { type: "link", label: "Pricing", url: "https://eilcard.com/pricing" },
  ],
  same_as: ["https://github.com/Mendocan/eilcard"],
};

const expectedEmail = getExpectedEmail();
const sql = postgres(connectionString, { max: 1 });

try {
  const users = await sql`
    SELECT id, email, name, is_platform_operator
    FROM users
    WHERE lower(email) = ${expectedEmail}
    LIMIT 1
  `;

  if (users.length === 0) {
    console.error(
      `[seed-platform-operator-card] No user ${expectedEmail}. Register and run ensure-platform-operator.mjs first.`
    );
    process.exit(1);
  }

  const user = users[0];
  if (!user.is_platform_operator) {
    console.error(
      `[seed-platform-operator-card] ${expectedEmail} is not designated as platform operator. Run ensure-platform-operator.mjs first.`
    );
    process.exit(1);
  }

  const existing = await sql`
    SELECT id, handle, domain, verified
    FROM cards
    WHERE handle = ${HANDLE} OR domain = ${DOMAIN}
    LIMIT 1
  `;

  if (existing.length > 0) {
    const card = existing[0];
    await sql`
      UPDATE cards
      SET
        body = ${sql.json(CARD_BODY)},
        updated_at = now()
      WHERE id = ${card.id}
    `;
    console.log(
      `[seed-platform-operator-card] Updated @${card.handle} (verified=${card.verified})`
    );
    console.log("[seed-platform-operator-card] Next: dashboard → DNS verify for eilcard.com");
    process.exit(0);
  }

  const cardId = DOMAIN;

  await sql`
    INSERT INTO cards (user_id, handle, card_id, type, domain, body, verified)
    VALUES (
      ${user.id},
      ${HANDLE},
      ${cardId},
      'organization',
      ${DOMAIN},
      ${sql.json(CARD_BODY)},
      false
    )
  `;

  console.log(`[seed-platform-operator-card] Created @${HANDLE} for ${expectedEmail}`);
  console.log(`[seed-platform-operator-card] Domain: ${DOMAIN} (verified=false until DNS)`);
  console.log(
    "[seed-platform-operator-card] Next steps:\n" +
      "  1. Sign in as platform@eilcard.com → dashboard\n" +
      "  2. Open @eilcard → Start DNS verification\n" +
      "  3. Add TXT record in Namecheap DNS for eilcard.com\n" +
      "  4. Verify from dashboard or admin verification queue"
  );
} finally {
  await sql.end();
}
