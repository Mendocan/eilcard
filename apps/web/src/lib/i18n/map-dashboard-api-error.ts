import type { Messages } from "./messages";

export type DashboardApiErrorPayload = {
  error?: string;
  code?: string;
  reason?: string;
};

export function mapDashboardApiError(
  data: DashboardApiErrorPayload,
  m: Messages["dashboard"],
  fallback: string
): string {
  if (data.reason === "org_limit") return m.orgNotAllowed;
  if (data.reason === "card_limit") return m.limitReached;
  if (data.reason === "reserved_handle") return m.reservedHandleError;
  if (data.reason === "reserved_domain") return m.reservedDomainError;

  switch (data.code) {
    case "validation_failed":
      return m.apiValidationFailed;
    case "domain_taken":
      return m.apiDomainTaken;
    case "product_limit":
      return m.apiProductLimit;
    case "registry_card_id_taken":
      return m.apiRegistryCardIdTaken;
    case "no_domain":
      return m.verifyNoDomain;
    case "no_pending_verification":
      return m.apiNoPendingVerification;
    case "card_not_found":
      return m.apiCardNotFound;
    case "unauthorized":
      return m.apiUnauthorized;
    case "rate_limit":
      return m.apiRateLimit;
    case "plan_limit":
      return m.limitReached;
    case "edition_not_allowed":
      return m.apiEditionNotAllowed;
    case "business_fields_not_allowed":
      return m.apiBusinessFieldsNotAllowed;
    case "offering_limit":
      return m.apiOfferingLimit;
    case "signatures_not_allowed":
      return m.apiSignaturesNotAllowed;
    case "enterprise_addon_required":
      return m.apiEnterpriseAddonRequired;
    case "reserved_platform":
      return m.reservedDomainError;
    default:
      return fallback;
  }
}
