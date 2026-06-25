import type { Card, CardEdition } from './types.js';

export type DiscoveredCapabilities = {
  /** Whether a usable agent_gateway pointer exists */
  available: boolean;
  edition: CardEdition;
  agent_gateway?: string;
  auth?: 'none' | 'oauth2' | 'api_key';
  scopes?: string[];
  /** Human-readable hint when available is false */
  reason?: string;
};

/**
 * Read capability manifest from a resolved card (Registry+ only).
 * Does not call the gateway — identity resolve must happen first.
 * @see docs/eil-access-spec-v0.1.md
 */
export function discoverCapabilities(card: Card): DiscoveredCapabilities {
  const edition = card.edition ?? 'core';

  if (edition !== 'registry_plus') {
    return {
      available: false,
      edition,
      reason: 'Capabilities require Registry+ edition (schema 1.2)',
    };
  }

  const caps = card.capabilities;
  if (!caps) {
    return {
      available: false,
      edition,
      reason: 'No capabilities object on card',
    };
  }

  if (!caps.agent_gateway) {
    return {
      available: false,
      edition,
      auth: caps.auth,
      scopes: caps.scopes,
      reason: 'capabilities.agent_gateway is not set',
    };
  }

  return {
    available: true,
    edition,
    agent_gateway: caps.agent_gateway,
    auth: caps.auth,
    scopes: caps.scopes,
  };
}
