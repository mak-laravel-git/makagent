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
        await wait(700);
        for (let i = 0; i < script.length; i++) {
          if (cancelled) return;
          if (script[i].who === "a") {
            setTyping(true);
            await wait(950);
            setTyping(false);
          }
          setN(i + 1);
          await wait(script[i].who === "c" ? 850 : 1450);
        }
        await wait(3800);
      }
    })();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[480px]">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#171717] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-[#ff6533] text-sm font-bold text-white">Dt</span>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold text-white">Dhaka Threads</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/45">
                <span className="size-1.5 rounded-full bg-[#3ccf91]" />
                Nila · answering on Facebook
              </div>
            </div>
          </div>
          <span className="rounded-md bg-white/6 px-2.5 py-1 text-[11px] font-medium text-white/55">Messenger</span>
        </div>

        <div className="flex h-[400px] flex-col justify-end gap-3 overflow-hidden px-5 py-5">
          {script.slice(0, n).map((s, i) =>
            s.who === "c" ? (
              <div key={i} className="ml-auto max-w-[80%] animate-pop rounded-2xl rounded-br-md bg-white/8 px-4 py-2.5 text-[14.5px] text-white/90">
                {s.text}
              </div>
            ) : (
              <div key={i} className="max-w-[88%] animate-pop">
                <div className="rounded-2xl rounded-bl-md bg-[#ff6533] px-4 py-2.5 text-[14.5px] text-white">
                  {s.text}
                  {s.card && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#111] p-2.5 ring-1 ring-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.images[0]} alt="" className="size-14 rounded-lg object-cover" />
                      <div className="leading-tight">
                        <div className="text-[13px] font-semibold text-white">{product.name}</div>
                        <div className="mt-0.5 text-xs text-white/60">৳1,200 · In stock · M / L</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
          {typing && (
            <div className="flex w-14 items-center justify-center gap-1 rounded-2xl rounded-bl-md bg-[#ff6533]/90 px-4 py-3.5" aria-label="Typing">
              {[0, 1, 2].map((d) => (
                <span key={d} className="size-1.5 animate-bounce rounded-full bg-white" style={{ animationDelay: `${d * 140}ms` }} />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/8 p-4">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 py-2 pl-4 pr-2 text-sm text-white/35">
            Message Dhaka Threads…
            <span className="grid size-8 place-items-center rounded-lg bg-[#ff6533] text-white">
              <Send className="size-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
