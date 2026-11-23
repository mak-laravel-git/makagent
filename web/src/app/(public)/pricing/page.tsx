"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { Faq, generalFaq } from "@/components/site/faq";
import { useStore, money } from "@/lib/store";
import type { Plan } from "@/lib/data";

const desc = ["A friendly first step.", "Find your selling rhythm.", "For growing teams and busier inboxes.", "For ambitious, high-volume businesses."];

const pricingFaq: [string, string][] = [
  ["What happens after the free trial?", "Choose a paid plan when you’re ready. In this preview no payment details are required and no actual charges occur."],
  ["What counts as an AI conversation?", "One customer thread handled within a 24-hour session. Final production metering would be disclosed in the subscription agreement."],
  ["Can I change plans later?", "Yes. Upgrades and downgrades come with a clear proration preview before anything changes."],
  ["Are WhatsApp provider charges included?", "These prices cover the SaaS subscription. Applicable provider charges may be separate and are disclosed before activation."],
  ...generalFaq.slice(1, 3),
];

export default function PricingPage() {
  const plans = useStore<Plan[]>("plans", []);
  const [yearly, setYearly] = useState(false);

  const rows: [string, (p: Plan) => React.ReactNode][] = [
    ["AI conversations / month", (p) => p.conversations.toLocaleString()],
    ["Connected channels", (p) => p.channels],
    ["Team members", (p) => p.seats],
    ["Post scheduler", (p) => (p.scheduler ? <Check className="mx-auto size-4 text-brand" /> : <Minus className="mx-auto size-4 text-ink-4" />)],
    ["Analytics", (p) => p.analytics],
    ["Bangla, Banglish & English", () => <Check className="mx-auto size-4 text-brand" />],
    ["Human handover", () => <Check className="mx-auto size-4 text-brand" />],
  ];

  return (
    <>
      <section className="relative overflow-hidden pt-[76px]">
        <div className="grid-bg absolute inset-0" />
        <div className="container-x relative py-24 text-center lg:py-32">
          <div className="eyebrow mb-6 justify-center">Straightforward plans. Serious possibilities.</div>
          <h1 className="mx-auto max-w-4xl text-[clamp(2.75rem,6vw,5.25rem)] font-bold leading-[0.98] tracking-[-0.045em]">A plan for your <span className="text-brand">next chapter.</span></h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-2 md:text-xl">From your first automated reply to thousands of happy conversations. Choose what fits today. Grow when you’re ready.</p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <div role="group" aria-label="Billing interval" className="inline-flex rounded-full border border-line-strong bg-surface p-1">
              {[["Monthly", false], ["Yearly", true]].map(([l, v]) => (
                <button key={String(l)} aria-pressed={yearly === v} onClick={() => setYearly(v as boolean)} className={clsx("rounded-full px-6 py-2 text-sm font-medium transition-colors", yearly === v ? "bg-brand text-white" : "text-ink-2 hover:text-ink")}>{l}</button>
              ))}
            </div>
            <Badge tone="success">Save up to 17%</Badge>
          </div>
        </div>
      </section>

      <section className="container-x pb-24">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p, i) => {
            const featured = p.id === "growth";
            return (
              <article key={p.id} className={clsx("relative flex flex-col rounded-2xl border p-8", featured ? "border-brand bg-surface shadow-[0_30px_70px_-30px_var(--brand)]" : "border-line bg-surface")}>
                {featured && <span className="absolute -top-3 left-8 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">Most popular</span>}
                <h2 className="text-xl font-semibold tracking-tight">{p.name}</h2>
                <p className="mt-1.5 min-h-10 text-sm text-ink-3">{desc[i] ?? "A flexible plan for your next chapter."}</p>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="num text-[44px] font-bold leading-none tracking-[-0.04em]">{money(yearly ? Math.round(p.yearly / 12) : p.monthly)}</span>
                  <span className="text-sm text-ink-3">/ month</span>
                </div>
                <p className="mt-2 text-[13px] text-ink-3">{!p.monthly ? "For 14 days. No credit card." : yearly ? `${money(p.yearly)} billed yearly` : "Billed monthly. Cancel anytime."}</p>
                <Button href={`/signup?plan=${p.id}`} variant={featured ? "primary" : "outline"} pill size="lg" className="mt-7">
                  {p.id === "trial" ? "Start free trial" : `Choose ${p.name}`} <ArrowRight className="size-4" />
                </Button>
                <ul className="mt-8 space-y-3.5 border-t border-line pt-8 text-sm text-ink-2">
                  {[`${p.conversations.toLocaleString()} AI conversations / month`, `${p.channels} connected channel${p.channels > 1 ? "s" : ""}`, `${p.seats} team member${p.seats > 1 ? "s" : ""}`, p.scheduler ? "Post scheduling included" : "Core inbox & product catalog", `${p.analytics} analytics`].map((t) => (
                    <li key={t} className="flex items-start gap-3"><Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2.5} />{t}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
        <p className="mt-6 text-center text-[13px] text-ink-3">All prices in BDT (৳). Demo prices only — no payment is collected.</p>

        <div className="mt-20 overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="p-8">
            <h2 className="text-2xl font-bold tracking-tight">The details, side by side.</h2>
            <p className="mt-1 text-ink-3">Every plan includes multilingual replies and human handover.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-y border-line bg-bg-deep/40">
                  <th scope="col" className="px-8 py-4 text-xs font-medium uppercase tracking-wider text-ink-3">What’s included</th>
                  {plans.map((p) => <th key={p.id} scope="col" className="px-4 py-4 text-center font-semibold">{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, fn]) => (
                  <tr key={label} className="border-b border-line last:border-0">
                    <td className="px-8 py-4 text-ink-2">{label}</td>
                    {plans.map((p) => <td key={p.id} className="num px-4 py-4 text-center">{fn(p)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="surface-light py-24 lg:py-32">
        <div className="container-x grid gap-14 lg:grid-cols-[0.8fr_1.4fr]">
          <div>
            <div className="eyebrow mb-5">Before you choose</div>
            <h2 className="text-4xl font-bold leading-[1.05] tracking-[-0.035em] md:text-5xl">Room to grow, without the guesswork.</h2>
          </div>
          <Faq items={pricingFaq} />
        </div>
      </section>
    </>
  );
}
