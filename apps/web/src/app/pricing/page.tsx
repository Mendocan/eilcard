import type { Metadata } from "next";
import Link from "next/link";
import { PricingEditions } from "@/components/pricing-editions";
import { PricingTable } from "@/components/pricing-table";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-header";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { pricingMessages } from "@/lib/i18n/pricing";
import { isPolarCheckoutConfigured } from "@/lib/polar-config";
import { getSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const p = pricingMessages[locale];
  return {
    title: p.metaTitle,
    description: p.metaDescription,
  };
}

export default async function PricingPage() {
  const locale = await getLocale();
  const m = t(locale);
  const p = pricingMessages[locale];
  const polarCheckout = isPolarCheckoutConfigured();
  const session = await getSession();

  return (
    <div className="min-h-screen">
      <SiteNav
        locale={locale}
        m={m.nav}
        user={session?.user ?? null}
      />

      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
          {p.eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {p.title}
        </h1>
        <p className="mt-4 leading-relaxed text-[var(--color-text-muted)]">
          {polarCheckout ? p.subtitleLive : p.subtitle}
        </p>

        <div className="mt-10">
          <PricingEditions copy={p} />
        </div>

        <section className="mt-14">
          <h2 className="text-lg font-semibold tracking-tight">{p.plansTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {p.plansIntro}
          </p>
          <div className="mt-6">
            <PricingTable copy={p} checkoutEnabled={polarCheckout} />
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-lg font-semibold">{p.churnTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {p.churnIntro}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-muted)]">
            {p.churnItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[var(--color-accent)]">·</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[var(--color-text-muted)]">{p.churnNote}</p>
        </section>

        <section className="mt-10 rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-6">
          <h2 className="text-lg font-semibold">{p.ctaTitle}</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{p.ctaBody}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {polarCheckout && session ? (
              <>
                <Link
                  href="/api/billing/checkout?tier=verified"
                  className="inline-flex rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium transition hover:border-[var(--color-accent)]"
                >
                  {p.checkoutVerified}
                </Link>
                <Link
                  href="/api/billing/checkout?tier=pro"
                  className="inline-flex rounded-lg bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90"
                >
                  {p.checkoutPro}
                </Link>
              </>
            ) : polarCheckout ? (
              <Link
                href="/login?next=/pricing"
                className="inline-flex rounded-lg bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90"
              >
                {p.checkoutSignIn}
              </Link>
            ) : session ? (
              <Link
                href="/dashboard"
                className="inline-flex rounded-lg bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90"
              >
                {p.backDashboard}
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-flex rounded-lg bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90"
              >
                {p.ctaRegister}
              </Link>
            )}
          </div>
        </section>

        <Link
          href="/"
          className="mt-10 inline-flex text-sm font-medium text-[var(--color-accent)] transition hover:opacity-80"
        >
          {p.backHome}
        </Link>
      </main>

      <SiteFooter m={m.footer} />
    </div>
  );
}
