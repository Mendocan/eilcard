import type { Card } from './types.js';
import { discoverCapabilities, type DiscoveredCapabilities } from './capabilities.js';

export type ScopeKind = 'read' | 'write' | 'act' | 'unknown';

export type ParsedCapabilityScopes = {
  read: string[];
  write: string[];
  act: string[];
  unknown: string[];
  all: string[];
};

export type CapabilityActionManifest = {
  id: string;
  label?: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  scopes: string[];
  idempotent?: boolean;
};

export type DiscoveredActCapabilities = DiscoveredCapabilities & {
  scopesParsed: ParsedCapabilityScopes;
  actions?: CapabilityActionManifest[];
  hasWriteOrAct: boolean;
};

const SCOPE_KIND_PATTERN = /^(read|write|act):/;

/**
 * Classify capability scope strings by kind prefix.
 * @see docs/eil-act-spec-v0.1.md §3
 */
export function parseCapabilityScopes(
  scopes?: string[]
): ParsedCapabilityScopes {
  const result: ParsedCapabilityScopes = {
    read: [],
    write: [],
    act: [],
    unknown: [],
    all: scopes ? [...scopes] : [],
  };

  if (!scopes?.length) return result;

  for (const scope of scopes) {
    if (scope.startsWith('read:')) result.read.push(scope);
    else if (scope.startsWith('write:')) result.write.push(scope);
    else if (scope.startsWith('act:')) result.act.push(scope);
    else if (SCOPE_KIND_PATTERN.test(scope)) result.unknown.push(scope);
    else result.unknown.push(scope);
  }

  return result;
}

/**
 * Discover read/write/act capability manifest from a resolved card.
 * @see docs/eil-act-spec-v0.1.md
 */
export function discoverActCapabilities(card: Card): DiscoveredActCapabilities {
  const base = discoverCapabilities(card);
  const scopesParsed = parseCapabilityScopes(base.scopes);
  const actions = card.capabilities?.actions;

  return {
    ...base,
    scopesParsed,
    actions,
    hasWriteOrAct:
      scopesParsed.write.length > 0 ||
      scopesParsed.act.length > 0 ||
      (actions?.length ?? 0) > 0,
  };
}

export type IdempotencyKeyInput = {
  agentClientId: string;
  actionId: string;
  entityId: string;
  nonce: string;
};

/**
 * Build recommended Idempotency-Key value for agent act requests.
 * @see docs/eil-act-spec-v0.1.md §5.2
 */
export function buildIdempotencyKey(input: IdempotencyKeyInput): string {
  const slug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  return [
    'eil-act',
    slug(input.agentClientId),
    slug(input.actionId),
    slug(input.entityId),
    slug(input.nonce),
  ].join('/');
}

export type AgentActHeaders = {
  authorization: string;
  idempotencyKey: string;
  actionId: string;
  cardId: string;
};

/**
 * Standard HTTP headers for an idempotent agent act call.
 */
export function buildAgentActHeaders(input: {
  accessToken: string;
  idempotencyKey: string;
  actionId: string;
  cardId: string;
}): AgentActHeaders {
  return {
    authorization: `Bearer ${input.accessToken}`,
    idempotencyKey: input.idempotencyKey,
    actionId: input.actionId,
    cardId: input.cardId,
  };
}

/**
 * Map SDK header object to fetch-compatible HeadersInit.
 */
export function agentActHeadersToFetch(
  headers: AgentActHeaders
): Record<string, string> {
  return {
    Authorization: headers.authorization,
    'Idempotency-Key': headers.idempotencyKey,
    'X-EIL-Action-Id': headers.actionId,
    'X-EIL-Card-Id': headers.cardId,
  };
}
