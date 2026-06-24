export const API_ERROR_CODES = {
  UNAUTHORIZED: "unauthorized",
  VALIDATION_FAILED: "validation_failed",
  CARD_NOT_FOUND: "card_not_found",
  NO_DOMAIN: "no_domain",
  NO_PENDING_VERIFICATION: "no_pending_verification",
  DOMAIN_TAKEN: "domain_taken",
  REGISTRY_CARD_ID_TAKEN: "registry_card_id_taken",
  PRODUCT_LIMIT: "product_limit",
  PLAN_LIMIT: "plan_limit",
  RESERVED_PLATFORM: "reserved_platform",
  RATE_LIMIT: "rate_limit",
  EDITION_NOT_ALLOWED: "edition_not_allowed",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
