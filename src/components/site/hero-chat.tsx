"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
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
    if (reduce) {
      setN(script.length);
      return;
    }
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>((r) => timers.push(setTimeout(r, ms)));
    (async () => {
      while (!cancelled) {
        setN(0);
        await wait(800);
        for (let i = 0; i < script.length; i++) {
          if (cancelled) return;
          if (script[i].who === "a") {
            setTyping(true);
            await wait(1000);
            setTyping(false);
          }
          setN(i + 1);
          await wait(script[i].who === "c" ? 900 : 1600);
        }
        await wait(4000);
      }
    })();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="flex h-full min-h-[520px] flex-col border-l border-white/10 bg-[#121212]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <div className="font-brand text-lg font-bold tracking-[-0.03em] text-white">Dhaka Threads</div>
          <div className="mt-1 text-[12px] text-white/45">Facebook · Nila answering now</div>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff6533]">Live</span>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-3.5 overflow-hidden px-6 py-6">
        {script.slice(0, n).map((s, i) =>
          s.who === "c" ? (
            <div key={i} className="ml-auto max-w-[82%] animate-pop rounded-md bg-white/[0.08] px-4 py-2.5 text-[15px] text-white/90">
              {s.text}
            </div>
          ) : (
            <div key={i} className="max-w-[90%] animate-pop">
              <div className="rounded-md bg-[#ff6533] px-4 py-2.5 text-[15px] text-white">
                {s.text}
                {s.card && (
                  <div className="mt-3 flex items-center gap-3 border border-white/20 bg-[#111] p-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.images[0]} alt="" className="size-14 object-cover" />
                    <div className="leading-tight">
                      <div className="text-[13px] font-semibold text-white">{product.name}</div>
                      <div className="mt-0.5 text-xs text-white/65">৳1,200 · In stock · M / L</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {typing && (
          <div className="flex w-14 items-center justify-center gap-1 rounded-md bg-[#ff6533]/85 px-4 py-3.5" aria-label="Typing">
            {[0, 1, 2].map((d) => (
              <span key={d} className="size-1.5 animate-bounce rounded-full bg-white" style={{ animationDelay: `${d * 140}ms` }} />
            ))}
          </div>
        )}
      </div>

      <div className="m-5 mt-0 flex items-center justify-between border border-white/12 bg-black/40 py-2.5 pl-4 pr-2 text-sm text-white/40">
        Message Dhaka Threads…
        <span className="grid size-8 place-items-center bg-[#ff6533] text-white">
          <Send className="size-3.5" />
        </span>
      </div>
    </div>
  );
}
