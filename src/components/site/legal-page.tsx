"use client";

import Link from "next/link";
import { FileText, ShieldCheck, Trash2 } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui";
import { LEGAL, LEGAL_META } from "@/lib/legal";
import { store } from "@/lib/store";
import { useUI } from "@/components/providers";

const pages = [
  { id: "privacy", title: "Privacy Policy", Icon: ShieldCheck },
  { id: "terms", title: "Terms of Service", Icon: FileText },
  { id: "data-deletion", title: "Data Deletion Instructions", Icon: Trash2 },
];

export function LegalPage({ id }: { id: "privacy" | "terms" | "data-deletion" }) {
  const { confirm, toast } = useUI();
  const doc = LEGAL[id];
  const reset = async () => {
    if (await confirm({ title: "Reset local demo?", message: "All local edits and setup progress will be replaced by fictional seeds.", danger: true, confirmLabel: "Reset" })) {
      store.reset();
      toast("Local demo data restored.", "success");
    }
  };

  return (
    <div className="pt-[76px]">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-[260px_1fr] lg:py-24">
        <aside aria-label="Policies" className="lg:sticky lg:top-28 lg:self-start">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col">
            {pages.map(({ id: pid, title, Icon }) => (
              <Link key={pid} href={`/${pid}`} aria-current={pid === id ? "page" : undefined} className={clsx("flex items-center gap-3 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-medium transition-colors", pid === id ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-line hover:text-ink")}>
                <Icon className="size-4" /> {title}
              </Link>
            ))}
          </nav>
          <div className="mt-6 hidden space-y-1 text-xs text-ink-3 lg:block">
            <p>Production: makagent.maktechgroup.com</p>
            <p>
              Support:{" "}
              <a className="text-brand hover:underline" href={`mailto:${LEGAL_META.supportEmail}`}>
                {LEGAL_META.supportEmail}
              </a>
            </p>
          </div>
        </aside>
        <article className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-[-0.035em] md:text-5xl">{pages.find((p) => p.id === id)?.title}</h1>
          <div className="mt-3 text-sm text-ink-3">
            Version {LEGAL_META.version} · Updated {LEGAL_META.effectiveDate} · MakTech Group · SalesPilot AI
          </div>
          <div className="legal-prose mt-10" dangerouslySetInnerHTML={{ __html: `<p>${doc.intro}</p>` }} />
          {doc.sections.map(([title, html]) => (
            <section key={title} className="legal-prose mt-12">
              <h2>{title}</h2>
              {html.includes("<!--RESET-->") ? (
                <>
                  <div dangerouslySetInnerHTML={{ __html: html.replace("<!--RESET-->", "") }} />
                  <Button variant="danger" onClick={reset}>
                    Reset local demo data
                  </Button>
                </>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: html }} />
              )}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
