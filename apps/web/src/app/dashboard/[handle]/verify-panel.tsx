"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages";

type Props = {
  handle: string;
  domain: string | null;
  verified: boolean;
  m: Messages["dashboard"];
};

export function VerifyPanel({ handle, domain, verified, m }: Props) {
  const router = useRouter();
  const [txtRecord, setTxtRecord] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function startVerification() {
    setLoading(true);
    setStatus("");
    const res = await fetch(`/api/v1/cards/${handle}/verify/dns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setLoading(false);
    if (data.txt_record) {
      setTxtRecord(data.txt_record);
      setStatus(m.verifyStartHint);
    } else {
      setStatus(data.error ?? m.verifyFailed);
    }
  }

  async function checkVerification() {
    setLoading(true);
    setStatus("");
    const res = await fetch(`/api/v1/cards/${handle}/verify/dns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check" }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.status === "verified") {
      setStatus(m.verifySuccess);
      router.refresh();
    } else {
      setStatus(data.message ?? m.verifyPending);
    }
  }

  if (!domain) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">{m.verifyNoDomain}</p>
    );
  }

  if (verified) {
    return (
      <p className="text-sm text-[var(--color-success)]">
        {m.verifyDone.replace("{domain}", domain)}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-text-muted)]">
        {m.verifyDomain}: <strong>{domain}</strong>
      </p>

      {txtRecord && (
        <div className="rounded-lg bg-[var(--color-bg)] p-3">
          <p className="mb-1 text-xs text-[var(--color-text-muted)]">
            {m.verifyTxtLabel}
          </p>
          <code className="block break-all text-xs">{txtRecord}</code>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={startVerification}
          disabled={loading}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--color-bg)] disabled:opacity-50"
        >
          {m.verifyStart}
        </button>
        {txtRecord && (
          <button
            type="button"
            onClick={checkVerification}
            disabled={loading}
            className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
          >
            {m.verifyCheck}
          </button>
        )}
      </div>

      {status && (
        <p className="text-sm text-[var(--color-text-muted)]">{status}</p>
      )}
    </div>
  );
}
