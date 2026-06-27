"use client";

import { useState } from "react";
import type { Messages } from "@/lib/i18n/messages";
import type {
  ComplianceCheck,
  ComplianceGrade,
  ComplianceReport,
} from "@/lib/eil-compliance";

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

const CHECK_LABELS: Record<
  ComplianceCheck["id"],
  keyof Messages["playground"]
> = {
  registry_card: "complianceCheckRegistry",
  card_id_binding: "complianceCheckCardId",
  domain_verified: "complianceCheckVerified",
  well_known: "complianceCheckWellKnown",
  well_known_sync: "complianceCheckWellKnownSync",
  registry_plus_jws: "complianceCheckJws",
  access_policy: "complianceCheckAccessPolicy",
  capabilities: "complianceCheckCapabilities",
};

const LEVEL_LABELS: Record<
  ComplianceCheck["level"],
  keyof Messages["playground"]
> = {
  pass: "complianceLevelPass",
  warn: "complianceLevelWarn",
  fail: "complianceLevelFail",
  info: "complianceLevelInfo",
  skip: "complianceLevelSkip",
};

const GRADE_LABELS: Record<
  ComplianceGrade,
  keyof Messages["playground"]
> = {
  excellent: "complianceGradeExcellent",
  good: "complianceGradeGood",
  partial: "complianceGradePartial",
  none: "complianceGradeNone",
};

function levelColor(level: ComplianceCheck["level"]): string {
  switch (level) {
    case "pass":
      return "text-green-700 dark:text-green-300";
    case "warn":
      return "text-amber-700 dark:text-amber-300";
    case "fail":
      return "text-red-700 dark:text-red-300";
    case "info":
      return "text-[var(--color-accent)]";
    default:
      return "text-[var(--color-text-muted)]";
  }
}

function gradeBorder(grade: ComplianceGrade): string {
  switch (grade) {
    case "excellent":
      return "border-green-500/40 bg-green-50/40 dark:bg-green-950/20";
    case "good":
      return "border-[var(--color-accent)]/40 bg-[var(--color-surface)]/60";
    case "partial":
      return "border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20";
    default:
      return "border-[var(--color-border)] bg-[var(--color-surface)]/40";
  }
}

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
  const [compliance, setCompliance] = useState<ComplianceReport | null>(null);

  async function runResolve() {
    setLoading(true);
    setResult(null);
    setCompliance(null);
    const started = performance.now();

    const query =
      mode === "domain"
        ? `domain=${encodeURIComponent(domain.trim())}`
        : `handle=${encodeURIComponent(handle.trim())}`;

    try {
      const [res, compRes] = await Promise.all([
        fetch(`/api/v1/resolve?${query}`),
        fetch(`/api/v1/playground/compliance?${query}`),
      ]);

      const data = (await res.json()) as ResolvePayload;
      setElapsedMs(Math.round(performance.now() - started));

      if (!res.ok) {
        setResult({ error: data.error ?? `HTTP ${res.status}` });
      } else {
        setResult(data);
      }

      if (compRes.ok) {
        setCompliance((await compRes.json()) as ComplianceReport);
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

      {compliance && (
        <div
          className={`rounded-xl border p-5 ${gradeBorder(compliance.grade)}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                {m.complianceTitle}
              </p>
              <p className="mt-2 text-lg font-semibold">
                {m[GRADE_LABELS[compliance.grade]]}
              </p>
              {compliance.handle && (
                <p className="mt-1 font-mono text-xs text-[var(--color-text-muted)]">
                  @{compliance.handle}
                  {compliance.edition ? ` · ${compliance.edition}` : ""}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-muted)]">
                {m.complianceScore}
              </p>
              <p className="font-mono text-2xl font-semibold">
                {compliance.score.passed}/{compliance.score.total}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {compliance.score.percentage}%
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {compliance.checks.map((check) => (
              <li
                key={check.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-bg)]/50 px-3 py-2 text-sm"
              >
                <span>{m[CHECK_LABELS[check.id]]}</span>
                <span className={`font-medium ${levelColor(check.level)}`}>
                  {m[LEVEL_LABELS[check.level]]}
                  {check.detail ? (
                    <span className="ml-2 font-normal text-[var(--color-text-muted)]">
                      — {check.detail}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>

          {compliance.well_known && (
            <p className="mt-3 font-mono text-xs text-[var(--color-text-muted)]">
              {compliance.well_known.url}
            </p>
          )}
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
            <pre className="code-panel mt-3 max-h-64 overflow-auto rounded-lg p-4 text-xs leading-relaxed">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
