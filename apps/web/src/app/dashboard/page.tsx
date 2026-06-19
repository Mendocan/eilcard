import { getSession } from "@/lib/session";
import { getCardsByUserId } from "@/lib/card-service";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { getUserPlan } from "@/lib/user-plan";
import { planDisplayLabel } from "@/lib/plan-labels";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const locale = await getLocale();
  const d = t(locale).dashboard;
  const [userCards, plan] = await Promise.all([
    getCardsByUserId(session.user.id),
    getUserPlan(session.user.id),
  ]);

  const atLimit = userCards.length >= plan.limits.maxCards;
  const countLabel = d.cardCount
    .replace("{current}", String(userCards.length))
    .replace("{max}", String(plan.limits.maxCards));

  const newCardClass =
    "rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)]";
  const disabledClass =
    "cursor-not-allowed rounded-lg bg-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)]";

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{d.title}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{d.subtitle}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {d.planLabel}: {planDisplayLabel(plan, d)} · {countLabel}
          </p>
        </div>
        {atLimit ? (
          <span className={disabledClass}>{d.newCard}</span>
        ) : (
          <Link href="/dashboard/new" className={newCardClass}>
            {d.newCard}
          </Link>
        )}
      </div>

      {atLimit && (
        <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-4 py-3 text-sm">
          <p className="font-medium">{d.atLimit}</p>
          <p className="mt-1 text-[var(--color-text-muted)]">{d.upgradeHint}</p>
        </div>
      )}

      {userCards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center">
          <p className="mb-2 text-lg font-medium">{d.noCards}</p>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">{d.noCardsHint}</p>
          <Link href="/dashboard/new" className={`inline-block ${newCardClass}`}>
            {d.createCard}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {userCards.map((card) => {
            const body = card.body as Record<string, unknown>;
            const name =
              card.type === "organization"
                ? (body.name as { official: string })?.official
                : (body.name as { full: string })?.full;

            return (
              <Link
                key={card.id}
                href={`/dashboard/${card.handle}`}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-primary)]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {card.type === "organization" ? d.organization : d.person}
                  </span>
                  {card.verified && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      {d.verified}
                    </span>
                  )}
                </div>
                <p className="text-lg font-semibold">{name ?? card.handle}</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  @{card.handle}
                  {card.domain ? ` · ${card.domain}` : ""}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
