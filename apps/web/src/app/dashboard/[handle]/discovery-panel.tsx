"use client";

import { useState } from "react";
import type { Messages } from "@/lib/i18n/messages";

type CheckResult = {
  status: string;
  url: string;
  content_type?: string;
  remote_updated_at?: string;
  registry_updated_at: string;
  message?: string;
  nginx_snippet?: string;
  cpanel_path?: string;
};

type Props = {
  handle: string;
  domain: string | null;
  appUrl: string;
  m: Messages["dashboard"];
};

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs font-mono text-[var(--color-text)]";

function statusClass(status: string) {
  if (status === "ok") return "text-green-700 dark:text-green-300";
  if (status === "stale") return "text-amber-700 dark:text-amber-300";
  return "text-[var(--color-text-muted)]";
}

export function DiscoveryPanel({ handle, domain, appUrl, m }: Props) {
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState("");

  const base = appUrl.replace(/\/$/, "");
  const resolveUrl = domain
    ? `${base}/api/v1/resolve?domain=${encodeURIComponent(domain)}`
    : null;
  const registryWellKnownUrl = domain
    ? `${base}/api/v1/well-known?domain=${encodeURIComponent(domain)}`
    : null;
  const domainWellKnown = domain
    ? `https://${domain}/.well-known/digital-card`
    : null;

  async function runCheck() {
    if (!domain) return;
    setLoading(true);
    const res = await fetch(`/api/v1/cards/${handle}/well-known-check`);
    const data = await res.json();
    setCheck(data);
    setLoading(false);
  }

  async function copyText(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  function statusLabel(status: string) {
    const map: Record<string, string> = {
      ok: m.discoveryStatusOk,
      missing: m.discoveryStatusMissing,
      html: m.discoveryStatusHtml,
      invalid_json: m.discoveryStatusInvalid,
      mismatch: m.discoveryStatusMismatch,
      stale: m.discoveryStatusStale,
      unreachable: m.discoveryStatusUnreachable,
    };
    return map[status] ?? status;
  }

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:col-span-2">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {m.discoveryTitle}
      </h2>
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">
        {m.discoverySubtitle}
      </p>

      <div className="mb-4 rounded-lg border border-green-200 bg-green-50/80 p-3 text-sm text-green-900 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100">
        {m.discoveryRegistryFirst}
      </div>

      <div className="space-y-3">
        {resolveUrl && (
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
              {m.discoveryResolve}
            </p>
            <div className="flex gap-2">
              <input readOnly value={resolveUrl} className={inputClass} />
              <button
                type="button"
                onClick={() => copyText("resolve", resolveUrl)}
                className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium hover:bg-[var(--color-bg)]"
              >
                {copied === "resolve" ? m.discoveryCopied : m.discoveryCopy}
              </button>
            </div>
          </div>
        )}

        {registryWellKnownUrl && (
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
              {m.discoveryRegistryWellKnown}
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={registryWellKnownUrl}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => copyText("rwk", registryWellKnownUrl)}
                className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium hover:bg-[var(--color-bg)]"
              >
                {copied === "rwk" ? m.discoveryCopied : m.discoveryCopy}
              </button>
            </div>
          </div>
        )}

        {domainWellKnown && (
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
              {m.discoveryDomainWellKnown}
            </p>
            <div className="flex gap-2">
              <input readOnly value={domainWellKnown} className={inputClass} />
              <button
                type="button"
                onClick={() => copyText("dwk", domainWellKnown)}
                className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium hover:bg-[var(--color-bg)]"
              >
                {copied === "dwk" ? m.discoveryCopied : m.discoveryCopy}
              </button>
            </div>
          </div>
        )}
      </div>

      {domain && (
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/api/v1/cards/${handle}/well-known`}
            className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)]"
          >
            {m.discoveryDownload}
          </a>
          <button
            type="button"
            onClick={runCheck}
            disabled={loading}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--color-bg)] disabled:opacity-50"
          >
            {loading ? m.discoveryChecking : m.discoveryCheckDomain}
          </button>
          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--color-bg)]"
          >
            {showGuide ? m.discoveryHideGuide : m.discoveryShowGuide}
          </button>
        </div>
      )}

      {!domain && (
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          {m.discoveryNoDomain}
        </p>
      )}

      {check && (
        <div className="mt-4 rounded-lg bg-[var(--color-bg)] p-3 text-sm">
          <p className={`font-medium ${statusClass(check.status)}`}>
            {statusLabel(check.status)}
          </p>
          {check.message && (
            <p className="mt-1 text-[var(--color-text-muted)]">{check.message}</p>
          )}
          {check.remote_updated_at && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {m.discoveryRemoteUpdated}: {check.remote_updated_at}
            </p>
          )}
        </div>
      )}

      {showGuide && check?.nginx_snippet && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-[var(--color-text-muted)]">
            {m.discoveryGuideIntro}
          </p>
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
              {m.discoveryCpanelPath}
            </p>
            <code className="block rounded-lg bg-[var(--color-bg)] p-2 text-xs">
              {check.cpanel_path}
            </code>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
              {m.discoveryNginxSnippet}
            </p>
            <pre className="overflow-x-auto rounded-lg bg-[var(--color-bg)] p-3 text-xs">
              {check.nginx_snippet}
            </pre>
            <button
              type="button"
              onClick={() => copyText("nginx", check.nginx_snippet ?? "")}
              className="mt-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-bg)]"
            >
              {copied === "nginx" ? m.discoveryCopied : m.discoveryCopy}
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {m.discoveryGuideNote}
          </p>
        </div>
      )}
    </section>
  );
}
