import Image from "next/image";

type Props = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
};

export function BrandLogo({ size = 32, showWordmark = false, className }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <Image
        src="/eil-card.png"
        alt="EIL Card"
        width={size}
        height={size}
        className="rounded-lg object-contain"
        unoptimized
        priority
      />
      {showWordmark && (
        <span className="text-sm font-semibold tracking-tight">
          EIL <span className="text-[var(--color-text-muted)]">Card</span>
        </span>
      )}
    </span>
  );
}
