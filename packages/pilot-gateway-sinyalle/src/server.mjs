/**
 * Sinyalle pilot agent gateway — reference implementation (EIL external).
 *
 * OAuth 2.1-style PKCE + scoped read/write/act endpoints for E3-B/C pilot.
 * NOT deployed on eilcard.com — run on Sinyalle infrastructure or locally.
 */
import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';

const PORT = Number(process.env.GATEWAY_PORT ?? '8787');
const ISSUER = (process.env.GATEWAY_ISSUER ?? `http://localhost:${PORT}`).replace(/\/$/, '');
const PILOT_CLIENT_ID = process.env.PILOT_CLIENT_ID ?? 'eil-pilot-agent';
const DEFAULT_EIL_CARD_ID = process.env.PILOT_EIL_CARD_ID ?? 'sinyalle.com';

const SCOPES_SUPPORTED = [
  'read:profile',
  'read:orders',
  'write:post',
  'act:comment',
];

/** @type {Map<string, { clientId: string, redirectUri: string, scope: string, eilCardId: string, codeChallenge: string, state: string }>} */
const authCodes = new Map();

/** @type {Map<string, { sub: string, clientId: string, eil_card_id: string, scope: string, exp: number }>} */
const accessTokens = new Map();

/** @type {Map<string, { bodyHash: string, status: number, body: object }>} */
const idempotencyStore = new Map();

/** @type {Array<Record<string, unknown>>} */
const auditLog = [];
const MAX_AUDIT = 500;

/** @type {Map<string, { id: string, title: string, body: string, created_at: string }>} */
const posts = new Map();

let postSeq = 1;
let commentSeq = 1;

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

function scopeList(scope) {
  return scope.split(/\s+/).filter(Boolean);
}

function requireScope(token, required) {
  const scopes = new Set(scopeList(token.scope));
  return scopes.has(required);
}

function hasWriteOrActScope(scopes) {
  return scopes.some((s) => s.startsWith('write:') || s.startsWith('act:'));
}

function logAudit(entry) {
  auditLog.push({ timestamp: new Date().toISOString(), ...entry });
  if (auditLog.length > MAX_AUDIT) auditLog.shift();
}

function wellKnownAgentGateway() {
  return {
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/oauth/authorize`,
    token_endpoint: `${ISSUER}/oauth/token`,
    revocation_endpoint: `${ISSUER}/oauth/revoke`,
    scopes_supported: SCOPES_SUPPORTED,
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    entity_binding: 'eil_card_id',
    act_endpoints_supported: true,
    documentation: 'https://eilcard.com/docs/pilot-gateway-sinyalle.md',
  };
}

function consentPage({ clientId, scope, eilCardId, state, approveUrl }) {
  const scopes = scopeList(scope);
  const readRows = scopes
    .filter((s) => s.startsWith('read:'))
    .map((s) => `<li><code>${s}</code></li>`)
    .join('');
  const writeActRows = scopes
    .filter((s) => s.startsWith('write:') || s.startsWith('act:'))
    .map((s) => `<li><code>${s}</code></li>`)
    .join('');
  const writeWarning = hasWriteOrActScope(scopes)
    ? `<div style="margin:1rem 0;padding:0.75rem;border:1px solid #b45309;background:#fffbeb;border-radius:8px">
  <strong>Write / act scopes</strong>
  <p style="margin:0.5rem 0 0;font-size:0.9rem">This agent may create or change data on your behalf. Approve only if you trust the client.</p>
  <ul>${writeActRows}</ul>
</div>`
    : '';
  const readBlock = readRows
    ? `<p>Read scopes:</p><ul>${readRows}</ul>`
    : '';
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Agent access — Sinyalle pilot</title></head>
<body style="font-family:system-ui;max-width:32rem;margin:2rem auto;padding:0 1rem">
  <h1>Agent access consent</h1>
  <p>Entity: <strong>${eilCardId}</strong> (EIL Card)</p>
  <p>Client: <code>${clientId}</code></p>
  ${readBlock}
  ${writeWarning}
  <form method="POST" action="${approveUrl}">
    <input type="hidden" name="state" value="${state}"/>
    <button type="submit" name="decision" value="approve">Approve</button>
    <button type="submit" name="decision" value="deny">Deny</button>
  </form>
</body></html>`;
}

async function handleIdempotentAct(req, res, token, requiredScope, actionId, handler) {
  const idempotencyKey = req.headers['idempotency-key'];
  const headerActionId = req.headers['x-eil-action-id'] ?? '';
  const cardIdHeader = req.headers['x-eil-card-id'] ?? '';

  if (cardIdHeader && cardIdHeader !== token.eil_card_id) {
    logAudit({
      outcome: 'denied',
      eil_card_id: token.eil_card_id,
      action_id: headerActionId || actionId,
      reason: 'card_id_mismatch',
    });
    return json(res, 403, { error: 'entity_binding_failed' });
  }

  if (!requireScope(token, requiredScope)) {
    logAudit({
      outcome: 'denied',
      eil_card_id: token.eil_card_id,
      action_id: headerActionId || actionId,
      scopes: requiredScope,
      reason: 'insufficient_scope',
    });
    return json(res, 403, { error: 'insufficient_scope', code: 'insufficient_scope' });
  }

  const raw = await readBody(req);
  const bodyHash = createHash('sha256').update(raw).digest('hex');

  if (idempotencyKey) {
    const stored = idempotencyStore.get(idempotencyKey);
    if (stored) {
      if (stored.bodyHash !== bodyHash) {
        logAudit({
          outcome: 'denied',
          eil_card_id: token.eil_card_id,
          action_id: headerActionId || actionId,
          idempotency_key: idempotencyKey,
          reason: 'idempotency_key_reused',
        });
        return json(res, 409, { error: 'idempotency_key_reused' });
      }
      const replayBody = {
        ...stored.body,
        _eil: { ...(stored.body._eil ?? {}), replay: true },
      };
      return json(res, stored.status, replayBody);
    }
  }

  let parsed = {};
  if (raw.trim()) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json(res, 400, { error: 'invalid_json' });
    }
  }

  const result = handler(parsed, token);
  const status = result.status ?? 201;

  if (status >= 400) {
    logAudit({
      outcome: 'error',
      eil_card_id: token.eil_card_id,
      user_id: token.sub,
      agent_client_id: token.clientId,
      action_id: headerActionId || actionId,
      scopes: requiredScope,
      idempotency_key: idempotencyKey ?? null,
      reason: result.data?.error ?? 'handler_error',
    });
    return json(res, status, result.data);
  }

  const responseBody = {
    ...result.data,
    _eil: {
      action_id: headerActionId || actionId,
      idempotency_key: idempotencyKey ?? null,
      replay: false,
    },
  };

  if (idempotencyKey) {
    idempotencyStore.set(idempotencyKey, {
      bodyHash,
      status,
      body: responseBody,
    });
  }

  logAudit({
    outcome: 'success',
    eil_card_id: token.eil_card_id,
    user_id: token.sub,
    agent_client_id: token.clientId,
    action_id: headerActionId || actionId,
    scopes: requiredScope,
    idempotency_key: idempotencyKey ?? null,
    resource_id: result.resourceId,
  });

  return json(res, status, responseBody);
}

function authenticate(req, res) {
  const tokenStr = bearerToken(req);
  const token = tokenStr ? accessTokens.get(tokenStr) : null;
  if (!token || token.exp < Date.now() / 1000) {
    json(res, 401, { error: 'invalid_token' });
    return null;
  }
  return token;
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
        return json(res, 400, {
          error: 'invalid_request',
          message: 'redirect_uri and code_challenge required',
        });
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
        clientId: entry.clientId,
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
      const token = authenticate(req, res);
      if (!token) return;
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
      const token = authenticate(req, res);
      if (!token) return;
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

    if (method === 'GET' && path === '/v1/audit/recent') {
      const token = authenticate(req, res);
      if (!token) return;
      if (!requireScope(token, 'read:profile')) {
        return json(res, 403, { error: 'insufficient_scope', code: 'insufficient_scope' });
      }
      return json(res, 200, {
        eil_card_id: token.eil_card_id,
        entries: auditLog.slice(-50),
      });
    }

    if (method === 'POST' && path === '/v1/posts') {
      const token = authenticate(req, res);
      if (!token) return;
      return handleIdempotentAct(req, res, token, 'write:post', 'create_post', (body) => {
        const title = typeof body.title === 'string' ? body.title.trim() : '';
        const text = typeof body.body === 'string' ? body.body.trim() : '';
        if (!title) {
          return { status: 400, data: { error: 'title_required' }, resourceId: null };
        }
        const id = `post_${postSeq++}`;
        const created_at = new Date().toISOString();
        posts.set(id, { id, title, body: text, created_at });
        return {
          status: 201,
          resourceId: id,
          data: { id, title, body: text, status: 'published', created_at },
        };
      });
    }

    if (method === 'POST' && path === '/v1/act/comment') {
      const token = authenticate(req, res);
      if (!token) return;
      return handleIdempotentAct(req, res, token, 'act:comment', 'add_comment', (body) => {
        const postId = typeof body.post_id === 'string' ? body.post_id : '';
        const text = typeof body.text === 'string' ? body.text.trim() : '';
        if (!postId || !text) {
          return { status: 400, data: { error: 'post_id_and_text_required' }, resourceId: null };
        }
        if (!posts.has(postId)) {
          return { status: 404, data: { error: 'post_not_found' }, resourceId: null };
        }
        const id = `cmt_${commentSeq++}`;
        return {
          status: 201,
          resourceId: id,
          data: {
            id,
            post_id: postId,
            text,
            status: 'posted',
            created_at: new Date().toISOString(),
          },
        };
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
  console.log(`  read:  GET ${ISSUER}/v1/read/profile | /v1/read/orders`);
  console.log(`  write: POST ${ISSUER}/v1/posts (write:post)`);
  console.log(`  act:   POST ${ISSUER}/v1/act/comment (act:comment)`);
  console.log(`  audit: GET ${ISSUER}/v1/audit/recent`);
});
