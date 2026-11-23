import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand, MakTechLogo } from "./brand";
import { ChannelChip } from "@/components/ui";

const cols = [
  { title: "Product", links: [["Features", "/#features"], ["How it works", "/#how-it-works"], ["Pricing", "/pricing"], ["FAQ", "/#faq"]] },
  { title: "Get started", links: [["Create an account", "/signup"], ["Log in", "/login"], ["Account recovery", "/forgot-password"]] },
  { title: "Trust & privacy", links: [["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Data deletion", "/data-deletion"]] },
];

export function SiteFooter() {
  return (
    <footer className="surface-deep border-t border-line">
      <div className="container-x py-20">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Brand showMak={false} />
            <p className="mt-6 text-[15px] leading-relaxed text-ink-2">
              Your best salesperson, in every inbox. An AI sales agent for Facebook, Instagram and WhatsApp — made for the way Bangladesh does business.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Facebook", "Instagram", "WhatsApp"].map((c) => <ChannelChip key={c} type={c} />)}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">{c.title}</h4>
              <ul className="space-y-3">
                {c.links.map(([l, h]) => (
                  <li key={l}><Link href={h} className="text-[15px] text-ink-2 transition-colors hover:text-brand">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-line bg-surface p-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink-3">A product of</span>
            <MakTechLogo className="h-6" />
          </div>
          <a href="https://maktechgroup.com" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-brand">
            Visit maktechgroup.com <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8 text-[13px] text-ink-3">
          <span>© 2026 MakTech Group. All rights reserved.</span>
          <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-success" /> Interactive preview · no real messages are sent</span>
        </div>
      </div>
    </footer>
  );
}
