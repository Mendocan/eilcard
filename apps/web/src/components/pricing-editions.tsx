import type { PricingCopy, PricingEditionId } from "@/lib/i18n/pricing";

const EDITION_ORDER: PricingEditionId[] = ["core", "business", "registry_plus"];

type Props = {
  copy: PricingCopy;
};

export function PricingEditions({ copy }: Props) {
  return (
    <section aria-labelledby="pricing-editions-heading">
      <h2
        id="pricing-editions-heading"
        className="text-lg font-semibold tracking-tight"
      >
        {copy.editionsTitle}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
        {copy.editionsIntro}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {EDITION_ORDER.map((id) => {
          const edition = copy.editions[id];
          const isRoadmap = id === "registry_plus";

          return (
            <article
              key={id}
              className={`flex flex-col rounded-2xl border p-5 ${
                id === "business"
                  ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold">{edition.name}</h3>
                {isRoadmap ? (
                  <span className="shrink-0 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                    {copy.editionRoadmap}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {edition.schema} · {edition.minPlan}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {edition.summary}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-[var(--color-text-muted)]">
                {edition.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-[var(--color-accent)]">·</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-[var(--color-text-muted)]">
                {edition.audience}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
