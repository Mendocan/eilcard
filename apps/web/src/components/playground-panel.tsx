"use client";

import { useState } from "react";
import type { Messages } from "@/lib/i18n/messages";

type ResolvePayload = {
  card?: Record<string, unknown>;
  meta?: { source?: string; resolved_at?: string };
  error?: string;
};

type Props = {
  m: Messages["playground"];
  defaultDomain?: string;
  defaultHandle?: string;
};

export function PlaygroundPanel({
  m,
  defaultDomain = "sinyalle.com",
  defaultHandle = "sinyal24",
}: Props) {
  const [mode, setMode] = useState<"domain" | "handle">("domain");
  const [domain, setDomain] = useState(defaultDomain);
  const [handle, setHandle] = useState(defaultHandle);
  const [loading, setLoading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [result, setResult] = useState<ResolvePayload | null>(null);
  const [wellKnown, setWellKnown] = useState<{
    ok: boolean;
    status?: number;
    contentType?: string;
    preview?: string;
  } | null>(null);

  async function runResolve() {
    setLoading(true);
    setResult(null);
    setWellKnown(null);
    const started = performance.now();

    const query =
      mode === "domain"
        ? `domain=${encodeURIComponent(domain.trim())}`
        : `handle=${encodeURIComponent(handle.trim())}`;

    try {
      const res = await fetch(`/api/v1/resolve?${query}`);
      const data = (await res.json()) as ResolvePayload;
      setElapsedMs(Math.round(performance.now() - started));
      if (!res.ok) {
        setResult({ error: data.error ?? `HTTP ${res.status}` });
      } else {
        setResult(data);
      }

      if (mode === "domain" && domain.trim()) {
        const normalized = domain
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/\/.*$/, "");
        try {
          const wkRes = await fetch(
            `/api/v1/playground/well-known?domain=${encodeURIComponent(normalized)}`
          );
          const wkData = (await wkRes.json()) as {
            ok: boolean;
            status: number;
            content_type: string;
            preview?: string;
          };
          setWellKnown({
            ok: wkData.ok,
            status: wkData.status,
            contentType: wkData.content_type,
            preview: wkData.preview,
          });
        } catch {
          setWellKnown({ ok: false });
        }
      }
    } catch {
      setElapsedMs(Math.round(performance.now() - started));
      setResult({ error: m.resolveFailed });
    } finally {
      setLoading(false);
    }
  }

  const card = result?.card;
  const officialName =
    card && typeof card.name === "object" && card.name !== null
      ? (card.name as { official?: string; full?: string }).official ??
        (card.name as { full?: string }).full
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("domain")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            mode === "domain"
              ? "bg-[var(--color-primary)] text-white"
              : "border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
          }`}
        >
          {m.modeDomain}
        </button>
        <button
          type="button"
          onClick={() => setMode("handle")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            mode === "handle"
              ? "bg-[var(--color-primary)] text-white"
              : "border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
          }`}
        >
          {m.modeHandle}
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {mode === "domain" ? (
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder={m.domainPlaceholder}
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm font-mono"
          />
        ) : (
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={m.handlePlaceholder}
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm font-mono"
          />
        )}
        <button
          type="button"
          onClick={runResolve}
          disabled={loading}
          className="rounded-lg bg-[var(--color-text)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? m.resolving : m.resolveButton}
        </button>
      </div>

      {elapsedMs !== null && (
        <p className="text-sm text-[var(--color-text-muted)]">
          {m.elapsed}: <span className="font-mono">{elapsedMs} ms</span>
        </p>
      )}

      {result?.error && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
          {result.error}
        </div>
      )}

      {card && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
              {m.agentView}
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-[var(--color-text-muted)]">{m.fieldName}</dt>
                <dd className="font-medium">{officialName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-muted)]">{m.fieldVerified}</dt>
                <dd className="font-mono">
                  {String(card.verified ?? false)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-muted)]">{m.fieldHandle}</dt>
                <dd className="font-mono">{String(card.handle ?? "—")}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-muted)]">{m.fieldSource}</dt>
                <dd className="font-mono">{result.meta?.source ?? "registry"}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-muted)]">{m.fieldProducts}</dt>
                <dd>
                  {Array.isArray(card.products) ? card.products.length : 0}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {m.rawJson}
            </p>
            <pre className="mt-3 max-h-64 overflow-auto text-xs leading-relaxed">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {wellKnown && mode === "domain" && (
        <div className="rounded-xl border border-[var(--color-border)] p-4 text-sm">
          <p className="font-medium">{m.wellKnownTitle}</p>
          <p className="mt-1 font-mono text-xs text-[var(--color-text-muted)]">
            https://
            {domain
              .trim()
              .toLowerCase()
              .replace(/^https?:\/\//, "")
              .replace(/\/.*$/, "")}
            /.well-known/digital-card
          </p>
          <p
            className={`mt-2 text-sm ${wellKnown.ok ? "text-green-700 dark:text-green-300" : "text-[var(--color-text-muted)]"}`}
          >
            {wellKnown.ok ? m.wellKnownOk : m.wellKnownFail}
            {wellKnown.status ? ` (HTTP ${wellKnown.status})` : ""}
            {wellKnown.contentType ? ` · ${wellKnown.contentType}` : ""}
          </p>
          {wellKnown.preview && (
            <pre className="mt-2 overflow-x-auto text-xs text-[var(--color-text-muted)]">
              {wellKnown.preview}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
