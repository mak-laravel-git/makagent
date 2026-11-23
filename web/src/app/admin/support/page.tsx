"use client";

import { useState } from "react";
import clsx from "clsx";
import { Send, StickyNote } from "lucide-react";
import { Avatar, Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Stat, StatusBadge, Tabs, Textarea } from "@/components/ui";
import { audit } from "@/lib/admin";
import { store, useStore } from "@/lib/store";
import { useUI } from "@/components/providers";
import type { Ticket } from "@/lib/data";

const CANNED = ["Thanks for reaching out — we’re looking into this now.", "Could you share a screenshot and the time it happened?", "We’ve reset the connection on our side. Please re-authorise in Channels → Reconnect.", "This is resolved. Let us know if it comes back."];
const TEAM = ["Arman Kabir", "Maya Rahman", "Rida Hasan"];

export default function Support() {
  const { toast } = useUI();
  const tickets = useStore<Ticket[]>("admin.tickets", []);
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState<string | null>(null);
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");

  const rows = tickets.filter((t) => (filter === "All" || t.status === filter) && (t.subject + t.client + t.id).toLowerCase().includes(q.toLowerCase()));
  const t = tickets.find((x) => x.id === open) ?? rows[0];
  const set = (id: string, v: Partial<Ticket>) => store.patch("admin.tickets", id, v);
  const send = () => {
    if (!t || !draft.trim()) return;
    if (mode === "reply") { store.update<Ticket[]>("admin.tickets", (ts) => { const x = ts.find((k) => k.id === t.id)!; x.messages.push({ role: "support", text: draft.trim(), time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) }); if (x.status === "Open") x.status = "In progress"; }); toast("Reply sent (demo).", "success"); }
    else { store.update<Ticket[]>("admin.tickets", (ts) => { ts.find((k) => k.id === t.id)!.notes.push({ text: draft.trim(), at: new Date().toISOString() }); }); audit("Added ticket note", t.clientId, `${t.id}: internal note`); toast("Internal note saved.", "success"); }
    setDraft("");
  };

  return (
    <>
      <PageHeader eyebrow="Operations · Admin" title="Support, with the context attached." description="Every ticket, its conversation and what your team already tried." />
      <div className="grid gap-4 sm:grid-cols-3"><Stat label="Open" value={tickets.filter((x) => x.status === "Open").length} accent /><Stat label="In progress" value={tickets.filter((x) => x.status === "In progress").length} /><Stat label="High priority" value={tickets.filter((x) => x.priority === "High" && x.status !== "Resolved").length} /></div>

      <div className="mt-6 grid min-h-[560px] gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="flex flex-col overflow-hidden">
          <div className="space-y-3 border-b border-line p-4"><Input aria-label="Search tickets" placeholder="Search tickets…" value={q} onChange={(e) => setQ(e.target.value)} /><div className="overflow-x-auto"><Tabs value={filter} onChange={setFilter} options={["All", "Open", "In progress", "Resolved"].map((v) => ({ value: v, label: v }))} /></div></div>
          <div className="scroll-y flex-1">{rows.map((x) => <button key={x.id} onClick={() => { setOpen(x.id); setMode("reply"); }} className={clsx("block w-full border-b border-line px-5 py-4 text-left transition-colors", t?.id === x.id ? "bg-brand-soft" : "hover:bg-line")}><div className="flex items-center justify-between gap-2"><span className="num text-xs text-ink-3">{x.id}</span>{x.priority === "High" && <Badge tone="danger">High</Badge>}</div><div className="mt-1 text-sm font-medium">{x.subject}</div><div className="mt-1.5 flex items-center justify-between text-xs text-ink-3"><span>{x.client}</span><StatusBadge status={x.status} /></div></button>)}{!rows.length && <EmptyState title="No tickets" />}</div>
        </Card>

        <Card className="flex flex-col">
          {!t ? <EmptyState title="Select a ticket" /> : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5">
                <div><div className="num text-xs text-ink-3">{t.id} · {t.client}</div><h2 className="mt-1 text-lg font-semibold tracking-tight">{t.subject}</h2></div>
                <div className="flex flex-wrap gap-2"><Select aria-label="Status" className="w-36" value={t.status} onChange={(e) => { set(t.id, { status: e.target.value }); audit("Ticket status changed", t.clientId, `${t.id} → ${e.target.value}`); }}>{["Open", "In progress", "Resolved"].map((s) => <option key={s}>{s}</option>)}</Select><Select aria-label="Priority" className="w-28" value={t.priority} onChange={(e) => set(t.id, { priority: e.target.value })}><option>Normal</option><option>High</option></Select><Select aria-label="Assignee" className="w-40" value={t.assignee} onChange={(e) => { set(t.id, { assignee: e.target.value }); toast(`Assigned to ${e.target.value}.`, "info"); }}>{TEAM.map((m) => <option key={m}>{m}</option>)}</Select></div>
              </div>
              <div className="scroll-y flex-1 space-y-4 p-5">
                {t.messages.map((m, i) => <div key={i} className={clsx("flex gap-3", m.role === "support" && "flex-row-reverse")}><Avatar name={m.role === "support" ? t.assignee : t.client} colour={m.role === "support" ? "var(--brand)" : "#e0e1ed"} size={34} /><div className={clsx("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm", m.role === "support" ? "rounded-tr-md bg-brand text-white" : "rounded-tl-md bg-raised")}>{m.text}<div className={clsx("mt-1 text-[11px]", m.role === "support" ? "text-white/70" : "text-ink-4")}>{m.time}</div></div></div>)}
                {t.notes.map((n, i) => <div key={i} className="mx-auto max-w-[80%] rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm"><div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-warning"><StickyNote className="size-3" /> Internal note</div>{n.text}</div>)}
              </div>
              <div className="border-t border-line p-4">
                <div className="mb-3 flex items-center gap-1.5">{(["reply", "note"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={clsx("rounded-md px-3 py-1.5 text-[13px] font-medium", mode === m ? "bg-raised" : "text-ink-3")}>{m === "reply" ? "Reply to client" : "Internal note"}</button>)}
                  {mode === "reply" && <Select aria-label="Canned replies" className="ml-auto w-56 !h-8 !text-xs" value="" onChange={(e) => e.target.value && setDraft(e.target.value)}><option value="">Canned replies…</option>{CANNED.map((c) => <option key={c} value={c}>{c.slice(0, 40)}…</option>)}</Select>}</div>
                <Field><Textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={mode === "reply" ? "Write a reply…" : "Add context for your team…"} /></Field>
                <div className="mt-3 flex justify-end"><Button variant="primary" icon={<Send className="size-4" />} onClick={send} disabled={!draft.trim()}>{mode === "reply" ? "Send reply" : "Save note"}</Button></div>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
