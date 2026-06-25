import { createPublicKey, verify as cryptoVerify } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Card } from "@digitalcard/sdk";

export type JwsVerifyResult = {
  ok: boolean;
  alg?: string;
  kid?: string;
  payloadMatches: boolean;
  signatureValid?: boolean;
  message: string;
};

function decodePart(b64: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
}

function hashAlg(alg: string): string | null {
  if (alg === "RS256") return "RSA-SHA256";
  if (alg === "ES256") return "SHA256";
  return null;
}

function canonicalWithoutSignatures(card: Card): Record<string, unknown> {
  const clone = { ...card } as Record<string, unknown>;
  delete clone.signatures;
  return clone;
}

export function verifyRegistryJws(
  card: Card,
  publicKeyPemPath?: string
): JwsVerifyResult {
  const jws = card.signatures?.registry?.jws;
  if (!jws) {
    return {
      ok: false,
      payloadMatches: false,
      message: "No signatures.registry.jws on card",
    };
  }

  const parts = jws.split(".");
  if (parts.length !== 3) {
    return {
      ok: false,
      payloadMatches: false,
      message: "Invalid compact JWS format",
    };
  }

  const [headerB64, payloadB64, sigB64] = parts;
  const header = decodePart(headerB64);
  const payload = decodePart(payloadB64);
  const alg = String(header.alg ?? card.signatures?.registry?.alg ?? "");
  const kid = card.signatures?.registry?.kid ?? (header.kid as string | undefined);

  const canonical = canonicalWithoutSignatures(card);
  const payloadMatches =
    JSON.stringify(payload) === JSON.stringify(canonical) ||
    JSON.stringify(payload, Object.keys(payload).sort()) ===
      JSON.stringify(canonical, Object.keys(canonical).sort());

  if (!publicKeyPemPath) {
    return {
      ok: payloadMatches,
      alg,
      kid,
      payloadMatches,
      message: payloadMatches
        ? "JWS payload matches card (crypto verify skipped — pass --public-key-pem)"
        : "JWS payload does not match public card JSON",
    };
  }

  const pem = readFileSync(publicKeyPemPath, "utf8");
  const key = createPublicKey(pem);
  const nodeAlg = hashAlg(alg);
  if (!nodeAlg) {
    return {
      ok: false,
      alg,
      kid,
      payloadMatches,
      message: `Unsupported JWS alg: ${alg}`,
    };
  }

  const signingInput = Buffer.from(`${headerB64}.${payloadB64}`);
  const signature = Buffer.from(sigB64, "base64url");
  let signatureValid = false;

  if (alg === "RS256") {
    signatureValid = cryptoVerify(nodeAlg, signature, key, signingInput);
  } else if (alg === "ES256") {
    signatureValid = cryptoVerify("sha256", signature, key, signingInput);
  } else {
    return {
      ok: false,
      alg,
      kid,
      payloadMatches,
      message: `EdDSA verify not implemented in CLI yet`,
    };
  }

  const ok = signatureValid && payloadMatches;
  return {
    ok,
    alg,
    kid,
    payloadMatches,
    signatureValid,
    message: ok
      ? "Registry JWS signature valid"
      : `Signature valid: ${signatureValid}, payload matches: ${payloadMatches}`,
  };
}
