import type { Metadata } from "next";
import Link from "next/link";
import { CardView } from "@/components/card-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-header";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = t(locale).exampleCard;
  return {
    title: m.metaTitle,
    description: m.metaDescription,
  };
}

export default async function ExampleCardPage() {
  const locale = await getLocale();
  const m = t(locale);
  const ex = m.exampleCard;
  const card = ex.card;
  const labels = m.publicCard;

  return (
    <div className="min-h-screen">
      <SiteNav locale={locale} m={m.nav} />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
              {ex.eyebrow}
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              {ex.title}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
              {ex.intro}
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-5">
                <p className="text-sm font-medium">{ex.livePilot}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {ex.livePilotHint}
                </p>
                <Link
                  href="/kart/sinyal24"
                  className="mt-3 inline-flex text-sm font-medium text-[var(--color-accent)] transition hover:opacity-80"
                >
                  eilcard.com/kart/sinyal24 →
                </Link>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-5">
                <p className="text-sm font-medium">{ex.liveOperator}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {ex.liveOperatorHint}
                </p>
                <Link
                  href="/kart/eilcard"
                  className="mt-3 inline-flex text-sm font-medium text-[var(--color-accent)] transition hover:opacity-80"
                >
                  eilcard.com/kart/eilcard →
                </Link>
              </div>
            </div>

            <Link
              href="/"
              className="mt-8 inline-flex text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
            >
              {m.about.backHome}
            </Link>
          </div>

          <div className="flex justify-center lg:justify-end">
            <CardView
              labels={labels}
              name={card.nameOfficial}
              shortName={card.nameShort}
              tagline={card.tagline}
              summary={card.summary}
              verified
              products={card.products}
              linkActions={card.links}
              sameAs={card.sameAs}
              contact={card.contact}
              handle="example"
              demo
              demoBadge={ex.demoBadge}
              footerNote={ex.footerNote}
            />
          </div>
        </div>
      </main>

      <SiteFooter m={m.footer} />
    </div>
  );
}
