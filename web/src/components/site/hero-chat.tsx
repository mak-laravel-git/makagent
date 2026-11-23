"use client";

import { useEffect, useState } from "react";
import { Send, Sparkles, ShoppingBag } from "lucide-react";
import { ChannelChip, Badge } from "@/components/ui";
import { SEED } from "@/lib/data";

type Step = { who: "c" | "a"; text: string; card?: boolean };
const script: Step[] = [
  { who: "c", text: "Bhai red shirt er price koto?" },
  { who: "a", text: "ভাই, এই শার্টটি ৳১,২০০। M ও L সাইজ আছে।", card: true },
  { who: "c", text: "L size den. Gazipur delivery hobe?" },
  { who: "a", text: "অবশ্যই! গাজীপুরে ২–৪ দিনে পৌঁছাবে। আপনার নাম আর ঠিকানাটি বলবেন?" },
];

export function HeroChat() {
  const [n, setN] = useState(0);
  const [typing, setTyping] = useState(false);
  const product = SEED.products[0];

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setN(script.length); return; }
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>((r) => timers.push(setTimeout(r, ms)));
    (async () => {
      while (!cancelled) {
        setN(0);
        await wait(700);
        for (let i = 0; i < script.length; i++) {
          if (cancelled) return;
          if (script[i].who === "a") { setTyping(true); await wait(1100); setTyping(false); }
          setN(i + 1);
          await wait(script[i].who === "c" ? 900 : 1500);
        }
        await wait(4200);
      }
    })();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="absolute -inset-8 -z-10 rounded-[40px] bg-brand/10 blur-3xl" />
      {/* floating chip top */}
      <div className="absolute -left-6 -top-5 z-10 hidden items-center gap-3 rounded-xl border border-line-strong bg-raised/90 px-4 py-3 shadow-pop backdrop-blur md:flex">
        <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand"><Sparkles className="size-4" /></span>
        <div className="leading-tight"><div className="text-[13px] font-semibold">Always online</div><div className="text-xs text-ink-3">Even when you aren’t.</div></div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-pop">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="size-2.5 rounded-full bg-[#ff5f57]/70" /><span className="size-2.5 rounded-full bg-[#febc2e]/70" /><span className="size-2.5 rounded-full bg-[#28c840]/70" />
          <span className="ml-3 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">Live conversation</span>
        </div>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-brand text-sm font-bold text-white">Dt</span>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold">Dhaka Threads</div>
              <div className="flex items-center gap-1.5 text-xs text-ink-3"><span className="size-1.5 rounded-full bg-success" /> Nila · AI sales assistant</div>
            </div>
          </div>
          <ChannelChip type="Facebook" />
        </div>

        <div className="flex h-[380px] flex-col justify-end gap-3 overflow-hidden px-5 py-5">
          {script.slice(0, n).map((s, i) =>
            s.who === "c" ? (
              <div key={i} className="ml-auto max-w-[78%] animate-pop rounded-2xl rounded-br-md bg-raised px-4 py-2.5 text-[15px]">{s.text}</div>
            ) : (
              <div key={i} className="max-w-[88%] animate-pop">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-ink-3"><Sparkles className="size-3 text-brand" /> Nila · AI assistant</div>
                <div className="rounded-2xl rounded-bl-md bg-brand px-4 py-2.5 text-[15px] text-white">
                  {s.text}
                  {s.card && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl bg-white p-2.5 text-ink-on-light">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.images[0]} alt="" className="size-14 rounded-lg object-cover" />
                      <div className="leading-tight text-[#111]">
                        <div className="text-[13px] font-semibold">{product.name}</div>
                        <div className="mt-0.5 text-xs text-[#555]">৳1,200 · In stock</div>
                        <div className="mt-1.5"><Badge tone="neutral">M / L · Red</Badge></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
          {typing && (
            <div className="flex w-14 items-center justify-center gap-1 rounded-2xl rounded-bl-md bg-brand/90 px-4 py-3.5" aria-label="Typing">
              {[0, 1, 2].map((d) => <span key={d} className="size-1.5 animate-bounce rounded-full bg-white" style={{ animationDelay: `${d * 140}ms` }} />)}
            </div>
          )}
        </div>

        <div className="m-4 mt-0 flex items-center justify-between rounded-full border border-line-strong bg-bg-deep/60 py-2 pl-5 pr-2 text-sm text-ink-3">
          Message Dhaka Threads…
          <span className="grid size-8 place-items-center rounded-full bg-brand text-white"><Send className="size-3.5" /></span>
        </div>
      </div>

      <div className="absolute -bottom-6 -right-4 z-10 hidden items-center gap-3 rounded-xl border border-line-strong bg-raised/90 px-4 py-3 shadow-pop backdrop-blur md:flex">
        <span className="grid size-9 place-items-center rounded-lg bg-success/15 text-success"><ShoppingBag className="size-4" /></span>
        <div className="leading-tight"><div className="text-[13px] font-semibold">Another order, collected</div><div className="text-xs text-ink-3">“price koto?” → confirmed</div></div>
        <Badge tone="success">+ ৳1,330</Badge>
      </div>
    </div>
  );
}
