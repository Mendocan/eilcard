import Image from "next/image";

type Props = {
  size?: number;
  showWordmark?: boolean;
  /** "mark" shows only the card icon via background crop (nav) */
  variant?: "full" | "mark";
  className?: string;
};

export function BrandLogo({
  size = 32,
  showWordmark = false,
  variant = "full",
  className,
}: Props) {
  const logoImage =
    variant === "mark" ? (
      <span
        className={`inline-block shrink-0 overflow-hidden bg-no-repeat ${className ?? ""}`}
        style={{
          width: size,
          height: size,
          backgroundImage: "url(/eil-card.png)",
          backgroundSize: `${Math.round(size * 3.1)}px auto`,
          backgroundPosition: "center 2%",
        }}
        role="img"
        aria-label="EIL Card"
      />
    ) : (
      <Image
        src="/eil-card.png"
        alt="EIL Card"
        width={size}
        height={size}
        className={`rounded-lg object-contain ${className ?? ""}`}
        unoptimized
        priority
      />
    );

  if (!showWordmark) {
    return logoImage;
  }

  return (
    <span className="inline-flex items-center gap-2.5">
      {logoImage}
      <span className="text-sm font-semibold tracking-tight">
        EIL <span className="text-[var(--color-text-muted)]">Card</span>
      </span>
    </span>
  );
}
