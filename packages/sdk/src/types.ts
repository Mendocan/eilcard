/**
 * @digitalcard/sdk — types aligned with schema/v1.0.schema.json
 * Faz B3 — specification types (implementation in Faz D)
 */

export const SCHEMA_VERSION = '1.0' as const;

export type CardType = 'organization' | 'person';

export type VerificationMethod =
  | 'dns'
  | 'email'
  | 'tls'
  | 'trade_registry'
  | 'public_record';

export type LegalType =
  | 'technology_company'
  | 'smb'
  | 'enterprise'
  | 'public_institution'
  | 'university'
  | 'ngo'
  | 'individual';

export type ActionType =
  | 'call'
  | 'email'
  | 'link'
  | 'vcard'
  | 'calendar'
  | 'whatsapp'
  | 'app';

export interface OrganizationName {
  official: string;
  short?: string;
  alternate?: string[];
}

export interface PersonName {
  full: string;
  given?: string;
  family?: string;
  title?: string;
}

export interface Contact {
  phone?: string;
  email?: string;
  website?: string;
  whatsapp?: string;
}

export interface Legal {
  country: string;
  type?: LegalType;
  tax_id?: string;
  trade_registry?: string;
}

export interface Description {
  tagline?: string;
  summary?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  url?: string;
}

export interface Apps {
  play_store?: string;
  app_store?: string;
  web_app?: string;
}

export interface CardAction {
  type: ActionType;
  label: string;
  value?: string;
  url?: string;
}

export interface CardMode {
  id: string;
  label: string;
  active_links?: string[];
}

export interface CardBase {
  schema_version: typeof SCHEMA_VERSION;
  card_id: string;
  type: CardType;
  handle?: string;
  verified?: boolean;
  verification_method?: VerificationMethod[];
  contact: Contact;
  description?: Description;
  actions?: CardAction[];
  same_as?: string[];
  updated_at: string;
  created_at?: string;
  human_url?: string;
  registry_url?: string;
}

export interface OrganizationCard extends CardBase {
  type: 'organization';
  name: OrganizationName;
  legal?: Legal;
  products?: Product[];
  apps?: Apps;
  logo_url?: string;
}

export interface PersonCard extends CardBase {
  type: 'person';
  name: PersonName;
  organization_ref?: string;
  modes?: CardMode[];
  photo_url?: string;
}

export type Card = OrganizationCard | PersonCard;

export type ResolveSource = 'registry' | 'well-known';

export interface ResolveMeta {
  source: ResolveSource;
  well_known_url?: string;
  registry_url?: string;
  resolved_at: string;
}

export interface ResolveResult {
  card: Card;
  meta: ResolveMeta;
}

export interface ResolveInput {
  /** Domain — e.g. sinyalle.com */
  domain?: string;
  /** Registry handle — e.g. sinyalle */
  handle?: string;
}

export interface DigitalCardClientOptions {
  /** Registry API base — default https://api.digitalcard.tr */
  registryBaseUrl?: string;
  /** Optional API key for higher quota */
  apiKey?: string;
  /** Request timeout ms — default 10000 */
  timeout?: number;
  /** Skip well-known fallback */
  skipWellKnownFallback?: boolean;
  /** Custom fetch implementation (Node, edge, test mocks) */
  fetch?: typeof fetch;
}
