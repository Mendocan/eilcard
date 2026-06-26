import type { Card } from './types.js';

export type JwsVerifyResult = {
  ok: boolean;
  alg?: string;
  kid?: string;
  payloadMatches: boolean;
  signatureValid?: boolean;
  message: string;
};

export type JwsVerifyOptions = {
  /** PEM-encoded registry public key for cryptographic verify */
  publicKeyPem?: string;
};

function decodeBase64Url(value: string): Uint8Array {
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJsonPart(b64: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(b64))) as Record<string, unknown>;
}

/** Card JSON without signatures — signing payload canonical form. */
export function canonicalCardWithoutSignatures(card: Card): Record<string, unknown> {
  const clone = { ...card } as Record<string, unknown>;
  delete clone.signatures;
  return clone;
}

function payloadMatchesCard(payload: Record<string, unknown>, card: Card): boolean {
  const canonical = canonicalCardWithoutSignatures(card);
  if (JSON.stringify(payload) === JSON.stringify(canonical)) return true;
  const sortKeys = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => [k, sortKeys(v)])
      );
    }
    return value;
  };
  return JSON.stringify(sortKeys(payload)) === JSON.stringify(sortKeys(canonical));
}

function pemToSpkiDer(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '');
  const binary = atob(body);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importVerifyKey(alg: string, pem: string): Promise<CryptoKey> {
  const spki = new Uint8Array(pemToSpkiDer(pem));
  if (alg === 'RS256') {
    return crypto.subtle.importKey(
      'spki',
      spki,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
  }
  if (alg === 'ES256') {
    return crypto.subtle.importKey(
      'spki',
      spki,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
  }
  throw new Error(`Unsupported JWS alg: ${alg}`);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function verifySignature(
  alg: string,
  key: CryptoKey,
  signingInput: Uint8Array,
  signature: Uint8Array
): Promise<boolean> {
  const input = toArrayBuffer(signingInput);
  const sig = toArrayBuffer(signature);
  if (alg === 'RS256') {
    return crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, sig, input);
  }
  if (alg === 'ES256') {
    return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, sig, input);
  }
  return false;
}

/**
 * Verify Registry+ `signatures.registry.jws` on a resolved card.
 * Without `publicKeyPem`, checks payload structure only (no crypto).
 */
export async function verifyRegistryJws(
  card: Card,
  options: JwsVerifyOptions = {}
): Promise<JwsVerifyResult> {
  const jws = card.signatures?.registry?.jws;
  if (!jws) {
    return {
      ok: false,
      payloadMatches: false,
      message: 'No signatures.registry.jws on card',
    };
  }

  const parts = jws.split('.');
  if (parts.length !== 3) {
    return {
      ok: false,
      payloadMatches: false,
      message: 'Invalid compact JWS format',
    };
  }

  const [headerB64, payloadB64, sigB64] = parts;
  const header = decodeJsonPart(headerB64);
  const payload = decodeJsonPart(payloadB64);
  const alg = String(header.alg ?? card.signatures?.registry?.alg ?? '');
  const kid = card.signatures?.registry?.kid ?? (header.kid as string | undefined);
  const payloadMatches = payloadMatchesCard(payload, card);

  if (!options.publicKeyPem) {
    return {
      ok: payloadMatches,
      alg,
      kid,
      payloadMatches,
      message: payloadMatches
        ? 'JWS payload matches card (crypto verify skipped — pass publicKeyPem)'
        : 'JWS payload does not match public card JSON',
    };
  }

  if (alg !== 'RS256' && alg !== 'ES256') {
    return {
      ok: false,
      alg,
      kid,
      payloadMatches,
      message: `Unsupported JWS alg for verify: ${alg}`,
    };
  }

  try {
    const key = await importVerifyKey(alg, options.publicKeyPem);
    const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = new Uint8Array(decodeBase64Url(sigB64));
    const signatureValid = await verifySignature(alg, key, signingInput, signature);
    const ok = signatureValid && payloadMatches;
    return {
      ok,
      alg,
      kid,
      payloadMatches,
      signatureValid,
      message: ok
        ? 'Registry JWS signature valid'
        : `Signature valid: ${signatureValid}, payload matches: ${payloadMatches}`,
    };
  } catch (error) {
    return {
      ok: false,
      alg,
      kid,
      payloadMatches,
      signatureValid: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
