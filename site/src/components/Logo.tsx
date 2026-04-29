import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
};

export function Logo({ size = 40, showWordmark = true, className = "" }: LogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 group ${className}`}
      aria-label="ReWear — home"
    >
      <Image
        src="/rewear-logo.png"
        alt="ReWear logo — embroidered recycle symbol"
        width={size}
        height={size}
        className="rounded-md"
        priority
      />
      {showWordmark && (
        <span className="font-heading text-xl font-medium tracking-tight text-charcoal">
          ReWear
        </span>
      )}
    </Link>
  );
}
