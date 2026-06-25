/**
 * JSON Schema → LLM tool definition exporters (OpenAI, Anthropic, Gemini).
 * @see packages/sdk/scripts/export-tool-definitions.mjs
 */

export type JsonSchemaObject = Record<string, unknown>;

export const EIL_RESOLVE_TOOL_NAME = 'resolve_entity_identity';

export const EIL_RESOLVE_TOOL_DESCRIPTION =
  'Resolve verified organization or person identity from the EIL Card registry. ' +
  'Call before web search when the user asks about official company name, contact, products, or corporate facts.';

/** Input JSON Schema for resolve_entity_identity (draft-07 compatible subset). */
export function buildResolveInputJsonSchema(registryBaseUrl = 'https://eilcard.com'): JsonSchemaObject {
  const base = registryBaseUrl.replace(/\/$/, '');
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://eilcard.com/schema/tool/resolve-entity-input.json',
    title: 'EILResolveInput',
    type: 'object',
    additionalProperties: false,
    properties: {
      domain: {
        type: 'string',
        description: `Verified root domain (e.g. sinyalle.com). Registry: ${base}/api/v1/resolve`,
        pattern: '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$',
      },
      handle: {
        type: 'string',
        description: 'Registry handle if domain is unknown (e.g. sinyal24)',
        minLength: 2,
        maxLength: 50,
      },
    },
    oneOf: [{ required: ['domain'] }, { required: ['handle'] }],
  };
}

export type OpenAIToolDefinition = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: JsonSchemaObject;
  };
};

export type AnthropicToolDefinition = {
  name: string;
  description: string;
  input_schema: JsonSchemaObject;
};

export type GeminiFunctionDeclaration = {
  name: string;
  description: string;
  parameters: JsonSchemaObject;
};

export type EILResolveToolDefinitions = {
  jsonSchema: JsonSchemaObject;
  openai: OpenAIToolDefinition;
  anthropic: AnthropicToolDefinition;
  gemini: GeminiFunctionDeclaration;
};

/** Strip $schema/$id for providers that reject meta keys in parameters. */
function parametersForProvider(schema: JsonSchemaObject): JsonSchemaObject {
  const { $schema: _s, $id: _i, title: _t, ...rest } = schema;
  return rest;
}

export function buildEILResolveToolDefinitions(
  registryBaseUrl = 'https://eilcard.com'
): EILResolveToolDefinitions {
  const jsonSchema = buildResolveInputJsonSchema(registryBaseUrl);
  const parameters = parametersForProvider(jsonSchema);

  return {
    jsonSchema,
    openai: {
      type: 'function',
      function: {
        name: EIL_RESOLVE_TOOL_NAME,
        description: EIL_RESOLVE_TOOL_DESCRIPTION,
        parameters,
      },
    },
    anthropic: {
      name: EIL_RESOLVE_TOOL_NAME,
      description: EIL_RESOLVE_TOOL_DESCRIPTION,
      input_schema: parameters,
    },
    gemini: {
      name: EIL_RESOLVE_TOOL_NAME,
      description: EIL_RESOLVE_TOOL_DESCRIPTION,
      parameters,
    },
  };
}

/** @deprecated Use buildEILResolveToolDefinitions().openai */
export function buildEILResolveToolDefinition(registryBaseUrl = 'https://eilcard.com') {
  return buildEILResolveToolDefinitions(registryBaseUrl).openai;
}

export function exportToolDefinitionsJson(registryBaseUrl = 'https://eilcard.com') {
  return buildEILResolveToolDefinitions(registryBaseUrl);
}
