import Link from "next/link";
import {
  ArrowRight,
  Languages,
  MessageSquare,
  Package,
  UserRound,
  Link2,
  BookOpen,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui";
import { HeroChat } from "@/components/site/hero-chat";
import { DemoButton } from "@/components/site/demo-modal";
import { Faq, generalFaq } from "@/components/site/faq";

const steps = [
  {
    Icon: Link2,
    t: "Connect",
    d: "Link your Facebook Page, Instagram and WhatsApp in a few clicks — no code required.",
  },
  {
    Icon: BookOpen,
    t: "Teach",
    d: "Add products, prices, delivery areas and policies so replies stay accurate to your shop.",
  },
  {
    Icon: ShoppingBag,
    t: "Sell",
    d: "MakAgent answers questions, collects orders, and hands off to your team when needed.",
  },
];

const features = [
  {
    Icon: Languages,
    t: "Bangla & Banglish ready",
    d: "Reply the way your customers write — Bangla, Banglish or English — without forcing a script.",
  },
  {
    Icon: Package,
    t: "Knows your catalog",
    d: "Prices, sizes and stock from your product list. Clear answers, fewer wrong promises.",
  },
  {
    Icon: MessageSquare,
    t: "Orders from chat",
    d: "Name, phone, address and size collected in one conversation — ready for packing.",
  },
  {
    Icon: UserRound,
    t: "Human when it matters",
    d: "Set rules for escalation. Your team takes over with the full thread intact.",
  },
];

const stories = [
  {
    q: "Price questions used to pile up while we packed orders. Now those replies go out even on our busiest nights.",
    n: "Nusrat Jahan",
    b: "Dhaka Threads · Fashion",
  },
  {
    q: "Customers ask in Banglish. An agent that understands that makes the whole shop feel more natural.",
    n: "Tanvir Ahmed",
    b: "Gadget Ghor · Electronics",
  },
];

export default function Landing() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#121212] pt-[76px] text-white">
        <div className="pointer-events-none absolute inset-0 home-mesh" />
        <div className="container-x relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-24">
          <div className="animate-fade-up max-w-xl">
            <p className="text-[13px] font-medium tracking-wide text-[#ff6533]">AI sales agent for Bangladesh commerce</p>
            <h1 className="mt-5 font-brand text-[clamp(2.4rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-[-0.04em]">
              Turn every message into a <span className="text-[#ff6533]">confirmed order.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/60">
              MakAgent replies on Facebook, Instagram and WhatsApp — in Bangla and Banglish — so your shop never misses a sale.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button href="/signup" variant="primary" size="lg">
                Start free trial <ArrowRight className="size-[18px]" />
              </Button>
              <DemoButton className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/25 hover:text-white" />
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/40">
              <span>14-day free trial</span>
              <span className="hidden sm:inline text-white/20">·</span>
              <span>No credit card</span>
              <span className="hidden sm:inline text-white/20">·</span>
              <span>Setup in minutes</span>
            </div>
          </div>

          <div className="animate-fade-in relative [animation-delay:120ms]">
            <div className="pointer-events-none absolute -inset-6 rounded-[28px] bg-[#ff6533]/10 blur-2xl" />
            <HeroChat />
          </div>
        </div>
      </section>

      {/* ── Channels ── */}
      <section className="border-y border-line bg-bg">
        <div className="container-x flex flex-col items-start justify-between gap-4 py-8 sm:flex-row sm:items-center">
          <p className="text-sm text-ink-3">Works where your customers already message you</p>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-semibold tracking-tight text-ink">
            {["Facebook Messenger", "Instagram DMs", "WhatsApp Business", "Page comments"].map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="scroll-mt-20 bg-bg py-24 lg:py-28">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">How it works</p>
            <h2 className="mt-4 font-brand text-3xl font-bold tracking-[-0.035em] md:text-4xl lg:text-[2.75rem]">
              Live in three steps
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-2 md:text-lg">
              Connect your channels, teach your catalog, and let MakAgent handle the routine conversations.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map(({ Icon, t, d }, i) => (
              <article
                key={t}
                className="rounded-2xl border border-line bg-surface p-8 transition-colors hover:border-brand-line"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="size-5" strokeWidth={2} />
                  </span>
                  <span className="font-brand text-sm font-bold text-ink-4">0{i + 1}</span>
                </div>
                <h3 className="mt-8 font-brand text-xl font-semibold tracking-tight">{t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="scroll-mt-20 border-t border-line bg-bg-deep/40 py-24 lg:py-28">
        <div className="container-x">
          <div className="max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">Capabilities</p>
            <h2 className="mt-4 font-brand text-3xl font-bold tracking-[-0.035em] md:text-4xl lg:text-[2.75rem]">
              Built for how local shops actually sell
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-2 md:text-lg">
              Not a generic chatbot — a sales agent trained on your products, your language, and your rules.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {features.map(({ Icon, t, d }) => (
              <article
                key={t}
                className="flex gap-5 rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-line-strong"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line-strong text-brand">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-brand text-lg font-semibold tracking-tight">{t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{d}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="border-t border-line bg-bg py-24 lg:py-28">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">Trusted direction</p>
            <h2 className="mt-4 font-brand text-3xl font-bold tracking-[-0.035em] md:text-4xl">
              Made for busy shop owners
            </h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {stories.map((s) => (
              <figure key={s.n} className="rounded-2xl border border-line bg-surface p-8 md:p-10">
                <blockquote className="text-lg leading-relaxed tracking-tight text-ink md:text-xl">“{s.q}”</blockquote>
                <figcaption className="mt-8 border-t border-line pt-6">
                  <div className="font-semibold">{s.n}</div>
                  <div className="mt-0.5 text-sm text-ink-3">{s.b}</div>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-ink-4">Illustrative demo personas — not verified endorsements.</p>
        </div>
      </section>

      {/* ── Pricing CTA ── */}
      <section className="border-t border-line bg-bg pb-8 pt-4">
        <div className="container-x">
          <div className="flex flex-col items-start justify-between gap-8 rounded-2xl border border-brand-line bg-brand-soft/60 px-8 py-10 md:flex-row md:items-center md:px-12 md:py-12">
            <div>
              <h2 className="font-brand text-2xl font-bold tracking-[-0.03em] md:text-3xl">
                Start free. Scale when you’re ready.
              </h2>
              <p className="mt-2 text-ink-2">14-day trial · Plans from ৳1,490/month · No credit card to begin</p>
            </div>
            <Button href="/pricing" variant="primary" size="lg" className="shrink-0">
              View pricing <ArrowRight className="size-[18px]" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="scroll-mt-20 bg-bg py-24 lg:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">FAQ</p>
            <h2 className="mt-4 font-brand text-3xl font-bold tracking-[-0.035em] md:text-4xl">
              Common questions
            </h2>
            <p className="mt-4 text-ink-2">
              Still deciding?{" "}
              <Link href="/signup" className="font-medium text-brand underline-offset-4 hover:underline">
                Start your free trial
              </Link>
              .
            </p>
          </div>
          <Faq items={generalFaq} />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden border-t border-white/8 bg-[#101010] py-24 text-white lg:py-28">
        <div className="pointer-events-none absolute inset-0 home-mesh opacity-80" />
        <div className="container-x relative text-center">
          <h2 className="mx-auto max-w-3xl font-brand text-3xl font-bold leading-[1.1] tracking-[-0.04em] md:text-5xl">
            Your next sale is already in the inbox.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-white/55">
            Give every customer a clear answer. Give your team time to grow the business.
          </p>
          <Button href="/signup" variant="primary" size="lg" className="mt-10 !h-13 !px-8">
            Get started with MakAgent <ArrowRight className="size-5" />
          </Button>
        </div>
      </section>
    </>
  );
}
