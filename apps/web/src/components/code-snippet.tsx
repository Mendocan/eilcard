"use client";

import { useCallback, useState } from "react";

type Props = {
  code: string;
  copyLabel: string;
  copiedLabel: string;
  className?: string;
};

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function CodeSnippet({ code, copyLabel, copiedLabel, className }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [code]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? copiedLabel : copyLabel}
        title={copied ? copiedLabel : copyLabel}
        className="absolute right-3 top-3 rounded-md border border-[var(--color-code-border)] bg-[var(--color-bg)]/75 p-2 text-[var(--color-text-muted)] backdrop-blur-sm transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
      >
        {copied ? (
          <CheckIcon className="h-4 w-4 text-[var(--color-success)]" />
        ) : (
          <CopyIcon className="h-4 w-4" />
        )}
      </button>
      <pre className="code-panel w-full overflow-x-auto rounded-2xl p-5 pt-12 text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
