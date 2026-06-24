import type { Locale } from "@/lib/i18n/types";

const TR_CHARS = /[ğüşıöçĞÜŞİÖÇ]/;

/** Match UI chrome to card body language, not the visitor cookie. */
export function getCardContentLocale(body: Record<string, unknown>): Locale {
  const explicit = body.content_locale;
  if (explicit === "tr" || explicit === "en") {
    return explicit;
  }

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

  const offerings = body.offerings as
    | Array<{ name?: string; description?: string; items?: Array<{ name?: string }> }>
    | undefined;
  if (
    offerings?.some((o) => {
      const top = TR_CHARS.test(`${o.name ?? ""} ${o.description ?? ""}`);
      const nested = o.items?.some((item) =>
        TR_CHARS.test(`${item.name ?? ""}`)
      );
      return top || nested;
    })
  ) {
    return "tr";
  }

  return "en";
}
