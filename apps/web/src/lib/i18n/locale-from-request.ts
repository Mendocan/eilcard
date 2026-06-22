import type { Locale } from "./types";
import { DEFAULT_LOCALE, LOCALES } from "./types";

export function localeFromRequest(request?: Request): Locale {
  if (!request) return DEFAULT_LOCALE;

  const cookie = request.headers.get("cookie");
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    const value = match?.[1]?.trim();
    if (value && LOCALES.includes(value as Locale)) {
      return value as Locale;
    }
  }

  const accept = request.headers.get("accept-language")?.toLowerCase() ?? "";
  if (accept.includes("tr")) return "tr";

  return DEFAULT_LOCALE;
}
