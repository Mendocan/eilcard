import { DigitalCard } from './client.js';
import { InvalidResolveInputError } from './errors.js';
import type { DigitalCardClientOptions, ResolveResult } from './types.js';

export type EILResolveToolInput = {
  domain?: string;
  handle?: string;
};

export {
  buildEILResolveToolDefinition,
  buildEILResolveToolDefinitions,
  buildResolveInputJsonSchema,
  exportToolDefinitionsJson,
  EIL_RESOLVE_TOOL_NAME,
  EIL_RESOLVE_TOOL_DESCRIPTION,
} from './tool-schema-export.js';

export type {
  AnthropicToolDefinition,
  EILResolveToolDefinitions,
  GeminiFunctionDeclaration,
  JsonSchemaObject,
  OpenAIToolDefinition,
} from './tool-schema-export.js';

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
