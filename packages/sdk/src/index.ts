export { DigitalCard, DigitalCardClient } from './client.js';
export {
  buildEILResolveToolDefinition,
  invokeEILResolve,
} from './agent-tool.js';
export type { EILResolveToolInput } from './agent-tool.js';
export { toSchemaOrg, toVCard, toLlmsTxtSection } from './bridges.js';
export type { SchemaOrgDocument } from './bridges.js';
export { discoverCapabilities } from './capabilities.js';
export type { DiscoveredCapabilities } from './capabilities.js';
export {
  parseCapabilityScopes,
  discoverActCapabilities,
  buildIdempotencyKey,
  buildAgentActHeaders,
  agentActHeadersToFetch,
} from './act.js';
export type {
  ScopeKind,
  ParsedCapabilityScopes,
  CapabilityActionManifest,
  DiscoveredActCapabilities,
  IdempotencyKeyInput,
  AgentActHeaders,
} from './act.js';
export {
  CardNotFoundError,
  DigitalCardError,
  InvalidResolveInputError,
  RegistryError,
  SchemaValidationError,
} from './errors.js';
export type {
  ActionType,
  Apps,
  Card,
  CardAction,
  CardBase,
  CardEdition,
  CardMode,
  CardType,
  Contact,
  Description,
  DigitalCardClientOptions,
  Legal,
  LegalType,
  OrganizationCard,
  OrganizationName,
  PersonCard,
  PersonName,
  Product,
  ResolveInput,
  ResolveMeta,
  ResolveResult,
  ResolveSource,
  SchemaVersion,
  VerificationMethod,
} from './types.js';
export { SCHEMA_VERSION, SUPPORTED_SCHEMA_VERSIONS } from './types.js';
