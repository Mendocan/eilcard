import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import { getAdminCardDetail } from "@/lib/admin-queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { AdminCardDetailActions } from "../../admin-card-detail-actions";
import { cardTypeLabel, verificationStatusLabel } from "@/lib/admin-labels";
import { buildTxtRecord } from "@/lib/dns-verify";

type Props = {
  params: Promise<{ handle: string }>;
};

export default async function AdminCardDetailPage({ params }: Props) {
  await requireAdminPage("/admin/cards");
  const { handle } = await params;
  const locale = await getLocale();
  const a = t(locale).admin;
  const card = await getAdminCardDetail(handle);

  if (!card) notFound();

  const pendingDns = card.verifications.find((v) => v.status === "pending");

  return (
    <main className="p-4 sm:p-8">
      <Link
        href="/admin/cards"
        className="text-sm text-[var(--color-accent)] hover:underline"
      >
        {a.backToCards}
      </Link>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-mono text-2xl font-semibold">{card.handle}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {card.domain ?? "—"} · {cardTypeLabel(card.type, a)}
          </p>
        </div>
        <AdminCardDetailActions
          handle={card.handle}
          verified={card.verified}
          hasPendingDns={Boolean(pendingDns)}
          m={a}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--color-border)] p-5">
          <h3 className="mb-4 font-medium">{a.cardMeta}</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-text-muted)]">{a.status}</dt>
              <dd>
                {card.verified ? (
                  <span className="text-[var(--color-success)]">{a.verifiedBadge}</span>
                ) : (
                  <span>{a.pendingBadge}</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-text-muted)]">{a.owner}</dt>
              <dd>{card.userEmail}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-text-muted)]">{a.name}</dt>
              <dd>{card.userName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-text-muted)]">{a.emailVerified}</dt>
              <dd>{card.userEmailVerified ? a.yes : a.no}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-text-muted)]">{a.created}</dt>
              <dd>{card.createdAt.toISOString().slice(0, 10)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-text-muted)]">{a.resolveTotal}</dt>
              <dd>{card.resolveTotal}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-text-muted)]">{a.cardIdLabel}</dt>
              <dd className="font-mono text-xs">{card.cardId}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] p-5">
          <h3 className="mb-4 font-medium">{a.verificationHistory}</h3>
          {card.verifications.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">—</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {card.verifications.map((v) => (
                <li
                  key={v.id}
                  className="rounded-lg border border-[var(--color-border)] p-3"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-medium uppercase">{v.method}</span>
                    <span
                      className={
                        v.status === "verified"
                          ? "text-[var(--color-success)]"
                          : v.status === "failed"
                            ? "text-[var(--color-error)]"
                            : "text-[var(--color-text-muted)]"
                      }
                    >
                      {verificationStatusLabel(v.status, a)}
                    </span>
                  </div>
                  <p className="mt-1 text-[var(--color-text-muted)]">{v.domain}</p>
                  {v.status === "pending" && v.method === "dns" && (
                    <p className="mt-2 break-all font-mono text-xs">
                      {buildTxtRecord(v.token)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {v.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-[var(--color-border)] p-5">
        <h3 className="mb-4 font-medium">{a.publicJson}</h3>
        <pre className="code-panel max-h-[480px] overflow-auto rounded-lg p-4 text-xs leading-relaxed">
          {JSON.stringify(card.publicJson, null, 2)}
        </pre>
      </section>
    </main>
  );
}
