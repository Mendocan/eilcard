/**
 * E2E pilot: read OAuth → write/act OAuth → idempotent POST → audit → revoke.
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

function slug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildIdempotencyKey({ agentClientId, actionId, entityId, nonce }) {
  return ['eil-act', slug(agentClientId), slug(actionId), slug(entityId), slug(nonce)].join('/');
}

function fail(step, detail) {
  console.error(`[e2e-pilot] FAIL ${step}:`, detail);
  process.exit(1);
}

async function oauthToken(scope) {
  const { verifier, challenge } = pkcePair();
  const state = base64url(randomBytes(8));
  const authUrl = new URL(`${BASE}/oauth/authorize`);
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('eil_card_id', EIL_CARD_ID);

  const consentRes = await fetch(authUrl.toString());
  if (!consentRes.ok) fail(`authorize:${scope}`, consentRes.status);
  const html = await consentRes.text();
  const codeMatch = html.match(/confirm\?code=([a-f0-9]+)/);
  if (!codeMatch) fail(`authorize:${scope}`, 'consent code not found');
  const pendingCode = codeMatch[1];

  const confirmRes = await fetch(`${BASE}/oauth/authorize/confirm?code=${pendingCode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ decision: 'approve', state }),
    redirect: 'manual',
  });
  if (confirmRes.status !== 302) fail(`consent:${scope}`, confirmRes.status);
  const location = confirmRes.headers.get('location');
  if (!location) fail(`consent:${scope}`, 'missing Location');
  const authCode = new URL(location).searchParams.get('code');
  if (!authCode) fail(`consent:${scope}`, 'missing code');

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
  if (!tokenRes.ok) fail(`token:${scope}`, await tokenRes.text());
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) fail(`token:${scope}`, 'no access_token');
  return tokenJson.access_token;
}

async function main() {
  console.log(`[e2e-pilot] gateway=${BASE}`);

  const wellKnownRes = await fetch(`${BASE}/.well-known/agent-gateway`);
  if (!wellKnownRes.ok) fail('well-known', wellKnownRes.status);
  const wellKnown = await wellKnownRes.json();
  if (!wellKnown.authorization_endpoint) fail('well-known', 'missing authorization_endpoint');
  if (!wellKnown.scopes_supported?.includes('write:post')) {
    fail('well-known', 'write:post not in scopes_supported');
  }
  console.log('[e2e-pilot] OK well-known');

  const readToken = await oauthToken('read:profile read:orders');
  console.log('[e2e-pilot] OK oauth read scopes');

  const profileRes = await fetch(`${BASE}/v1/read/profile`, {
    headers: { Authorization: `Bearer ${readToken}` },
  });
  if (!profileRes.ok) fail('read:profile', profileRes.status);
  const profile = await profileRes.json();
  if (profile.eil_card_id !== EIL_CARD_ID) fail('read:profile', 'eil_card_id mismatch');
  console.log('[e2e-pilot] OK read:profile');

  const ordersRes = await fetch(`${BASE}/v1/read/orders`, {
    headers: { Authorization: `Bearer ${readToken}` },
  });
  if (!ordersRes.ok) fail('read:orders', ordersRes.status);
  console.log('[e2e-pilot] OK read:orders');

  const actToken = await oauthToken('write:post act:comment');
  console.log('[e2e-pilot] OK oauth write/act scopes (separate consent)');

  const nonce = base64url(randomBytes(8));
  const idempotencyKey = buildIdempotencyKey({
    agentClientId: CLIENT_ID,
    actionId: 'create_post',
    entityId: EIL_CARD_ID,
    nonce,
  });
  const postBody = JSON.stringify({
    title: 'Pilot quarterly update',
    body: 'E3-C idempotent act test',
  });
  const postHeaders = {
    Authorization: `Bearer ${actToken}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
    'X-EIL-Action-Id': 'create_post',
    'X-EIL-Card-Id': EIL_CARD_ID,
  };

  const postRes = await fetch(`${BASE}/v1/posts`, {
    method: 'POST',
    headers: postHeaders,
    body: postBody,
  });
  if (!postRes.ok) fail('write:post', await postRes.text());
  const postJson = await postRes.json();
  if (!postJson.id) fail('write:post', 'missing post id');
  if (postJson._eil?.replay) fail('write:post', 'unexpected replay on first request');
  console.log('[e2e-pilot] OK write:post');

  const replayRes = await fetch(`${BASE}/v1/posts`, {
    method: 'POST',
    headers: postHeaders,
    body: postBody,
  });
  if (!replayRes.ok) fail('write:post replay', replayRes.status);
  const replayJson = await replayRes.json();
  if (!replayJson._eil?.replay) fail('write:post replay', 'expected replay:true');
  if (replayJson.id !== postJson.id) fail('write:post replay', 'id mismatch');
  console.log('[e2e-pilot] OK idempotency replay');

  const conflictRes = await fetch(`${BASE}/v1/posts`, {
    method: 'POST',
    headers: postHeaders,
    body: JSON.stringify({ title: 'Different title', body: 'conflict' }),
  });
  if (conflictRes.status !== 409) fail('idempotency conflict', `expected 409, got ${conflictRes.status}`);
  console.log('[e2e-pilot] OK idempotency conflict 409');

  const commentKey = buildIdempotencyKey({
    agentClientId: CLIENT_ID,
    actionId: 'add_comment',
    entityId: EIL_CARD_ID,
    nonce: base64url(randomBytes(8)),
  });
  const commentRes = await fetch(`${BASE}/v1/act/comment`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${actToken}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': commentKey,
      'X-EIL-Action-Id': 'add_comment',
      'X-EIL-Card-Id': EIL_CARD_ID,
    },
    body: JSON.stringify({ post_id: postJson.id, text: 'Great update!' }),
  });
  if (!commentRes.ok) fail('act:comment', await commentRes.text());
  console.log('[e2e-pilot] OK act:comment');

  const auditRes = await fetch(`${BASE}/v1/audit/recent`, {
    headers: { Authorization: `Bearer ${readToken}` },
  });
  if (!auditRes.ok) fail('audit', auditRes.status);
  const audit = await auditRes.json();
  const successes = (audit.entries ?? []).filter((e) => e.outcome === 'success');
  if (successes.length < 2) fail('audit', 'expected success audit entries');
  console.log('[e2e-pilot] OK audit log');

  const revokeRes = await fetch(`${BASE}/oauth/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: readToken }),
  });
  if (!revokeRes.ok) fail('revoke', revokeRes.status);

  const afterRevoke = await fetch(`${BASE}/v1/read/profile`, {
    headers: { Authorization: `Bearer ${readToken}` },
  });
  if (afterRevoke.status !== 401) fail('revoke', `expected 401, got ${afterRevoke.status}`);
  console.log('[e2e-pilot] OK revoke → 401');

  const resolveRes = await fetch(
    `https://eilcard.com/api/v1/resolve?domain=${encodeURIComponent(EIL_CARD_ID)}`
  );
  if (resolveRes.ok) {
    const resolved = await resolveRes.json();
    const gw = resolved?.card?.capabilities?.agent_gateway;
    const scopes = resolved?.card?.capabilities?.scopes ?? [];
    if (gw) {
      console.log(`[e2e-pilot] OK registry capabilities.agent_gateway=${gw}`);
    }
    if (scopes.includes('write:post')) {
      console.log('[e2e-pilot] OK registry write:post scope');
    } else {
      console.warn('[e2e-pilot] WARN registry missing write:post (re-run seed on VPS)');
    }
  }

  console.log('[e2e-pilot] ALL PASSED');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
