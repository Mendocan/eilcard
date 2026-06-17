import { z } from "zod";

export const SCHEMA_VERSION = "1.0" as const;

export const cardTypeEnum = z.enum(["organization", "person"]);
export type CardType = z.infer<typeof cardTypeEnum>;

export const verificationMethodEnum = z.enum([
  "dns",
  "email",
  "tls",
  "trade_registry",
  "public_record",
]);
export type VerificationMethod = z.infer<typeof verificationMethodEnum>;

export const legalTypeEnum = z.enum([
  "technology_company",
  "smb",
  "enterprise",
  "public_institution",
  "university",
  "ngo",
  "individual",
]);
export type LegalType = z.infer<typeof legalTypeEnum>;

export const actionTypeEnum = z.enum([
  "call",
  "email",
  "link",
  "vcard",
  "calendar",
  "whatsapp",
  "app",
]);
export type ActionType = z.infer<typeof actionTypeEnum>;

export const organizationNameSchema = z.object({
  official: z.string().min(1).max(200),
  short: z.string().max(100).optional(),
  alternate: z.array(z.string()).optional(),
});
export type OrganizationName = z.infer<typeof organizationNameSchema>;

export const personNameSchema = z.object({
  full: z.string().min(1).max(200),
  given: z.string().max(100).optional(),
  family: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
});
export type PersonName = z.infer<typeof personNameSchema>;

export const contactSchema = z.object({
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  whatsapp: z.string().max(30).optional(),
});
export type Contact = z.infer<typeof contactSchema>;

export const legalSchema = z.object({
  country: z.string().length(2),
  type: legalTypeEnum.optional(),
  tax_id: z.string().max(50).optional(),
  trade_registry: z.string().max(100).optional(),
});
export type Legal = z.infer<typeof legalSchema>;

export const descriptionSchema = z.object({
  tagline: z.string().max(160).optional(),
  summary: z.string().max(2000).optional(),
});
export type Description = z.infer<typeof descriptionSchema>;

export const productSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  url: z.string().url().optional(),
});
export type Product = z.infer<typeof productSchema>;

export const appsSchema = z.object({
  play_store: z.string().url().optional(),
  app_store: z.string().url().optional(),
  web_app: z.string().url().optional(),
});
export type Apps = z.infer<typeof appsSchema>;

export const cardActionSchema = z.object({
  type: actionTypeEnum,
  label: z.string().min(1).max(100),
  value: z.string().max(500).optional(),
  url: z.string().url().optional(),
});
export type CardAction = z.infer<typeof cardActionSchema>;

export const cardModeSchema = z.object({
  id: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  active_links: z.array(z.string()).optional(),
});
export type CardMode = z.infer<typeof cardModeSchema>;

const cardBaseFields = {
  schema_version: z.literal(SCHEMA_VERSION),
  card_id: z.string().min(1).max(100),
  handle: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/)
    .optional(),
  verified: z.boolean().optional(),
  verification_method: z.array(verificationMethodEnum).optional(),
  contact: contactSchema,
  description: descriptionSchema.optional(),
  actions: z.array(cardActionSchema).max(20).optional(),
  same_as: z.array(z.string().url()).optional(),
  updated_at: z.string().datetime(),
  created_at: z.string().datetime().optional(),
  human_url: z.string().url().optional(),
  registry_url: z.string().url().optional(),
};

export const organizationCardSchema = z.object({
  ...cardBaseFields,
  type: z.literal("organization"),
  name: organizationNameSchema,
  legal: legalSchema.optional(),
  products: z.array(productSchema).max(50).optional(),
  apps: appsSchema.optional(),
  logo_url: z.string().url().optional(),
});
export type OrganizationCard = z.infer<typeof organizationCardSchema>;

export const personCardSchema = z.object({
  ...cardBaseFields,
  type: z.literal("person"),
  name: personNameSchema,
  organization_ref: z.string().max(100).optional(),
  modes: z.array(cardModeSchema).max(10).optional(),
  photo_url: z.string().url().optional(),
});
export type PersonCard = z.infer<typeof personCardSchema>;

export const cardSchema = z.discriminatedUnion("type", [
  organizationCardSchema,
  personCardSchema,
]);
export type Card = z.infer<typeof cardSchema>;

// --- Create input schemas (panel form -> API body) ---

export const createOrganizationCardSchema = z.object({
  type: z.literal("organization"),
  handle: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/),
  name: organizationNameSchema,
  contact: contactSchema,
  description: descriptionSchema.optional(),
  legal: legalSchema.optional(),
  products: z.array(productSchema).max(50).optional(),
  apps: appsSchema.optional(),
  logo_url: z.string().url().optional(),
  actions: z.array(cardActionSchema).max(20).optional(),
  same_as: z.array(z.string().url()).optional(),
  domain: z.string().max(253).optional(),
});

export const createPersonCardSchema = z.object({
  type: z.literal("person"),
  handle: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/),
  name: personNameSchema,
  contact: contactSchema,
  description: descriptionSchema.optional(),
  organization_ref: z.string().max(100).optional(),
  modes: z.array(cardModeSchema).max(10).optional(),
  photo_url: z.string().url().optional(),
  actions: z.array(cardActionSchema).max(20).optional(),
  same_as: z.array(z.string().url()).optional(),
  domain: z.string().max(253).optional(),
});

export const createCardSchema = z.discriminatedUnion("type", [
  createOrganizationCardSchema,
  createPersonCardSchema,
]);

// --- Patch schemas (dashboard edit -> API body) ---

export const patchOrganizationCardSchema = z.object({
  domain: z.string().max(253).optional(),
  name: organizationNameSchema.partial().optional(),
  contact: contactSchema.partial().optional(),
  description: descriptionSchema.optional(),
  legal: legalSchema.optional(),
  products: z.array(productSchema).max(50).optional(),
  apps: appsSchema.optional(),
  logo_url: z.string().url().optional(),
  actions: z.array(cardActionSchema).max(20).optional(),
  same_as: z.array(z.string().url()).max(20).optional(),
});

export const patchPersonCardSchema = z.object({
  domain: z.string().max(253).optional(),
  name: personNameSchema.partial().optional(),
  contact: contactSchema.partial().optional(),
  description: descriptionSchema.optional(),
  organization_ref: z.string().max(100).optional(),
  modes: z.array(cardModeSchema).max(10).optional(),
  photo_url: z.string().url().optional(),
  actions: z.array(cardActionSchema).max(20).optional(),
  same_as: z.array(z.string().url()).max(20).optional(),
});
