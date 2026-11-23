"use client";

import { useEffect, useRef, useState } from "react";
import { PlayCircle, Send } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { MockAgent } from "@/lib/mock-agent";

type Msg = { role: "c" | "a"; text: string };

export function DemoButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<Msg[]>([{ role: "a", text: "Hi! Ask “red shirt price”, “delivery”, or “agent chai”." }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const state = useRef<Record<string, unknown>>({});
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [log, busy]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    setLog((l) => [...l, { role: "c", text: q }]);
    setText("");
    setBusy(true);
    setTimeout(() => {
      const r = MockAgent.reply({ message: q, channel: "Facebook", conversationState: state.current });
      setLog((l) => [...l, { role: "a", text: r.text }]);
      setBusy(false);
    }, 600);
  };

  return (
    <>
      <Button variant="outline" size="lg" pill className={className} onClick={() => setOpen(true)} icon={<PlayCircle className="size-[18px]" />}>
        See it in action
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="A conversation that becomes a sale" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Close</Button><Button href="/signup" variant="primary">Build my agent</Button></>}>
        <p className="mb-4 text-sm text-ink-2">Ask the agent about a product. It answers from the sample catalog — no external AI service involved.</p>
        <div className="scroll-y mb-4 flex h-64 flex-col gap-2.5 rounded-xl border border-line bg-bg-deep/50 p-4">
          {log.map((m, i) => (
            <div key={i} className={m.role === "c" ? "ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-raised px-3.5 py-2 text-sm" : "max-w-[85%] rounded-2xl rounded-bl-md bg-brand px-3.5 py-2 text-sm text-white"}>{m.text}</div>
          ))}
          {busy && <div className="text-xs text-ink-3">Typing…</div>}
          <div ref={end} />
        </div>
        <form onSubmit={send} className="flex gap-2">
          <input aria-label="Ask the demo agent" value={text} onChange={(e) => setText(e.target.value)} placeholder="Bhai red shirt er price koto?" className="h-11 flex-1 rounded-full border border-line-strong bg-bg-deep/60 px-5 text-sm placeholder:text-ink-4 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25" />
          <Button variant="primary" pill disabled={busy} aria-label="Send" className="size-11 !px-0"><Send className="size-4" /></Button>
        </form>
      </Modal>
    </>
  );
}
