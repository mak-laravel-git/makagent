import Link from "next/link";
import clsx from "clsx";

export const MAKTECH_LOGO = "https://maktechgroup.com/Diagonal/maktech_logo.webp";

/** MakAgent mark: a stylised paper-plane / pointer glyph in MakTech orange. */
export function Glyph({ className = "size-11" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="12" fill="var(--brand)" />
      <path d="M11.2 28.1 29.4 11.9 23.8 30l-4.5-6.6L11.2 28.1Z" fill="#fff" />
      <path d="m19.3 23.4 10.1-11.5" stroke="var(--brand)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({
  href = "/",
  showMak = true,
  className = "",
  tone = "default",
}: {
  href?: string;
  showMak?: boolean;
  className?: string;
  tone?: "default" | "light";
}) {
  const light = tone === "light";
  return (
    <Link href={href} className={clsx("group inline-flex items-center gap-3.5", className)} aria-label="MakAgent by MakTech">
      <Glyph className="size-11 shrink-0 transition-transform duration-300 group-hover:scale-[1.04]" />
      <span className="flex flex-col leading-none">
        <span className={clsx("font-brand text-[22px] font-bold tracking-[-0.04em]", light ? "text-white" : "text-ink")}>
          MakAgent<span className="text-brand">.</span>
        </span>
        {showMak && (
          <span className={clsx("mt-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]", light ? "text-white/55" : "text-ink-3")}>
            by MakTech
          </span>
        )}
      </span>
    </Link>
  );
}

export function MakTechLogo({ className = "h-6" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={MAKTECH_LOGO} alt="MakTech" className={className} loading="lazy" />;
}
