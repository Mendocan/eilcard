/** Restore pending verification from existing DNS TXT (deploy recovery). */
import postgres from "postgres";

const HANDLE = "eilcard";
const TOKEN = process.argv[2] ?? "4fc886474a25946c941f9cd52360f864";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) process.exit(1);

const sql = postgres(connectionString, { max: 1 });
try {
  const [card] = await sql`
    SELECT id, domain, verified FROM cards WHERE handle = ${HANDLE} LIMIT 1
  `;
  if (!card) {
    console.error("card not found");
    process.exit(1);
  }
  if (card.verified) {
    console.log("already verified");
    process.exit(0);
  }
  await sql`
    INSERT INTO domain_verifications (card_id, domain, method, token, status)
    VALUES (${card.id}, ${card.domain}, 'dns', ${TOKEN}, 'pending')
  `;
  console.log(`pending verification created for @${HANDLE}`);
} finally {
  await sql.end();
}
