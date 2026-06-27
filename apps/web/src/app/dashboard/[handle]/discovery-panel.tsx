"use client";

import { useState } from "react";
import type { Messages } from "@/lib/i18n/messages";
import {
  buildWellKnownSetup,
  domainAgentCardUrl,
  domainWellKnownUrl,
  registryAgentCardUrl,
  registryWellKnownUrl,
} from "@/lib/well-known";
import { buildLlmsTxtPatch } from "@/lib/llms-patch";

type CheckResult = {
  status: string;
  url: string;
  content_type?: string;
  remote_updated_at?: string;
  registry_updated_at: string;
  message?: string;
  nginx_proxy_snippet?: string;
  nginx_agent_card_proxy_snippet?: string;
  nginx_static_snippet?: string;
  cpanel_path?: string;
  agent_card_cpanel_path?: string;
};

type Props = {
  handle: string;
  domain: string | null;
  entityName: string;
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

export function DiscoveryPanel({ handle, domain, entityName, appUrl, m }: Props) {
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState("");

  const base = appUrl.replace(/\/$/, "");
  const setup = domain ? buildWellKnownSetup(base, domain, handle) : null;
  const resolveUrl = domain
    ? `${base}/api/v1/resolve?domain=${encodeURIComponent(domain)}`
    : null;
  const registryWellKnownUrlValue = domain
    ? registryWellKnownUrl(base, domain)
    : null;
  const domainWellKnown = domain ? domainWellKnownUrl(domain) : null;
  const domainAgentCard = domain ? domainAgentCardUrl(domain) : null;
  const registryAgentCard = registryAgentCardUrl(base, handle);
  const llmsUrl = `${base}/api/v1/cards/${handle}/llms.txt`;
  const schemaUrl = `${base}/api/v1/cards/${handle}/schema.json`;

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

  const proxySnippet =
    check?.nginx_proxy_snippet ?? setup?.nginx_proxy_snippet ?? "";
  const agentCardProxySnippet =
    check?.nginx_agent_card_proxy_snippet ??
    setup?.nginx_agent_card_proxy_snippet ??
    "";
  const staticSnippet =
    check?.nginx_static_snippet ?? setup?.nginx_static_snippet ?? "";
  const llmsPatch =
    domain && entityName
      ? buildLlmsTxtPatch(base, domain, handle, entityName)
      : null;

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

        {registryWellKnownUrlValue && (
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
              {m.discoveryRegistryWellKnown}
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={registryWellKnownUrlValue}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => copyText("rwk", registryWellKnownUrlValue)}
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

        {domainAgentCard && (
          <div>
            <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
              {m.discoveryDomainAgentCard}
            </p>
            <div className="flex gap-2">
              <input readOnly value={domainAgentCard} className={inputClass} />
              <button
                type="button"
                onClick={() => copyText("dac", domainAgentCard)}
                className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium hover:bg-[var(--color-bg)]"
              >
                {copied === "dac" ? m.discoveryCopied : m.discoveryCopy}
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
            {m.discoveryRegistryAgentCard}
          </p>
          <div className="flex gap-2">
            <input readOnly value={registryAgentCard} className={inputClass} />
            <button
              type="button"
              onClick={() => copyText("rac", registryAgentCard)}
              className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium hover:bg-[var(--color-bg)]"
            >
              {copied === "rac" ? m.discoveryCopied : m.discoveryCopy}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`/api/v1/cards/${handle}/well-known`}
          className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)]"
        >
          {m.discoveryDownload}
        </a>
        <a
          href={`/api/v1/cards/${handle}/agent-card.json`}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--color-bg)]"
        >
          {m.discoveryDownloadAgentCard}
        </a>
        {domain && (
          <>
            <a
              href={`/api/v1/cards/${handle}/llms.txt`}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--color-bg)]"
            >
              {m.discoveryDownloadLlms}
            </a>
            <a
              href={`/api/v1/cards/${handle}/schema.json`}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--color-bg)]"
            >
              {m.discoveryDownloadSchema}
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
          </>
        )}
      </div>

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

      {showGuide && domain && (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-bg)] p-4">
            <p className="mb-1 text-sm font-medium">{m.discoveryProxyTitle}</p>
            <p className="mb-3 text-sm text-[var(--color-text-muted)]">
              {m.discoveryProxyIntro}
            </p>
            <pre className="code-panel overflow-x-auto rounded-lg p-3 text-xs">
              {proxySnippet}
            </pre>
            <button
              type="button"
              onClick={() => copyText("proxy", proxySnippet)}
              className="mt-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-surface)]"
            >
              {copied === "proxy" ? m.discoveryCopied : m.discoveryCopy}
            </button>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              {m.discoveryGuideNoteProxy}
            </p>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            <p className="mb-1 text-sm font-medium">
              {m.discoveryAgentCardProxyTitle}
            </p>
            <p className="mb-3 text-sm text-[var(--color-text-muted)]">
              {m.discoveryAgentCardProxyIntro}
            </p>
            <pre className="code-panel overflow-x-auto rounded-lg p-3 text-xs">
              {agentCardProxySnippet}
            </pre>
            <button
              type="button"
              onClick={() => copyText("acproxy", agentCardProxySnippet)}
              className="mt-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-surface)]"
            >
              {copied === "acproxy" ? m.discoveryCopied : m.discoveryCopy}
            </button>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">{m.discoveryStaticTitle}</p>
            <p className="mb-2 text-sm text-[var(--color-text-muted)]">
              {m.discoveryGuideIntro}
            </p>
            <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
              {m.discoveryCpanelPath}
            </p>
            <code className="mb-3 block rounded-lg bg-[var(--color-bg)] p-2 text-xs">
              {setup?.cpanel_path}
            </code>
            <pre className="code-panel overflow-x-auto rounded-lg p-3 text-xs">
              {staticSnippet}
            </pre>
            <button
              type="button"
              onClick={() => copyText("static", staticSnippet)}
              className="mt-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-bg)]"
            >
              {copied === "static" ? m.discoveryCopied : m.discoveryCopy}
            </button>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              {m.discoveryGuideNoteStatic}
            </p>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">{m.discoverySiteExports}</p>
            <p className="mb-2 text-sm text-[var(--color-text-muted)]">
              {m.discoverySiteExportsHint}
            </p>
            <ul className="space-y-1 text-xs font-mono text-[var(--color-text-muted)]">
              <li>{registryAgentCard}</li>
              <li>{llmsUrl}</li>
              <li>{schemaUrl}</li>
            </ul>
          </div>

          {llmsPatch && (
            <div className="rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-bg)] p-4">
              <p className="mb-1 text-sm font-medium">
                {m.discoveryLlmsPatchTitle}
              </p>
              <p className="mb-2 text-sm text-[var(--color-text-muted)]">
                {m.discoveryLlmsPatchIntro}
              </p>
              <p className="mb-2 text-xs text-[var(--color-text-muted)]">
                {m.discoveryLlmsPatchPath.replace("{domain}", domain!)}
              </p>
              <pre className="code-panel overflow-x-auto rounded-lg p-3 text-xs whitespace-pre-wrap">
                {llmsPatch}
              </pre>
              <button
                type="button"
                onClick={() => copyText("llmspatch", llmsPatch)}
                className="mt-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-surface)]"
              >
                {copied === "llmspatch" ? m.discoveryCopied : m.discoveryCopy}
              </button>
            </div>
          )}

          <p className="text-xs text-[var(--color-text-muted)]">
            {m.discoveryAgentCardNote}
          </p>

          <p className="text-xs text-[var(--color-text-muted)]">
            {m.discoveryGuideNote}
          </p>
        </div>
      )}
    </section>
  );
}
