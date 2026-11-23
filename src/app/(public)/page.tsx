import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { HeroChat } from "@/components/site/hero-chat";
import { DemoButton } from "@/components/site/demo-modal";
import { Faq, generalFaq } from "@/components/site/faq";

const steps = [
  { n: "01", t: "Connect the channels you already run", d: "Facebook Page, Instagram and WhatsApp — the places your customers already write." },
  { n: "02", t: "Teach it your shop", d: "Prices, sizes, delivery areas, return rules. In your words, not a generic script." },
  { n: "03", t: "Let it sell — and call you when needed", d: "It answers the routine. A person steps in when the conversation needs a human." },
];

const features = [
  { t: "Bangla, Banglish, English", d: "Customers write the way they talk. MakAgent meets them there." },
  { t: "Catalog-aware replies", d: "Answers come from your products and stock — not from guesswork." },
  { t: "Orders collected in chat", d: "Name, phone, address, size. One conversation, one order." },
  { t: "Human handover", d: "You set the rules for when the agent steps aside." },
];

const stories = [
  { q: "We used to miss price questions while packing. Now those replies go out even on our busiest evenings.", n: "Nusrat · Dhaka Threads" },
  { q: "Our buyers ask in Banglish. An agent that gets that makes the whole shop feel more natural.", n: "Tanvir · Gadget Ghor" },
];

export default function Landing() {
  return (
    <>
      {/* Hero — one composition: brand, line, CTA, conversation */}
      <section className="relative min-h-[100svh] overflow-hidden bg-[#141414] pt-[76px] text-white">
        <div className="home-grain pointer-events-none absolute inset-0 opacity-[0.35]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[#ff6533]" />
        <div className="relative grid min-h-[calc(100svh-76px)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center px-[clamp(1.25rem,4vw,3.5rem)] py-16 lg:py-20">
            <p className="animate-fade-up font-brand text-[clamp(2.75rem,7vw,5.5rem)] font-extrabold leading-[0.92] tracking-[-0.05em]">
              MakAgent<span className="text-[#ff6533]">.</span>
            </p>
            <h1 className="animate-fade-up mt-8 max-w-[16ch] font-brand text-[clamp(1.85rem,3.6vw,3.15rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-white/92 [animation-delay:80ms]">
              The inbox that closes the sale.
            </h1>
            <p className="animate-fade-up mt-6 max-w-md text-[17px] leading-relaxed text-white/55 [animation-delay:140ms]">
              For shops that sell on Messenger, Instagram and WhatsApp — in Bangla and Banglish.
            </p>
            <div className="animate-fade-up mt-10 flex flex-wrap items-center gap-3 [animation-delay:200ms]">
              <Button href="/signup" variant="primary" size="lg" className="!rounded-md">
                Start free <ArrowRight className="size-[18px]" />
              </Button>
              <DemoButton className="!rounded-md border-white/20 bg-transparent text-white hover:bg-white/5" />
            </div>
            <p className="animate-fade-up mt-8 text-[13px] text-white/35 [animation-delay:260ms]">
              14-day trial · No card · Built by MakTech in Bangladesh
            </p>
          </div>

          <div className="animate-fade-in relative border-t border-white/10 lg:border-t-0 [animation-delay:180ms]">
            <HeroChat />
          </div>
        </div>
      </section>

      {/* Quiet channel line */}
      <section className="border-b border-line bg-bg">
        <div className="container-x flex flex-col gap-3 py-10 md:flex-row md:items-baseline md:justify-between">
          <p className="max-w-sm text-sm text-ink-3">One agent across the channels you already use.</p>
          <p className="font-brand text-lg font-semibold tracking-tight text-ink md:text-xl">
            Messenger · Instagram · WhatsApp · Comments
          </p>
        </div>
      </section>

      {/* How it works — editorial list, not cards */}
      <section id="how-it-works" className="scroll-mt-20 border-b border-line bg-bg py-24 lg:py-32">
        <div className="container-x grid gap-16 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#ff6533]">How it works</p>
            <h2 className="mt-5 font-brand text-4xl font-bold tracking-[-0.04em] md:text-5xl">
              Three moves.
              <br />
              <span className="text-ink-3">Then it works for you.</span>
            </h2>
          </div>
          <ol className="divide-y divide-line border-y border-line">
            {steps.map((s) => (
              <li key={s.n} className="grid gap-4 py-10 sm:grid-cols-[4.5rem_1fr] sm:gap-8">
                <span className="font-brand text-3xl font-bold tracking-tight text-[#ff6533]">{s.n}</span>
                <div>
                  <h3 className="font-brand text-2xl font-semibold tracking-[-0.03em]">{s.t}</h3>
                  <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-ink-2">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features — stacked, not icon grid */}
      <section id="features" className="scroll-mt-20 bg-[#1a1a1a] py-24 text-white lg:py-32">
        <div className="container-x">
          <div className="max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#ff6533]">What it actually does</p>
            <h2 className="mt-5 font-brand text-4xl font-bold tracking-[-0.04em] md:text-5xl">
              Built for how Bangladesh shops talk.
            </h2>
          </div>
          <div className="mt-16 grid gap-x-16 gap-y-12 md:grid-cols-2">
            {features.map((f, i) => (
              <article key={f.t} className="border-t border-white/12 pt-8">
                <span className="text-[12px] font-semibold text-white/30">0{i + 1}</span>
                <h3 className="mt-3 font-brand text-2xl font-semibold tracking-[-0.03em]">{f.t}</h3>
                <p className="mt-3 max-w-md text-[16px] leading-relaxed text-white/55">{f.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Stories — pull quotes, not star cards */}
      <section className="border-b border-line bg-bg py-24 lg:py-32">
        <div className="container-x">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#ff6533]">From the shop floor</p>
          <div className="mt-12 grid gap-16 lg:grid-cols-2">
            {stories.map((s) => (
              <figure key={s.n}>
                <blockquote className="font-brand text-2xl font-semibold leading-snug tracking-[-0.03em] md:text-3xl">
                  “{s.q}”
                </blockquote>
                <figcaption className="mt-6 text-sm text-ink-3">{s.n}</figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-12 text-xs text-ink-4">Illustrative stories for demo personas — not verified endorsements.</p>
        </div>
      </section>

      {/* Pricing nudge */}
      <section className="border-b border-line bg-bg py-20">
        <div className="container-x flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <h2 className="font-brand text-3xl font-bold tracking-[-0.035em] md:text-4xl">Start small. Grow when you’re ready.</h2>
            <p className="mt-3 text-ink-2">14 days free. Paid plans from ৳1,490/month.</p>
          </div>
          <Button href="/pricing" variant="primary" size="lg" className="!rounded-md">
            See plans <ArrowRight className="size-[18px]" />
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-bg py-24 lg:py-32">
        <div className="container-x grid gap-14 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#ff6533]">FAQ</p>
            <h2 className="mt-5 font-brand text-4xl font-bold tracking-[-0.04em]">Straight answers.</h2>
            <p className="mt-5 text-ink-3">
              Still unsure?{" "}
              <Link href="/signup" className="font-medium text-[#ff6533] underline-offset-4 hover:underline">
                Try it free
              </Link>
              .
            </p>
          </div>
          <Faq items={generalFaq} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-[#101010] py-28 text-white">
        <div className="home-grain pointer-events-none absolute inset-0 opacity-30" />
        <div className="container-x relative">
          <h2 className="max-w-3xl font-brand text-4xl font-bold leading-[1.05] tracking-[-0.045em] md:text-6xl">
            Your next order is already waiting in a message.
          </h2>
          <p className="mt-6 max-w-lg text-lg text-white/50">Give every customer a clear answer. Give yourself time to run the shop.</p>
          <Button href="/signup" variant="primary" size="lg" className="mt-10 !rounded-md !h-14 !px-8 !text-base">
            Meet MakAgent <ArrowRight className="size-5" />
          </Button>
        </div>
      </section>
    </>
  );
}
