import type { Metadata } from "next";
import Link from "next/link";
import { CodeSnippet } from "@/components/code-snippet";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-header";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import {
  whitepaperDiscoveryFlow,
  whitepaperExampleJson,
} from "@/lib/i18n/whitepaper";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = t(locale);
  return {
    title: m.whitepaper.metaTitle,
    description: m.whitepaper.metaDescription,
  };
}

function StatusBadge({
  status,
  liveLabel,
  roadmapLabel,
}: {
  status: "live" | "roadmap";
  liveLabel: string;
  roadmapLabel: string;
}) {
  const isLive = status === "live";
  return (
    <span
      className={
        isLive
          ? "rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-800 dark:bg-green-950/50 dark:text-green-200"
          : "rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]"
      }
    >
      {isLive ? liveLabel : roadmapLabel}
    </span>
  );
}

export default async function WhitepaperPage() {
  const locale = await getLocale();
  const m = t(locale);
  const w = m.whitepaper;
  const copyLabel = locale === "tr" ? "Kodu kopyala" : "Copy code";
  const copiedLabel = locale === "tr" ? "Kopyalandı" : "Copied";

  return (
    <div className="min-h-screen">
      <SiteNav locale={locale} m={m.nav} />

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
          {w.eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {w.title}
        </h1>
        <p className="mt-2 text-lg text-[var(--color-text-muted)]">
          {w.subtitle}
        </p>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">{w.tagline}</p>
        <p className="mt-6 text-xs text-[var(--color-text-muted)]">
          {w.version} · {w.author} · {w.date}
        </p>

        <section className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-6 sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            {w.executiveSummaryTitle}
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-text-muted)]">
            {w.executiveSummary}
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">{w.problemTitle}</h2>
          <p className="mt-3 text-[var(--color-text-muted)]">{w.problemIntro}</p>
          <ul className="mt-6 space-y-5">
            {w.problemItems.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 p-5"
              >
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">{w.solutionTitle}</h2>
          <p className="mt-4 leading-relaxed text-[var(--color-text-muted)]">
            {w.solutionBody}
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">{w.architectureTitle}</h2>
          <p className="mt-4 leading-relaxed text-[var(--color-text-muted)]">
            {w.architectureIntro}
          </p>
          <p className="mt-6 text-sm font-medium text-[var(--color-text-muted)]">
            {w.discoveryCaption}
          </p>
          <pre className="code-panel mt-3 overflow-x-auto rounded-2xl p-5 text-xs leading-relaxed">
            {whitepaperDiscoveryFlow}
          </pre>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">{w.schemaTitle}</h2>
          <p className="mt-4 leading-relaxed text-[var(--color-text-muted)]">
            {w.schemaIntro}
          </p>
          <p className="mt-6 text-sm font-medium text-[var(--color-text-muted)]">
            {w.schemaCaption}
          </p>
          <div className="mt-3">
            <CodeSnippet
              code={whitepaperExampleJson}
              copyLabel={copyLabel}
              copiedLabel={copiedLabel}
            />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">{w.securityTitle}</h2>
          <p className="mt-4 leading-relaxed text-[var(--color-text-muted)]">
            {w.securityIntro}
          </p>
          <ul className="mt-6 space-y-4">
            {w.securityItems.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-[var(--color-border)] p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{item.title}</h3>
                  <StatusBadge
                    status={item.status}
                    liveLabel={w.statusLive}
                    roadmapLabel={w.statusRoadmap}
                  />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">{w.ecosystemTitle}</h2>
          <p className="mt-4 leading-relaxed text-[var(--color-text-muted)]">
            {w.ecosystemIntro}
          </p>
          <ul className="mt-6 space-y-4">
            {w.roadmapItems.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-[var(--color-border)] p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{item.title}</h3>
                  <StatusBadge
                    status={item.status}
                    liveLabel={w.statusLive}
                    roadmapLabel={w.statusRoadmap}
                  />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--color-primary)]/25 bg-[var(--color-bg)]/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            {w.pilotLabel}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {w.pilotBody}
          </p>
          <Link
            href="/kart/sinyal24"
            className="mt-3 inline-flex text-sm font-medium text-[var(--color-accent)] hover:opacity-80"
          >
            eilcard.com/kart/sinyal24 →
          </Link>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">{w.conclusionTitle}</h2>
          <p className="mt-4 leading-relaxed text-[var(--color-text-muted)]">
            {w.conclusion}
          </p>
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90"
            >
              {w.ctaPrimary}
            </Link>
            <Link
              href="/docs/agents"
              className="inline-flex items-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium transition hover:border-[var(--color-border-strong)]"
            >
              {w.ctaSecondary}
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium transition hover:border-[var(--color-border-strong)]"
            >
              {w.ctaDocs}
            </Link>
          </div>
          <Link
            href="/"
            className="mt-6 inline-flex text-sm font-medium text-[var(--color-accent)] transition hover:opacity-80"
          >
            {w.backHome}
          </Link>
        </section>
      </main>

      <SiteFooter m={m.footer} />
    </div>
  );
}
