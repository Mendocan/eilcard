// One-off card body enricher — run on VPS after deploy:
// docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate node apps/web/scripts/enrich-card.mjs sinyal24
import postgres from "postgres";

const handle = process.argv[2];
if (!handle) {
  console.error("Usage: node enrich-card.mjs <handle>");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[enrich-card] DATABASE_URL is not set");
  process.exit(1);
}

const PATCH_BY_HANDLE = {
  sinyal24: {
    contact: {
      email: "info@sinyalle.com",
      website: "https://sinyalle.com",
    },
    description: {
      tagline: "Sosyal medya platformu",
      summary:
        "Sinyal 24 (Sinyalle), hikaye, Reels, müzik, akış, mesajlaşma ve canlı yayın sunan sosyal medya platformudur. Markalar ve içerik üreticileri için Android ve iOS uygulamalarıyla erişilebilir.",
    },
    products: [
      {
        id: "story24",
        name: "Story 24",
        description: "24 saatlik hikaye paylaşımı",
        url: "https://sinyalle.com",
      },
      {
        id: "reels24",
        name: "Reels 24",
        description: "Kısa video ve Reels içerik akışı",
        url: "https://sinyalle.com",
      },
      {
        id: "live",
        name: "Canlı yayın",
        description: "Canlı video yayınları",
        url: "https://sinyalle.com",
      },
    ],
    legal: { country: "TR", type: "technology_company" },
    actions: [
      { type: "email", label: "E-posta", value: "info@sinyalle.com" },
      { type: "link", label: "Website", url: "https://sinyalle.com" },
    ],
  },
};

const patch = PATCH_BY_HANDLE[handle];
if (!patch) {
  console.error(`[enrich-card] No patch preset for handle: ${handle}`);
  process.exit(1);
}

function mergeBody(current, updates) {
  const merged = { ...current };
  for (const [key, value] of Object.entries(updates)) {
    const existing = merged[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      merged[key] = { ...existing, ...value };
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

const sql = postgres(connectionString, { max: 1 });

try {
  const rows = await sql`
    SELECT id, body, verified, verification_method
    FROM cards
    WHERE handle = ${handle}
    LIMIT 1
  `;

  if (rows.length === 0) {
    console.error(`[enrich-card] Card not found: ${handle}`);
    process.exit(1);
  }

  const row = rows[0];
  const nextBody = mergeBody(row.body, patch);
  const methods =
    row.verification_method?.length > 0
      ? row.verification_method
      : row.verified
        ? ["dns"]
        : row.verification_method;

  await sql`
    UPDATE cards
    SET
      body = ${sql.json(nextBody)},
      verification_method = ${methods},
      updated_at = now()
    WHERE id = ${row.id}
  `;

  console.log(`[enrich-card] Updated @${handle}`);
} finally {
  await sql.end();
}
