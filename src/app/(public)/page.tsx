import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Check, CircleCheck, Handshake, Languages, MessagesSquare, PackageSearch, Plug, ShoppingBag, ArrowUpRight } from "lucide-react";
import { Badge, Button, SectionTitle } from "@/components/ui";
import { HeroChat } from "@/components/site/hero-chat";
import { DemoButton } from "@/components/site/demo-modal";
import { Faq, generalFaq } from "@/components/site/faq";
import { SEED } from "@/lib/data";

const steps = [
  { Icon: Plug, t: "Connect", d: "Bring your Facebook Page, Instagram and WhatsApp into one place. No code. No complicated integrations." },
  { Icon: BookOpen, t: "Teach", d: "Add your products, prices and policies. Your agent learns what makes your business yours." },
  { Icon: ShoppingBag, t: "Sell", d: "Let your agent answer questions, collect orders and bring in your team when a human touch matters." },
];

const features = [
  { Icon: MessagesSquare, t: "Every channel, one conversation", d: "Messages and comments from all your business channels, together in one calm workspace." },
  { Icon: Languages, t: "Speaks your customers’ language", d: "Bangla, Banglish or English. Meet customers where they’re comfortable." },
  { Icon: PackageSearch, t: "Knows your catalog", d: "Accurate prices, variants and stock. Answers from your products, not guesswork." },
  { Icon: ShoppingBag, t: "Turns interest into orders", d: "Collect names, phone numbers, addresses and order details, one natural step at a time." },
  { Icon: Handshake, t: "Knows when to hand over", d: "A real person is one request away. Set the rules, and stay in control." },
  { Icon: CalendarDays, t: "Keeps your business showing up", d: "Plan posts, reply to comments and discover what customers ask about most." },
];

const stories = [
  { q: "We used to lose customers while packing orders. Now every price question gets an answer — even on our busiest days.", n: "Nusrat Jahan", b: "Dhaka Threads · Fashion", a: "NJ" },
  { q: "Our customers ask in Banglish, and that matters. An assistant that understands how they shop makes the whole experience easier.", n: "Tanvir Ahmed", b: "Gadget Ghor · Electronics", a: "TA" },
  { q: "Delivery areas, today’s menu, payment options. Taking those questions off my plate gives me time to cook.", n: "Farhana Islam", b: "Ghorer Ranna · Home food", a: "FI" },
];

export default function Landing() {
  const convos = SEED.conversations.slice(0, 3);
  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden pt-[76px]">
        <div className="grid-bg absolute inset-0" />
        <div className="absolute left-1/2 top-0 h-[620px] w-[1000px] -translate-x-1/2 rounded-full bg-brand/[0.07] blur-[120px]" />
        <div className="container-x relative grid items-center gap-16 py-20 lg:grid-cols-[1.08fr_1fr] lg:py-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-surface/70 py-1.5 pl-2 pr-4 text-[13px] font-medium text-ink-2 backdrop-blur">
              <span className="relative grid size-5 place-items-center"><span className="absolute size-2 animate-pulse-ring rounded-full bg-brand" /><span className="size-2 rounded-full bg-brand" /></span>
              Your next sale starts with a conversation
            </span>
            <h1 className="mt-8 text-[clamp(2.75rem,6.2vw,5.75rem)] font-bold leading-[0.98] tracking-[-0.045em]">
              Turn every message and comment into <span className="text-brand">a sale.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-2 md:text-xl">
              Meet the AI sales agent that knows your products, speaks your customers’ language, and never misses a message. On Facebook, Instagram and WhatsApp.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button href="/signup" variant="primary" size="lg" pill>Start your free trial <ArrowRight className="size-[18px]" /></Button>
              <DemoButton />
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-ink-2">
              {["No credit card needed", "Set up in minutes", "Bangla-ready"].map((t) => (
                <li key={t} className="inline-flex items-center gap-2"><Check className="size-4 text-brand" strokeWidth={2.5} />{t}</li>
              ))}
            </ul>
          </div>
          <HeroChat />
        </div>
      </section>

      {/* ───────── Channel marquee ───────── */}
      <section className="border-y border-line bg-bg-deep/60">
        <div className="container-x flex flex-wrap items-center justify-between gap-6 py-8">
          <p className="text-sm font-medium text-ink-3">One intelligent agent. Everywhere your customers are.</p>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-3 text-lg font-semibold tracking-tight text-ink-2">
            {["Facebook Messenger", "Instagram DMs", "WhatsApp Business", "Page comments"].map((c) => <span key={c} className="transition-colors hover:text-ink">{c}</span>)}
          </div>
        </div>
      </section>

      {/* ───────── How it works (light band, like maktechgroup.com) ───────── */}
      <section id="how-it-works" className="surface-light scroll-mt-20 py-28 lg:py-36">
        <div className="container-x">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-end">
            <SectionTitle eyebrow="From first message to first sale" title={<>A smarter sales team. <span className="text-ink-3">Without the extra headcount.</span></>} />
            <p className="max-w-lg text-lg leading-relaxed text-ink-2 lg:justify-self-end">Three simple steps. One tireless assistant that makes every customer feel heard.</p>
          </div>
          <div className="mt-20 grid gap-5 md:grid-cols-3">
            {steps.map(({ Icon, t, d }, i) => (
              <article key={t} className="group relative overflow-hidden rounded-2xl border border-line bg-[#fafafa] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-line hover:shadow-[0_24px_50px_-24px_rgb(255_101_51/0.35)]">
                <span className="num absolute right-6 top-4 text-[120px] font-bold leading-none tracking-tighter text-black/[0.04]">{i + 1}</span>
                <span className="grid size-14 place-items-center rounded-xl bg-[#111] text-brand"><Icon className="size-6" /></span>
                <h3 className="mt-10 text-2xl font-bold tracking-tight">{t}</h3>
                <p className="mt-3 text-base leading-relaxed text-ink-2">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Features ───────── */}
      <section id="features" className="relative scroll-mt-20 py-28 lg:py-36">
        <div className="container-x">
          <SectionTitle eyebrow="More conversations. Fewer missed opportunities." title={<>Everything a great salesperson does. <span className="text-ink-3">Right in your inbox.</span></>} text="Helpful, context-aware selling that feels personal — not robotic." />
          <div className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ Icon, t, d }) => (
              <article key={t} className="group relative bg-surface p-9 transition-colors hover:bg-card">
                <span className="grid size-12 place-items-center rounded-xl border border-line-strong text-brand transition-all group-hover:border-brand group-hover:bg-brand group-hover:text-white"><Icon className="size-5" /></span>
                <h3 className="mt-8 text-xl font-semibold tracking-tight">{t}</h3>
                <p className="mt-3 leading-relaxed text-ink-2">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Showcase ───────── */}
      <section className="surface-deep py-28 lg:py-36">
        <div className="container-x grid items-center gap-16 lg:grid-cols-2">
          <div>
            <div className="eyebrow mb-5">Your business. A clearer picture.</div>
            <h2 className="text-4xl font-bold leading-[1.05] tracking-[-0.035em] md:text-5xl lg:text-[56px]">Less switching tabs. More moving forward.</h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">See what’s happening across your business without jumping between inboxes and spreadsheets. Your agent handles the routine. You focus on what’s next.</p>
            <ul className="mt-10 space-y-4">
              {["Every customer conversation, in one place", "Orders and handovers that don’t slip through", "Clear insights into what’s actually selling"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-base text-ink"><CircleCheck className="size-5 text-brand" />{t}</li>
              ))}
            </ul>
            <Button href="/login" variant="outline" pill size="lg" className="mt-10">Explore the dashboard <ArrowUpRight className="size-[18px]" /></Button>
          </div>

          <div className="rounded-2xl border border-line-strong bg-surface p-6 shadow-pop md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold tracking-tight">Good morning, Nusrat</div>
                <div className="text-sm text-ink-3">Your sales agent is on it.</div>
              </div>
              <Badge tone="success" dot>AI is live</Badge>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[["Conversations", "248"], ["AI-handled", "94.2%"], ["Orders", "32"]].map(([l, v], i) => (
                <div key={l} className={`rounded-xl border p-4 ${i === 1 ? "border-brand-line bg-brand text-white" : "border-line bg-bg-deep/50"}`}>
                  <div className={`text-xs ${i === 1 ? "text-white/80" : "text-ink-3"}`}>{l}</div>
                  <div className="num mt-2 text-2xl font-bold tracking-tight">{v}</div>
                  <div className={`mt-2 text-[11px] font-medium ${i === 1 ? "text-white/80" : "text-success"}`}>↗ Growing</div>
                </div>
              ))}
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-line">
              <div className="border-b border-line px-4 py-3 text-sm font-semibold">Recent conversations</div>
              {convos.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-black/70" style={{ background: c.colour }}>{c.initials}</span>
                    <div className="min-w-0 leading-tight"><div className="truncate text-sm font-medium">{c.name}</div><div className="truncate text-xs text-ink-3">{c.messages[0].text}</div></div>
                  </div>
                  <Badge tone={c.status === "Needs human" ? "warning" : "brand"}>{c.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Testimonials ───────── */}
      <section className="py-28 lg:py-36">
        <div className="container-x">
          <SectionTitle eyebrow="Built around real business needs" title="Small teams. Big ambitions." text="Illustrative stories from the kinds of businesses we’re building for." />
          <div className="mt-16 grid gap-5 lg:grid-cols-3">
            {stories.map((s) => (
              <figure key={s.n} className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-8 transition-colors hover:border-line-strong">
                <div>
                  <div className="text-brand" aria-label="5 out of 5 stars">★★★★★</div>
                  <blockquote className="mt-6 text-xl leading-snug tracking-tight">“{s.q}”</blockquote>
                </div>
                <figcaption className="mt-10 flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-full bg-raised text-sm font-bold">{s.a}</span>
                  <div className="leading-tight"><div className="font-semibold">{s.n}</div><div className="text-sm text-ink-3">{s.b}</div></div>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-ink-3">Demo personas and illustrative testimonials. Not verified customer endorsements.</p>
        </div>
      </section>

      {/* ───────── Pricing teaser ───────── */}
      <section className="pb-28">
        <div className="container-x">
          <div className="relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-3xl border border-brand-line bg-brand-soft p-10 md:p-14">
            <div className="absolute -right-20 -top-20 size-72 rounded-full bg-brand/20 blur-3xl" />
            <div className="relative">
              <h3 className="text-3xl font-bold tracking-[-0.03em] md:text-4xl">Start small. Grow on your terms.</h3>
              <p className="mt-3 text-lg text-ink-2">Try it free for 14 days. Paid plans from ৳1,490/month. No credit card.</p>
            </div>
            <Button href="/pricing" variant="primary" size="lg" pill className="relative">Find your plan <ArrowRight className="size-[18px]" /></Button>
          </div>
        </div>
      </section>

      {/* ───────── FAQ (light band) ───────── */}
      <section id="faq" className="surface-light scroll-mt-20 py-28 lg:py-36">
        <div className="container-x grid gap-16 lg:grid-cols-[0.8fr_1.4fr]">
          <div>
            <SectionTitle eyebrow="A little more clarity" title="Good questions. Straight answers." />
            <p className="mt-6 text-ink-3">Still unsure? <Link href="/signup" className="font-medium text-brand underline-offset-4 hover:underline">Try it free</Link> and see for yourself.</p>
          </div>
          <Faq items={generalFaq} />
        </div>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="relative overflow-hidden py-28 lg:py-40">
        <div className="absolute left-1/2 top-1/2 size-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[110px]" />
        <div className="container-x relative text-center">
          <h2 className="mx-auto max-w-4xl text-5xl font-bold leading-[1] tracking-[-0.045em] md:text-7xl">Your next sale is already in your inbox.</h2>
          <p className="mx-auto mt-8 max-w-xl text-xl text-ink-2">Give every customer a helpful answer. Give your business room to grow.</p>
          <Button href="/signup" variant="primary" size="lg" pill className="mt-10 !h-14 !px-8 !text-base">Meet your new sales agent <ArrowRight className="size-5" /></Button>
          <p className="mt-6 text-sm text-ink-3">14-day free trial · No credit card · Set up at your own pace</p>
        </div>
      </section>
    </>
  );
}
