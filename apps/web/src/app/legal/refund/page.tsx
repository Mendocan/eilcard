import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocumentBody } from "@/components/legal-document";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-header";
import { getLocale } from "@/lib/i18n/get-locale";
import { legalMessages } from "@/lib/i18n/legal";
import { t } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const doc = legalMessages[locale].refund;
  return {
    title: doc.metaTitle,
    description: doc.metaDescription,
  };
}

export default async function RefundPage() {
  const locale = await getLocale();
  const m = t(locale);
  const legal = legalMessages[locale];

  return (
    <div className="min-h-screen">
      <SiteNav locale={locale} m={m.nav} />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <LegalDocumentBody doc={legal.refund} />
        <div className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/pricing" className="text-[var(--color-accent)] hover:opacity-80">
            {m.footer.pricing}
          </Link>
          <Link href="/legal/terms" className="text-[var(--color-accent)] hover:opacity-80">
            {m.footer.terms}
          </Link>
          <Link href="/" className="text-[var(--color-accent)] hover:opacity-80">
            {legal.backHome}
          </Link>
        </div>
      </main>
      <SiteFooter m={m.footer} />
    </div>
  );
}
