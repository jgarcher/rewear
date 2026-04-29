import Image from "next/image";

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
};

export function Logo({ size = 40, showWordmark = false, className = "" }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src="/rewear-logo.png"
        alt="ReWear"
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
    </div>
  );
}
