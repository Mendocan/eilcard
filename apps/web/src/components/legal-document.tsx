import type { LegalDocument } from "@/lib/i18n/legal";

type Props = {
  doc: LegalDocument;
};

export function LegalDocumentBody({ doc }: Props) {
  return (
    <article>
      <p className="text-sm text-[var(--color-text-muted)]">{doc.updated}</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        {doc.title}
      </h1>
      <div className="mt-10 space-y-10">
        {doc.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
