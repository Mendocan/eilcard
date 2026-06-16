import { cookies } from "next/headers";
import type { Locale } from "./types";
import { DEFAULT_LOCALE, LOCALES } from "./types";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const raw = jar.get("locale")?.value;
  if (raw && LOCALES.includes(raw as Locale)) {
    return raw as Locale;
  }
  return DEFAULT_LOCALE;
}
