import type { Metadata } from "next";
import Link from "next/link";
import { CodeSnippet } from "@/components/code-snippet";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getAgentDocsSnippets } from "@/lib/agent-docs-snippets";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://eilcard.com";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = t(locale);
  return {
    title: m.docsAgents.metaTitle,
    description: m.docsAgents.metaDescription,
  };
}

export default async function DocsAgentsPage() {
  const locale = await getLocale();
  const m = t(locale);
  const a = m.docsAgents;
  const snippets = getAgentDocsSnippets(BASE_URL);

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} m={m.nav} />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
          {a.eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {a.title}
        </h1>
        <p className="mt-6 leading-relaxed text-[var(--color-text-muted)]">
          {a.intro}
        </p>

        <div className="mt-8 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-5 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
          <p className="font-medium">{a.discoveryNoteTitle}</p>
          <p className="mt-2 leading-relaxed">{snippets.discoveryNote}</p>
        </div>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">{a.systemPromptTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {a.systemPromptBody}
          </p>
          <div className="mt-4">
            <CodeSnippet
              code={snippets.systemPrompt}
              copyLabel={a.copy}
              copiedLabel={a.copied}
            />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">{a.curlTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {a.curlBody}
          </p>
          <div className="mt-4 space-y-4">
            <CodeSnippet
              code={snippets.curlWellKnown}
              copyLabel={a.copy}
              copiedLabel={a.copied}
            />
            <CodeSnippet
              code={snippets.curlResolve}
              copyLabel={a.copy}
              copiedLabel={a.copied}
            />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">{a.sdkTitle}</h2>
          <div className="mt-4">
            <CodeSnippet
              code={snippets.sdkResolve}
              copyLabel={a.copy}
              copiedLabel={a.copied}
            />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">{a.openaiTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {a.openaiBody}
          </p>
          <div className="mt-4 space-y-4">
            <CodeSnippet
              code={snippets.openaiTool}
              copyLabel={a.copy}
              copiedLabel={a.copied}
            />
            <h3 className="text-sm font-medium">{a.openaiHandlerTitle}</h3>
            <CodeSnippet
              code={snippets.openaiToolHandler}
              copyLabel={a.copy}
              copiedLabel={a.copied}
            />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">{a.anthropicTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {a.anthropicBody}
          </p>
          <div className="mt-4">
            <CodeSnippet
              code={snippets.anthropicTool}
              copyLabel={a.copy}
              copiedLabel={a.copied}
            />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">{a.geminiTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {a.geminiBody}
          </p>
          <div className="mt-4 space-y-4">
            <CodeSnippet
              code={snippets.geminiFunction}
              copyLabel={a.copy}
              copiedLabel={a.copied}
            />
            <h3 className="text-sm font-medium">{a.geminiPromptTitle}</h3>
            <CodeSnippet
              code={snippets.geminiPrompt}
              copyLabel={a.copy}
              copiedLabel={a.copied}
            />
          </div>
        </section>

        <div className="mt-12 flex flex-wrap gap-4 text-sm font-medium">
          <Link
            href="/docs"
            className="text-[var(--color-accent)] transition hover:opacity-80"
          >
            {a.backDocs}
          </Link>
          <Link
            href="/"
            className="text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
          >
            {a.backHome}
          </Link>
        </div>
      </main>

      <SiteFooter m={m.footer} />
    </div>
  );
}
