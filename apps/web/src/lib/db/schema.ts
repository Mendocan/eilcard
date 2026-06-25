import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  jsonb,
  timestamp,
  integer,
  date,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const cardTypeEnum = pgEnum("card_type", ["organization", "person"]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "verified",
  "failed",
]);

export const verificationMethodEnum = pgEnum("verification_method_type", [
  "dns",
  "email",
]);

export const planTierEnum = pgEnum("plan_tier", ["free", "verified", "pro"]);

export const cardEditionEnum = pgEnum("card_edition", [
  "core",
  "business",
  "registry_plus",
]);

export const adminRoleEnum = pgEnum("admin_role", [
  "admin",
  "moderator",
  "editor",
]);

// --- Better Auth tables ---

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  isPlatformOperator: boolean("is_platform_operator").notNull().default(false),
  suspendedAt: timestamp("suspended_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Digital Card tables ---

export const cards = pgTable(
  "cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    handle: varchar("handle", { length: 50 }).notNull().unique(),
    cardId: varchar("card_id", { length: 100 }).notNull().unique(),
    type: cardTypeEnum("type").notNull(),
    edition: cardEditionEnum("edition").notNull().default("core"),
    schemaVersion: varchar("schema_version", { length: 10 })
      .notNull()
      .default("1.0"),
    body: jsonb("body").notNull(),
    verified: boolean("verified").notNull().default(false),
    verificationMethod: text("verification_method")
      .array()
      .notNull()
      .default([]),
    domain: varchar("domain", { length: 253 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("cards_handle_idx").on(table.handle),
    uniqueIndex("cards_card_id_idx").on(table.cardId),
    uniqueIndex("cards_domain_idx")
      .on(table.domain)
      .where(sql`${table.domain} IS NOT NULL`),
    index("cards_user_id_idx").on(table.userId),
  ]
);

export const domainVerifications = pgTable("domain_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardId: uuid("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  domain: varchar("domain", { length: 253 }).notNull(),
  method: verificationMethodEnum("method").notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  status: verificationStatusEnum("status").notNull().default("pending"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const resolveEvents = pgTable(
  "resolve_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [
    uniqueIndex("resolve_events_card_date_idx").on(table.cardId, table.date),
  ]
);

export const adminOperators = pgTable(
  "admin_operators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: adminRoleEnum("role").notNull().default("editor"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at"),
  },
  (table) => [uniqueIndex("admin_operators_email_idx").on(table.email)]
);

export const adminInvites = pgTable(
  "admin_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    role: adminRoleEnum("role").notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    invitedByOperatorId: uuid("invited_by_operator_id").references(
      () => adminOperators.id,
      { onDelete: "set null" }
    ),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("admin_invites_email_idx").on(table.email)]
);

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    operatorId: uuid("operator_id").references(() => adminOperators.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 64 }).notNull(),
    targetType: varchar("target_type", { length: 32 }).notNull(),
    targetId: varchar("target_id", { length: 255 }).notNull(),
    details: jsonb("details"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("admin_audit_logs_created_at_idx").on(table.createdAt)]
);

export const cardChangeLogs = pgTable(
  "card_change_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    changedFields: text("changed_fields").array().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("card_change_logs_card_id_idx").on(table.cardId),
    index("card_change_logs_created_at_idx").on(table.createdAt),
  ]
);

export const userPlans = pgTable(
  "user_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tier: planTierEnum("tier").notNull().default("free"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
    polarSubscriptionId: varchar("polar_subscription_id", { length: 255 }),
    enterpriseAddon: boolean("enterprise_addon").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_plans_user_id_idx").on(table.userId),
    index("user_plans_tier_idx").on(table.tier),
  ]
);
