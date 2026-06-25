/**
 * Verify Registry+ JWS attestation on a public card.
 *
 * Usage:
 *   node verify-registry-jws.mjs --handle sinyalle
 *   node verify-registry-jws.mjs --domain sinyalle.com
 *   node verify-registry-jws.mjs --url https://eilcard.com/api/v1/cards/eilcard
 *   node verify-registry-jws.mjs --handle eilcard --public-key-pem ./registry-public.pem
 *
 * Without --public-key-pem: decodes header/payload and reports structure only.
 */
import { createPublicKey, verify as cryptoVerify } from "node:crypto";
import { readFileSync } from "node:fs";

const REGISTRY_BASE = (process.env.EIL_REGISTRY_URL ?? "https://eilcard.com").replace(
  /\/$/,
  ""
);

function usage() {
  console.error(
    "Usage: node verify-registry-jws.mjs (--handle NAME | --domain DOMAIN | --url URL) [--public-key-pem PATH]"
  );
  process.exit(1);
}

function parseArgs(argv) {
  let handle;
  let domain;
  let url;
  let publicKeyPemPath;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--handle") handle = argv[++i];
    else if (arg === "--domain") domain = argv[++i];
    else if (arg === "--url") url = argv[++i];
    else if (arg === "--public-key-pem") publicKeyPemPath = argv[++i];
    else usage();
  }

  if (!handle && !domain && !url) usage();
  return { handle, domain, url, publicKeyPemPath };
}

function decodePart(b64) {
  return JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
}

function hashAlg(alg) {
  if (alg === "RS256") return "RSA-SHA256";
  if (alg === "ES256") return "SHA256";
  return null;
}

async function fetchCard({ handle, domain, url }) {
  if (url) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
    const body = await res.json();
    return body.card ?? body;
  }
  if (handle) {
    const res = await fetch(`${REGISTRY_BASE}/api/v1/cards/${encodeURIComponent(handle)}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Card not found: @${handle}`);
    return res.json();
  }
  const res = await fetch(
    `${REGISTRY_BASE}/api/v1/resolve?domain=${encodeURIComponent(domain)}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`Resolve failed for ${domain}`);
  const body = await res.json();
  return body.card;
}

function canonicalWithoutSignatures(card) {
  const clone = { ...card };
  delete clone.signatures;
  return clone;
}

async function main() {
  const { handle, domain, url, publicKeyPemPath } = parseArgs(process.argv);
  const card = await fetchCard({ handle, domain, url });

  const jws = card.signatures?.registry?.jws;
  if (!jws) {
    console.log("[verify-registry-jws] No signatures.registry.jws on card");
    process.exit(1);
  }

  const parts = jws.split(".");
  if (parts.length !== 3) {
    console.error("[verify-registry-jws] Invalid compact JWS format");
    process.exit(1);
  }

  const [headerB64, payloadB64, sigB64] = parts;
  const header = decodePart(headerB64);
  const payload = decodePart(payloadB64);

  console.log("=== JWS header ===");
  console.log(JSON.stringify(header, null, 2));
  console.log("\n=== JWS payload (decoded) ===");
  console.log(JSON.stringify(payload, null, 2));

  const kid = card.signatures?.registry?.kid ?? header.kid;
  if (kid) console.log(`\nKey ID: ${kid}`);

  const canonical = canonicalWithoutSignatures(card);
  const payloadStr = JSON.stringify(payload);
  const canonicalStr = JSON.stringify(canonical);
  const payloadMatches =
    payloadStr === canonicalStr ||
    JSON.stringify(payload, Object.keys(payload).sort()) ===
      JSON.stringify(canonical, Object.keys(canonical).sort());

  console.log(
    `\nPayload matches public card (minus signatures): ${payloadMatches ? "yes" : "no — review signing canonicalization"}`
  );

  if (!publicKeyPemPath) {
    console.log(
      "\n[verify-registry-jws] Crypto verify skipped — pass --public-key-pem PATH to verify signature"
    );
    process.exit(payloadMatches ? 0 : 2);
  }

  const pem = readFileSync(publicKeyPemPath, "utf8");
  const key = createPublicKey(pem);
  const alg = header.alg ?? card.signatures?.registry?.alg;
  const nodeAlg = hashAlg(alg);

  if (!nodeAlg) {
    console.error(`[verify-registry-jws] Unsupported alg for Node verify: ${alg}`);
    process.exit(2);
  }

  const signingInput = Buffer.from(`${headerB64}.${payloadB64}`);
  const signature = Buffer.from(sigB64, "base64url");

  let valid = false;
  if (alg === "RS256") {
    valid = cryptoVerify(nodeAlg, signature, key, signingInput);
  } else if (alg === "ES256") {
    valid = cryptoVerify("sha256", signature, key, signingInput);
  } else {
    console.error(`[verify-registry-jws] EdDSA verify not implemented in this CLI yet`);
    process.exit(2);
  }

  console.log(`\nSignature valid: ${valid ? "yes" : "no"}`);
  process.exit(valid && payloadMatches ? 0 : 3);
}

main().catch((err) => {
  console.error("[verify-registry-jws] fatal:", err.message ?? err);
  process.exit(1);
});
