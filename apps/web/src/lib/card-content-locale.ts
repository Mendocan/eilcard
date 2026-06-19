import type { Locale } from "@/lib/i18n/types";

const TR_CHARS = /[ğüşıöçĞÜŞİÖÇ]/;

/** Match UI chrome to card body language, not the visitor cookie. */
export function getCardContentLocale(body: Record<string, unknown>): Locale {
  const description = body.description as
    | { tagline?: string; summary?: string }
    | undefined;
  const text = [description?.tagline, description?.summary]
    .filter(Boolean)
    .join(" ");

  if (TR_CHARS.test(text)) return "tr";

  const products = body.products as Array<{ name?: string; description?: string }> | undefined;
  if (products?.some((p) => TR_CHARS.test(`${p.name ?? ""} ${p.description ?? ""}`))) {
    return "tr";
  }

  return "en";
}
