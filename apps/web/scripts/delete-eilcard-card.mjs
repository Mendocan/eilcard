/** Remove mistaken @eilcard registry card (platform demo belongs at /example). */
import postgres from "postgres";

const HANDLE = "eilcard";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("[delete-eilcard] DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

try {
  const rows = await sql`
    SELECT id, user_id FROM cards WHERE handle = ${HANDLE} LIMIT 1
  `;
  if (rows.length === 0) {
    console.log(`[delete-eilcard] No card @${HANDLE} — nothing to do`);
    process.exit(0);
  }

  const cardId = rows[0].id;
  await sql`DELETE FROM domain_verifications WHERE card_id = ${cardId}`;
  await sql`DELETE FROM resolve_events WHERE card_id = ${cardId}`;
  await sql`DELETE FROM cards WHERE id = ${cardId}`;
  console.log(`[delete-eilcard] Removed @${HANDLE} from registry`);
} finally {
  await sql.end();
}
