import Link from "next/link";

export const MAKTECH_LOGO = "https://maktechgroup.com/Diagonal/maktech_logo.webp";

/** SalesPilot mark: a stylised paper-plane / pointer glyph in MakTech orange. */
export function Glyph({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <path d="M9 22.5 23.5 9.5 19 24l-3.6-5.3L9 22.5Z" fill="#fff" />
      <path d="m15.4 18.7 8.1-9.2" stroke="var(--brand)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({ href = "/", showMak = true, className = "" }: { href?: string; showMak?: boolean; className?: string }) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-3 ${className}`} aria-label="SalesPilot AI by MakTech">
      <Glyph />
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-bold tracking-[-0.03em]">SalesPilot<span className="text-brand">.</span></span>
        {showMak && <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-3">by MakTech</span>}
      </span>
    </Link>
  );
}

export function MakTechLogo({ className = "h-6" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={MAKTECH_LOGO} alt="MakTech" className={className} loading="lazy" />;
}
