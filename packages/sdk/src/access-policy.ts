import type {
  AccessPolicy,
  AccessPolicyStance,
  AccessPolicyState,
  AccessPolicyTraining,
  Card,
} from './types.js';

export type AccessInteractionKind = 'read' | 'act';

export type DiscoveredAccessPolicy = {
  /** Whether the card carries an access_policy block */
  declared: boolean;
  /** Resolved stance for reading scoped/private data */
  read: AccessPolicyStance;
  /** Resolved stance for write/act operations */
  act: AccessPolicyStance;
  /** Training opt-in/out (default: allow when unset) */
  training: AccessPolicyTraining;
  /** Operational state (default: active when unset) */
  state: AccessPolicyState;
  /** Whether the policy has an expires_at in the past */
  expired: boolean;
  contact?: string;
  policyUrl?: string;
  raw?: AccessPolicy;
};

/** Default stance when nothing is declared: public identity open, scoped via gateway. */
const IMPLICIT_DEFAULT: AccessPolicyStance = 'gateway';

function resolveStance(
  policy: AccessPolicy | undefined,
  kind: AccessInteractionKind
): AccessPolicyStance {
  if (!policy) return IMPLICIT_DEFAULT;
  const explicit = policy.agents?.[kind];
  if (explicit) return explicit;
  if (policy.default) return policy.default;
  return IMPLICIT_DEFAULT;
}

/**
 * Normalize a card's `access_policy` into resolved stances.
 * @see docs/eil-access-policy-spec-v0.1.md
 */
export function discoverAccessPolicy(card: Card): DiscoveredAccessPolicy {
  const policy = card.access_policy;
  const expiresAt = policy?.expires_at ? Date.parse(policy.expires_at) : NaN;
  const expired = Number.isFinite(expiresAt) ? expiresAt < Date.now() : false;

  return {
    declared: Boolean(policy),
    read: resolveStance(policy, 'read'),
    act: resolveStance(policy, 'act'),
    training: policy?.agents?.training ?? 'allow',
    state: policy?.state ?? 'active',
    expired,
    contact: policy?.contact,
    policyUrl: policy?.policy_url,
    raw: policy,
  };
}

/** True when an agent may proceed with the interaction without gateway auth. */
export function isInteractionAllowed(
  card: Card,
  kind: AccessInteractionKind
): boolean {
  return discoverAccessPolicy(card)[kind] === 'open';
}

/** True when the policy denies the interaction outright. */
export function isInteractionDenied(
  card: Card,
  kind: AccessInteractionKind
): boolean {
  return discoverAccessPolicy(card)[kind] === 'deny';
}

/** True when the entity opts out of model-training use of card data. */
export function isTrainingDenied(card: Card): boolean {
  return discoverAccessPolicy(card).training === 'deny';
}

/** True when the gateway is operationally available (active and not expired). */
export function isGatewayOperational(card: Card): boolean {
  const p = discoverAccessPolicy(card);
  return p.state === 'active' && !p.expired;
}
