/**
 * E2E pilot: well-known → OAuth PKCE + consent → read:profile + read:orders → revoke.
 *
 * Usage:
 *   node packages/pilot-gateway-sinyalle/scripts/e2e-pilot.mjs
 *   GATEWAY_BASE=https://agent-gateway.eilcard.com node packages/pilot-gateway-sinyalle/scripts/e2e-pilot.mjs
 */
import { createHash, randomBytes } from 'node:crypto';

const BASE = (process.env.GATEWAY_BASE ?? process.env.GATEWAY_ISSUER ?? 'http://localhost:8787').replace(
  /\/$/,
  ''
);
const CLIENT_ID = process.env.PILOT_CLIENT_ID ?? 'eil-pilot-agent';
const REDIRECT_URI = process.env.PILOT_REDIRECT_URI ?? 'https://eilcard.com/docs/agents';
const EIL_CARD_ID = process.env.PILOT_EIL_CARD_ID ?? 'sinyalle.com';

function base64url(buf) {
  return buf.toString('base64url');
}

function pkcePair() {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

function fail(step, detail) {
  console.error(`[e2e-pilot] FAIL ${step}:`, detail);
  process.exit(1);
}

async function main() {
  console.log(`[e2e-pilot] gateway=${BASE}`);

  const wellKnownRes = await fetch(`${BASE}/.well-known/agent-gateway`);
  if (!wellKnownRes.ok) fail('well-known', wellKnownRes.status);
  const wellKnown = await wellKnownRes.json();
  if (!wellKnown.authorization_endpoint) fail('well-known', 'missing authorization_endpoint');
  console.log('[e2e-pilot] OK well-known');

  const { verifier, challenge } = pkcePair();
  const state = base64url(randomBytes(8));
  const authUrl = new URL(`${BASE}/oauth/authorize`);
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', 'read:profile read:orders');
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('eil_card_id', EIL_CARD_ID);

  const consentRes = await fetch(authUrl.toString());
  if (!consentRes.ok) fail('authorize', consentRes.status);
  const html = await consentRes.text();
  const codeMatch = html.match(/confirm\?code=([a-f0-9]+)/);
  if (!codeMatch) fail('authorize', 'consent code not found in HTML');
  const pendingCode = codeMatch[1];

  const confirmRes = await fetch(`${BASE}/oauth/authorize/confirm?code=${pendingCode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ decision: 'approve', state }),
    redirect: 'manual',
  });
  if (confirmRes.status !== 302) fail('consent', confirmRes.status);
  const location = confirmRes.headers.get('location');
  if (!location) fail('consent', 'missing Location header');
  const authCode = new URL(location).searchParams.get('code');
  if (!authCode) fail('consent', 'missing code in redirect');

  const tokenRes = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });
  if (!tokenRes.ok) fail('token', await tokenRes.text());
  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token;
  if (!accessToken) fail('token', 'no access_token');
  console.log('[e2e-pilot] OK oauth token');

  const profileRes = await fetch(`${BASE}/v1/read/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) fail('read:profile', profileRes.status);
  const profile = await profileRes.json();
  if (profile.eil_card_id !== EIL_CARD_ID) fail('read:profile', 'eil_card_id mismatch');
  console.log('[e2e-pilot] OK read:profile');

  const ordersRes = await fetch(`${BASE}/v1/read/orders`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!ordersRes.ok) fail('read:orders', ordersRes.status);
  const orders = await ordersRes.json();
  if (!Array.isArray(orders.orders) || orders.orders.length < 1) fail('read:orders', 'empty orders');
  console.log('[e2e-pilot] OK read:orders');

  const revokeRes = await fetch(`${BASE}/oauth/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: accessToken }),
  });
  if (!revokeRes.ok) fail('revoke', revokeRes.status);

  const afterRevoke = await fetch(`${BASE}/v1/read/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (afterRevoke.status !== 401) fail('revoke', `expected 401, got ${afterRevoke.status}`);
  console.log('[e2e-pilot] OK revoke → 401');

  const resolveRes = await fetch(
    `https://eilcard.com/api/v1/resolve?domain=${encodeURIComponent(EIL_CARD_ID)}`
  );
  if (resolveRes.ok) {
    const resolved = await resolveRes.json();
    const gw = resolved?.card?.capabilities?.agent_gateway;
    if (gw) {
      console.log(`[e2e-pilot] OK registry capabilities.agent_gateway=${gw}`);
    } else {
      console.warn('[e2e-pilot] WARN registry resolve missing capabilities (run seed script on VPS)');
    }
  }

  console.log('[e2e-pilot] ALL PASSED');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
