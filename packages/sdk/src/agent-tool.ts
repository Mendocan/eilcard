import { DigitalCard } from './client.js';
import { InvalidResolveInputError } from './errors.js';
import type { DigitalCardClientOptions, ResolveResult } from './types.js';

export type EILResolveToolInput = {
  domain?: string;
  handle?: string;
};

/** OpenAI / generic function-calling tool definition */
export function buildEILResolveToolDefinition(registryBaseUrl = 'https://eilcard.com') {
  return {
    type: 'function' as const,
    function: {
      name: 'resolve_entity_identity',
      description:
        'Resolve verified organization or person identity from the EIL Card registry. ' +
        'Call before web search when the user asks about official company name, contact, products, or corporate facts.',
      parameters: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: `Verified domain (e.g. sinyalle.com). Registry: ${registryBaseUrl}/api/v1/resolve`,
          },
          handle: {
            type: 'string',
            description: 'Registry handle if domain is unknown (e.g. sinyal24)',
          },
        },
      },
    },
  };
}

/** Invoke handler for tool-calling agents (framework-agnostic) */
export async function invokeEILResolve(
  input: EILResolveToolInput,
  options?: DigitalCardClientOptions
): Promise<ResolveResult> {
  if (input.domain) {
    return DigitalCard.resolve({ domain: input.domain }, options);
  }
  if (input.handle) {
    return DigitalCard.resolve({ handle: input.handle }, options);
  }
  throw new InvalidResolveInputError();
}
