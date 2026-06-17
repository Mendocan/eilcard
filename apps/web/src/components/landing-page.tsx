"use client";

import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import type { Messages } from "@/lib/i18n/messages";
import { GitHubIcon } from "@/components/icons/github-icon";
import { SiteHeader } from "@/components/site-header";
import type { Locale } from "@/lib/i18n/types";

const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/Mendocan/eilcard";

const SDK_SNIPPET = `import { DigitalCard } from '@digitalcard/sdk'

const { card } = await DigitalCard.resolve({
  domain: 'example.com'
})

console.log(card.name.official)
console.log(card.verified) // true`;

type Props = {
  locale: Locale;
  m: Messages;
};

export function LandingPage({ locale, m }: Props) {
  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} m={m.nav} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.18),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
            {m.hero.eyebrow}
          </p>
          <h1 className="max-w-none text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl lg:whitespace-nowrap">
            {m.hero.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[var(--color-text-muted)]">
            {m.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-[var(--color-text)] px-5 py-3 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90"
            >
              {m.hero.ctaPrimary}
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-5 py-3 text-sm font-medium transition hover:border-[var(--color-border-strong)]"
            >
              <GitHubIcon className="h-4 w-4" />
              {m.hero.ctaSecondary}
            </a>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="mb-10 text-sm font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          {m.pillars.title}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {m.pillars.items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-6 transition hover:border-[var(--color-border-strong)]"
            >
              <h3 className="mb-2 font-semibold">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SSL vs EIL */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="mb-8 max-w-2xl text-2xl font-semibold tracking-tight">
            {m.compare.title}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                  <th className="px-5 py-4 font-medium">Layer</th>
                  <th className="px-5 py-4 font-medium">Question</th>
                  <th className="hidden px-5 py-4 font-medium md:table-cell">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-text-muted)]">
                <tr className="border-b border-[var(--color-border)]">
                  <td className="px-5 py-4 font-medium text-[var(--color-text)]">
                    {m.compare.ssl.layer}
                  </td>
                  <td className="px-5 py-4">{m.compare.ssl.question}</td>
                  <td className="hidden px-5 py-4 md:table-cell">
                    {m.compare.ssl.example}
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-4 font-medium text-[var(--color-accent)]">
                    {m.compare.eil.layer}
                  </td>
                  <td className="px-5 py-4">{m.compare.eil.question}</td>
                  <td className="hidden px-5 py-4 md:table-cell">
                    <code className="rounded bg-[var(--color-bg)] px-1.5 py-0.5 text-xs">
                      {m.compare.eil.example}
                    </code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[var(--color-text-muted)]">
            {m.compare.footnote}
          </p>
        </div>
      </section>

      {/* Scope + Discovery grid */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              {m.notThis.title}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] p-5">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-error)]">
                  {m.notThis.not}
                </p>
                <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
                  {m.notThis.notItems.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-[var(--color-error)]">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-5">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-success)]">
                  {m.notThis.is}
                </p>
                <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
                  {m.notThis.isItems.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-[var(--color-success)]">+</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              {m.discovery.title}
            </h2>
            <ol className="space-y-3">
              {m.discovery.steps.map((step, i) => (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)]">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* SDK */}
      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                {m.sdk.title}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{m.sdk.caption}</h2>
            </div>
            <pre className="w-full max-w-xl overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 text-[13px] leading-relaxed">
              <code>{SDK_SNIPPET}</code>
            </pre>
          </div>
        </div>
      </section>

      <SiteFooter m={m.footer} />
    </div>
  );
}
