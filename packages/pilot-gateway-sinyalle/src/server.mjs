/**
 * Sinyalle pilot agent gateway — reference implementation (EIL external).
 *
 * OAuth 2.1-style PKCE + scoped read endpoints for E3-B pilot.
 * NOT deployed on eilcard.com — run on Sinyalle infrastructure or locally.
 *
 * Usage:
 *   pnpm --filter @digitalcard/pilot-gateway-sinyalle start
 *   GATEWAY_PORT=8787 pnpm --filter @digitalcard/pilot-gateway-sinyalle start
 */
import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';

const PORT = Number(process.env.GATEWAY_PORT ?? '8787');
const ISSUER = (process.env.GATEWAY_ISSUER ?? `http://localhost:${PORT}`).replace(/\/$/, '');
const PILOT_CLIENT_ID = process.env.PILOT_CLIENT_ID ?? 'eil-pilot-agent';
const DEFAULT_EIL_CARD_ID = process.env.PILOT_EIL_CARD_ID ?? 'sinyalle.com';

/** @type {Map<string, { clientId: string, redirectUri: string, scope: string, eilCardId: string, codeChallenge: string, state: string }>} */
const authCodes = new Map();

/** @type {Map<string, { sub: string, eil_card_id: string, scope: string, exp: number }>} */
const accessTokens = new Map();

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

function html(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
}

function parseQuery(url) {
  const q = url.indexOf('?');
  const params = new URLSearchParams(q === -1 ? '' : url.slice(q + 1));
  return Object.fromEntries(params.entries());
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function parseFormBody(raw) {
  return Object.fromEntries(new URLSearchParams(raw).entries());
}

function verifyPkce(codeVerifier, codeChallenge) {
  const hash = createHash('sha256').update(codeVerifier).digest('base64url');
  return hash === codeChallenge;
}

function bearerToken(req) {
  const auth = req.headers.authorization ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  return match?.[1] ?? null;
}

function requireScope(token, required) {
  const scopes = new Set(token.scope.split(/\s+/).filter(Boolean));
  return scopes.has(required);
}

function wellKnownAgentGateway() {
  return {
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/oauth/authorize`,
    token_endpoint: `${ISSUER}/oauth/token`,
    revocation_endpoint: `${ISSUER}/oauth/revoke`,
    scopes_supported: ['read:profile', 'read:orders'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    entity_binding: 'eil_card_id',
    documentation: 'https://eilcard.com/docs/pilot-gateway-sinyalle.md',
  };
}

function consentPage({ clientId, scope, eilCardId, state, approveUrl }) {
  const scopes = scope.split(' ').filter(Boolean);
  const rows = scopes.map((s) => `<li><code>${s}</code></li>`).join('');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Agent access — Sinyalle pilot</title></head>
<body style="font-family:system-ui;max-width:32rem;margin:2rem auto;padding:0 1rem">
  <h1>Agent access consent</h1>
  <p>Entity: <strong>${eilCardId}</strong> (EIL Card)</p>
  <p>Client: <code>${clientId}</code></p>
  <p>Requested scopes:</p><ul>${rows}</ul>
  <form method="POST" action="${approveUrl}">
    <input type="hidden" name="state" value="${state}"/>
    <button type="submit" name="decision" value="approve">Approve</button>
    <button type="submit" name="decision" value="deny">Deny</button>
  </form>
</body></html>`;
}

const server = createServer(async (req, res) => {
  const method = req.method ?? 'GET';
  const path = (req.url ?? '/').split('?')[0];

  try {
    if (method === 'GET' && path === '/health') {
      return json(res, 200, { status: 'ok', issuer: ISSUER });
    }

    if (method === 'GET' && path === '/.well-known/agent-gateway') {
      return json(res, 200, wellKnownAgentGateway());
    }

    if (method === 'GET' && path === '/oauth/authorize') {
      const q = parseQuery(req.url ?? '');
      const clientId = q.client_id ?? PILOT_CLIENT_ID;
      const redirectUri = q.redirect_uri;
      const scope = q.scope ?? 'read:profile';
      const state = q.state ?? '';
      const codeChallenge = q.code_challenge ?? '';
      const eilCardId = q.eil_card_id ?? DEFAULT_EIL_CARD_ID;

      if (!redirectUri || !codeChallenge) {
        return json(res, 400, { error: 'invalid_request', message: 'redirect_uri and code_challenge required' });
      }

      const code = randomBytes(16).toString('hex');
      authCodes.set(code, {
        clientId,
        redirectUri,
        scope,
        eilCardId,
        codeChallenge,
        state,
      });

      const approveUrl = `/oauth/authorize/confirm?code=${code}`;
      return html(
        res,
        200,
        consentPage({ clientId, scope, eilCardId, state, approveUrl })
      );
    }

    if (method === 'POST' && path === '/oauth/authorize/confirm') {
      const raw = await readBody(req);
      const form = parseFormBody(raw);
      const q = parseQuery(req.url ?? '');
      const code = q.code;
      const entry = code ? authCodes.get(code) : null;
      if (!entry) return json(res, 400, { error: 'invalid_code' });

      if (form.decision !== 'approve') {
        authCodes.delete(code);
        const deny = new URL(entry.redirectUri);
        deny.searchParams.set('error', 'access_denied');
        if (entry.state) deny.searchParams.set('state', entry.state);
        res.writeHead(302, { Location: deny.toString() });
        return res.end();
      }

      const redirect = new URL(entry.redirectUri);
      redirect.searchParams.set('code', code);
      if (entry.state) redirect.searchParams.set('state', entry.state);
      res.writeHead(302, { Location: redirect.toString() });
      return res.end();
    }

    if (method === 'POST' && path === '/oauth/token') {
      const raw = await readBody(req);
      const form = parseFormBody(raw);
      if (form.grant_type !== 'authorization_code') {
        return json(res, 400, { error: 'unsupported_grant_type' });
      }

      const entry = authCodes.get(form.code);
      if (!entry) {
        return json(res, 400, { error: 'invalid_grant' });
      }
      if (entry.clientId !== (form.client_id ?? PILOT_CLIENT_ID)) {
        return json(res, 400, { error: 'invalid_client' });
      }
      if (!form.code_verifier || !verifyPkce(form.code_verifier, entry.codeChallenge)) {
        return json(res, 400, { error: 'invalid_grant', message: 'PKCE verification failed' });
      }

      authCodes.delete(form.code);

      const token = randomBytes(24).toString('hex');
      const exp = Math.floor(Date.now() / 1000) + 3600;
      accessTokens.set(token, {
        sub: 'pilot-user-1',
        eil_card_id: entry.eilCardId,
        scope: entry.scope,
        exp,
      });

      return json(res, 200, {
        access_token: token,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: entry.scope,
      });
    }

    if (method === 'POST' && path === '/oauth/revoke') {
      const raw = await readBody(req);
      const form = parseFormBody(raw);
      const tokenStr = form.token ?? bearerToken(req);
      if (!tokenStr) {
        return json(res, 400, { error: 'invalid_request' });
      }
      accessTokens.delete(tokenStr);
      return json(res, 200, { revoked: true });
    }

    if (method === 'GET' && path === '/v1/read/profile') {
      const tokenStr = bearerToken(req);
      const token = tokenStr ? accessTokens.get(tokenStr) : null;
      if (!token || token.exp < Date.now() / 1000) {
        return json(res, 401, { error: 'invalid_token' });
      }
      if (!requireScope(token, 'read:profile')) {
        return json(res, 403, { error: 'insufficient_scope', code: 'insufficient_scope' });
      }
      return json(res, 200, {
        eil_card_id: token.eil_card_id,
        extended_profile: {
          industry: 'Technology',
          employee_count_range: '11-50',
          support_email: 'hello@sinyalle.com',
          internal_note: 'Pilot private field — not in public EIL JSON',
        },
      });
    }

    if (method === 'GET' && path === '/v1/read/orders') {
      const tokenStr = bearerToken(req);
      const token = tokenStr ? accessTokens.get(tokenStr) : null;
      if (!token || token.exp < Date.now() / 1000) {
        return json(res, 401, { error: 'invalid_token' });
      }
      if (!requireScope(token, 'read:orders')) {
        return json(res, 403, { error: 'insufficient_scope', code: 'insufficient_scope' });
      }
      return json(res, 200, {
        eil_card_id: token.eil_card_id,
        orders: [
          { id: 'ord_pilot_001', date: '2026-06-01', total: 9.0, currency: 'USD', status: 'paid' },
          { id: 'ord_pilot_002', date: '2026-06-15', total: 29.0, currency: 'USD', status: 'paid' },
        ],
      });
    }

    return json(res, 404, { error: 'not_found' });
  } catch (err) {
    console.error('[pilot-gateway]', err);
    return json(res, 500, { error: 'server_error' });
  }
});

server.listen(PORT, () => {
  console.log(`[pilot-gateway-sinyalle] listening on ${ISSUER}`);
  console.log(`  well-known: ${ISSUER}/.well-known/agent-gateway`);
  console.log(`  read:profile: GET ${ISSUER}/v1/read/profile`);
  console.log(`  read:orders:  GET ${ISSUER}/v1/read/orders`);
});
