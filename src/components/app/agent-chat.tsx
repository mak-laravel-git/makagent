"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Send, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui";
import { MockAgent, type AgentReply } from "@/lib/mock-agent";
import { saveOrder } from "@/lib/actions";
import { useStore, money } from "@/lib/store";

type Entry = { role: "c" | "a" | "sys"; text: string; reply?: AgentReply };

/** Live preview of the agent (replaces App.chatTest). Persists AI-collected orders like the original. */
export function AgentChat({ channel = "Facebook", productId, greeting, className = "", height = 360, saveOrders = true }: { channel?: string; productId?: string; greeting?: string; className?: string; height?: number; saveOrders?: boolean }) {
  const agentName = useStore<string>("agent.name", "Nila");
  const [log, setLog] = useState<Entry[]>([{ role: "a", text: greeting || "Ask about a product, delivery, or try “agent chai”." }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const state = useRef<Record<string, any>>({});
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [log, busy]);

  const reset = () => {
    state.current = {};
    setLog([{ role: "a", text: "New conversation started." }]);
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    setLog((l) => [...l, { role: "c", text: q }]);
    setText("");
    setBusy(true);
    setTimeout(() => {
      state.current.previewProductId = productId;
      const r = MockAgent.reply({ message: q, channel, conversationState: state.current });
      const next: Entry[] = [{ role: "a", text: r.text, reply: r }];
      if (r.orderDraft?.complete && saveOrders) {
        const order = saveOrder(r.orderDraft, channel, "agent-test");
        next.push({ role: "sys", text: `✓ ${order.id} saved · ${money(order.total)}` });
      }
      if (r.handover) next.push({ role: "sys", text: "AI paused · A human is needed." });
      setLog((l) => [...l, ...next]);
      setBusy(false);
    }, 550);
  };

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-line bg-bg-deep/40 ${className}`}>
      <div className="flex items-center justify-between border-b border-line px-4 py-3 text-[13px] font-medium">
        <span className="flex items-center gap-2"><Sparkles className="size-4 text-brand" /> {agentName} · Live preview</span>
        <button aria-label="Reset preview" onClick={reset} className="grid size-7 place-items-center rounded-md text-ink-3 hover:bg-line hover:text-ink"><RotateCcw className="size-3.5" /></button>
      </div>
      <div role="log" aria-live="polite" className="scroll-y flex flex-1 flex-col gap-2.5 p-4" style={{ height }}>
        {log.map((m, i) =>
          m.role === "c" ? (
            <div key={i} className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-raised px-3.5 py-2 text-sm">{m.text}</div>
          ) : m.role === "sys" ? (
            <div key={i} className="rounded-lg border border-brand-line bg-brand-soft px-3 py-2 text-xs text-brand">{m.text}</div>
          ) : (
            <div key={i} className="max-w-[88%] rounded-2xl rounded-bl-md bg-brand px-3.5 py-2 text-sm text-white">
              {m.text}
              {m.reply?.cards.filter((c) => c.type === "product").map((c) => (
                <div key={c.id} className="mt-2 flex items-center gap-2.5 rounded-lg bg-white p-2 text-[#111]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt="" className="size-10 rounded-md object-cover" />
                  <div className="text-xs leading-tight"><div className="font-semibold">{c.name}</div><div className="text-[#555]">{money(c.price)} · {c.stock} in stock</div></div>
                </div>
              ))}
              {!!m.reply?.sources?.length && <div className="mt-2 flex flex-wrap gap-1">{m.reply.sources.map((s) => <Badge key={s} tone="neutral" className="!bg-white/20 !text-white">{s}</Badge>)}</div>}
            </div>
          ),
        )}
        {busy && <div className="text-xs text-ink-3">Typing…</div>}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
        <input aria-label="Agent preview question" value={text} onChange={(e) => setText(e.target.value)} placeholder="Bhai red shirt er price koto?" className="h-10 flex-1 rounded-full border border-line-strong bg-surface px-4 text-sm placeholder:text-ink-4 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25" />
        <button disabled={busy} aria-label="Send preview" className="grid size-10 place-items-center rounded-full bg-brand text-white hover:bg-brand-hover disabled:opacity-50"><Send className="size-4" /></button>
      </form>
    </div>
  );
}
