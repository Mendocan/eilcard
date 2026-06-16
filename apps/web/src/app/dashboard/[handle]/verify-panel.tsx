"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  handle: string;
  domain: string | null;
  verified: boolean;
}

export function VerifyPanel({ handle, domain, verified }: Props) {
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
      setStatus("TXT kaydını domain DNS ayarlarınıza ekleyin, sonra kontrol edin.");
    } else {
      setStatus(data.error ?? "Başlatılamadı.");
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
      setStatus("Doğrulandı!");
      router.refresh();
    } else {
      setStatus(data.message ?? "TXT kaydı henüz bulunamadı. DNS yayılması birkaç dakika sürebilir.");
    }
  }

  if (!domain) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Doğrulama için karta bir domain ekleyin.
      </p>
    );
  }

  if (verified) {
    return (
      <p className="text-sm text-[var(--color-success)]">
        {domain} doğrulanmış.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-text-muted)]">
        Domain: <strong>{domain}</strong>
      </p>

      {txtRecord && (
        <div className="rounded-lg bg-[var(--color-bg)] p-3">
          <p className="mb-1 text-xs text-[var(--color-text-muted)]">
            TXT kaydı:
          </p>
          <code className="block break-all text-xs">{txtRecord}</code>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={startVerification}
          disabled={loading}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--color-bg)] disabled:opacity-50"
        >
          TXT Kaydı Oluştur
        </button>
        {txtRecord && (
          <button
            onClick={checkVerification}
            disabled={loading}
            className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
          >
            Kontrol Et
          </button>
        )}
      </div>

      {status && (
        <p className="text-sm text-[var(--color-text-muted)]">{status}</p>
      )}
    </div>
  );
}
