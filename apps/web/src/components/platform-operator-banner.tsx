"use client";

type Props = {
  message: string;
};

export function PlatformOperatorBanner({ message }: Props) {
  return (
    <div className="mb-6 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-4 py-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
      {message}
    </div>
  );
}
