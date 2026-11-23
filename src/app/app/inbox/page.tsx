"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, FilePlus2, MessageCirclePlus, PanelRight, Search, Send, Sparkles, StickyNote, UserRound, X, Zap } from "lucide-react";
import clsx from "clsx";
import { Avatar, Badge, Button, ChannelChip, EmptyState, Field, Input, Modal, PageHeader, Select, StatusBadge, Textarea, Checkbox } from "@/components/ui";
import { useStore, store, money } from "@/lib/store";
import { MockAgent } from "@/lib/mock-agent";
import { addMessage, addNotification, saveOrder, updateConversation, windowExpired, windowRemaining } from "@/lib/actions";
import { useUI } from "@/components/providers";
import type { Conversation, Message, Order, Product, Template } from "@/lib/data";

type Conv = Conversation & Record<string, any>;

export default function InboxPage() {
  return (
    <Suspense>
      <Inbox />
    </Suspense>
  );
}

function Inbox() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useUI();
  const conversations = useStore<Conv[]>("conversations", []);
  const products = useStore<Product[]>("products", []);
  const orders = useStore<Order[]>("orders", []);
  const templates = useStore<Template[]>("templates", []);
  const demo = useStore<any>("demo", {});
  const agentName = useStore<string>("agent.name", "Nila");
  const clientName = useStore<string>("client.name", "");

  const [active, setActive] = useState<string | null>(params.get("id") || params.get("c"));
  const [filter, setFilter] = useState("All");
  const [channel, setChannel] = useState("All channels");
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [mode, setMode] = useState<"message" | "note">("message");
  const [draft, setDraft] = useState("");
  const [mobileThread, setMobileThread] = useState(!!(params.get("id") || params.get("c")));
  const [showProfile, setShowProfile] = useState(false);
  const [typing, setTyping] = useState<string[]>([]);
  const [modal, setModal] = useState<null | "simulate" | "quick" | "suggest" | "template" | "tag">(null);
  const [, setNow] = useState(0);
  const tick = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const windowsReady = useRef(false);

  // Seed reply windows become moving deadlines on first visit.
  useEffect(() => {
    if (windowsReady.current || !conversations.length) return;
    windowsReady.current = true;
    if (conversations.some((c) => c.replyWindowEnds == null)) {
      store.update<Conv[]>("conversations", (cs) => cs.forEach((c) => { if (!c.replyWindowEnds) c.replyWindowEnds = c.windowHours > 0 ? Date.now() + c.windowHours * 3600000 : Date.now() - 1; }));
    }
  }, [conversations]);

  useEffect(() => {
    if (!active && conversations[0]) setActive(conversations[0].id);
  }, [active, conversations]);

  // countdown tick
  useEffect(() => {
    const t = setInterval(() => setNow((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const current = conversations.find((c) => c.id === active) as Conv | undefined;

  useEffect(() => {
    if (active && current?.unread) updateConversation(active, (c) => { c.unread = 0; });
  }, [active, current?.unread]);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [current?.messages.length, typing.length, active]);

  const rows = useMemo(() => conversations
    .filter((c) => (c.name + " " + (c.messages.at(-1)?.text ?? "")).toLowerCase().includes(query.toLowerCase()))
    .filter((c) => channel === "All channels" || c.channel === channel)
    .filter((c) => !unreadOnly || c.unread > 0)
    .filter((c) => filter === "All" || (filter === "Needs human" ? ["Needs human", "Human handling"].includes(c.status) : c.status === filter)), [conversations, query, channel, unreadOnly, filter]);

  const select = (id: string) => {
    setActive(id); setMobileThread(true); setDraft(""); setMode("message"); setShowProfile(false);
    router.replace(`/app/inbox?id=${encodeURIComponent(id)}`, { scroll: false });
  };

  /** Deliver a customer message and, when allowed, let the agent answer. */
  const incoming = useCallback((customText?: string) => {
    const all = store.get<Conv[]>("conversations", []);
    const target = all.find((c) => c.id === active) || all[0];
    if (!target) { toast("Add a conversation first.", "warning"); return; }
    const texts = ["Bhai red shirt er price koto?", "Delivery koto din lage?", "Can I pay with bKash?", "agent chai"];
    const available = store.get<Product[]>("products", []).find((p) => p.status === "Active");
    const text = customText ?? (tick.current % 4 === 0 && available ? `${available.name} price` : texts[tick.current % 4]);
    tick.current++;
    addMessage(target.id, "customer", text);
    if (target.status === "Resolved") updateConversation(target.id, (x) => { x.status = "AI handling"; });
    const latest = store.get<Conv[]>("conversations", []).find((x) => x.id === target.id)!;
    const ch = store.get<any[]>("channels", []).find((c) => c.type === latest.channel);
    const canReply = store.get("client.agentLive") && latest.status === "AI handling" && ch?.bot !== false && ch?.status === "Connected" && !(latest.channel === "Instagram" && !ch.messageAccess) && !(store.get("demo.tokenExpired") && latest.channel === "Facebook") && !windowExpired(latest);
    if (canReply) {
      setTyping((t) => [...t, target.id]);
      setTimeout(() => {
        const cur = store.get<Conv[]>("conversations", []).find((x) => x.id === target.id)!;
        const stop = () => setTyping((t) => t.filter((x) => x !== target.id));
        if (cur.status !== "AI handling" || !store.get("client.agentLive") || windowExpired(cur) || store.get<any[]>("channels", []).find((c) => c.type === cur.channel)?.bot === false || (cur.channel === "Facebook" && store.get("demo.tokenExpired"))) return stop();
        const state = cur.agentState || {};
        const r = MockAgent.reply({ message: text, channel: cur.channel, conversationState: state });
        let order: Order | undefined;
        if (r.orderDraft?.complete) order = saveOrder(r.orderDraft, cur.channel, target.id);
        addMessage(target.id, r.paused ? "note" : "ai", r.text, { cards: r.cards, productId: r.cards.find((x) => x.type === "product")?.id, orderId: order?.id });
        updateConversation(target.id, (x) => { x.agentState = state; if (r.handover) { x.status = "Needs human"; x.handoverReason = "Customer asked for a human or an escalation rule matched."; } });
        if (r.handover) addNotification(`${cur.name} needs a human`, "Your AI paused the conversation.", "handover");
        stop();
      }, 850);
    }
    toast("Simulated incoming customer message.", "info");
  }, [active, toast]);

  useEffect(() => {
    if (!demo.live) return;
    const t = setInterval(() => incoming(), 20000);
    return () => clearInterval(t);
  }, [demo.live, incoming]);

  const sendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current) return;
    if (mode === "message" && windowExpired(current)) { toast("The free reply window expired. Use a template.", "warning"); return; }
    const text = draft.trim();
    if (!text) return;
    addMessage(current.id, mode === "note" ? "note" : "human", text);
    if (mode === "message") updateConversation(current.id, (x) => { x.status = "Human handling"; x.assignee = store.get("client.owner"); });
    setDraft("");
    toast(mode === "note" ? "Internal note saved." : "Reply delivered.", "success");
  };

  const takeOver = () => { if (!current) return; updateConversation(current.id, (x) => { x.status = "Human handling"; x.assignee = store.get("client.owner"); }); toast("You’re handling this conversation. AI replies are paused.", "info"); };
  const returnAI = () => { if (!current) return; updateConversation(current.id, (x) => { x.status = "AI handling"; x.agentState = { ...(x.agentState || {}), handover: false, unknownCount: 0 }; delete x.assignee; }); toast("Conversation returned to your AI.", "success"); };
  const resolve = () => { if (!current) return; updateConversation(current.id, (x) => { x.status = "Resolved"; }); toast("Conversation marked as resolved.", "success"); };

  const needs = current && ["Needs human", "Human handling"].includes(current.status);
  const expired = current ? windowExpired(current) : false;

  return (
    <>
      <PageHeader
        eyebrow={`Connected inbox · ${clientName}`}
        title="Every conversation, in good hands."
        description="One inbox for the questions, orders and moments that matter."
        actions={<><Badge tone={demo.live ? "success" : "neutral"} dot>{demo.live ? "Live demo on" : "Live demo off"}</Badge><Button onClick={() => setModal("simulate")} icon={<MessageCirclePlus className="size-4" />}>Simulate message</Button></>}
      />

      <section className="grid h-[calc(100vh-17rem)] min-h-[560px] overflow-hidden rounded-xl border border-line bg-surface lg:grid-cols-[340px_1fr] xl:grid-cols-[340px_1fr_300px]">
        {/* list */}
        <aside className={clsx("flex min-h-0 flex-col border-r border-line", mobileThread && "hidden lg:flex")}>
          <div className="space-y-2.5 border-b border-line p-3.5">
            <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" /><Input aria-label="Search conversations" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers or messages…" className="!h-9 pl-9" /></div>
            <div className="grid grid-cols-2 gap-2">
              <Select aria-label="Conversation status" value={filter} onChange={(e) => setFilter(e.target.value)} className="!h-9 text-[13px]">{["All", "AI handling", "Needs human", "Resolved"].map((f) => <option key={f}>{f}</option>)}</Select>
              <Select aria-label="Conversation channel" value={channel} onChange={(e) => setChannel(e.target.value)} className="!h-9 text-[13px]">{["All channels", "Facebook", "Instagram", "WhatsApp"].map((f) => <option key={f}>{f}</option>)}</Select>
            </div>
            <Checkbox checked={unreadOnly} onChange={setUnreadOnly} label="Unread only" />
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4"><span>Conversations</span><span className="num">{rows.length} of {conversations.length}</span></div>
          <div className="scroll-y flex-1">
            {rows.length === 0 ? <EmptyState title="No conversations found" text="Try another name or filter." /> : rows.map((c) => {
              const last = c.messages.filter((m) => m.role !== "note").at(-1);
              return (
                <button key={c.id} onClick={() => select(c.id)} aria-pressed={active === c.id} className={clsx("flex w-full gap-3 border-b border-line px-4 py-3.5 text-left transition-colors", active === c.id ? "bg-brand-soft" : "hover:bg-line")}>
                  <Avatar name={c.name} colour={c.colour} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2"><strong className="truncate text-sm">{c.name}</strong><time className="shrink-0 text-xs text-ink-4">{c.time}</time></div>
                    <p className="mt-0.5 truncate text-[13px] text-ink-3">{last?.text || "Start a conversation"}</p>
                    <div className="mt-2 flex items-center justify-between"><ChannelChip type={c.channel} compact /><span className="text-xs text-ink-3">{c.status === "AI handling" ? "✦ AI" : c.status === "Resolved" ? "✓ Resolved" : "◷ Human"}</span>{c.unread > 0 && <span className="num grid min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-bold leading-5 text-white">{c.unread}</span>}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* thread */}
        <section className={clsx("flex min-h-0 min-w-0 flex-col", !mobileThread && "hidden lg:flex")}>
          {!current ? (
            <div className="grid flex-1 place-items-center p-10 text-center text-ink-3">Your next conversation starts here.<br />Use “Simulate message” to try one.</div>
          ) : (
            <>
              <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <button className="grid size-9 place-items-center rounded-lg hover:bg-line lg:hidden" aria-label="Back to conversations" onClick={() => setMobileThread(false)}><ArrowLeft className="size-4" /></button>
                  <Avatar name={current.name} colour={current.colour} size={40} />
                  <div className="min-w-0 leading-tight"><div className="truncate text-[15px] font-semibold">{current.name}</div><div className="truncate text-xs text-ink-3">{current.channel} · {current.status === "AI handling" ? `${agentName} is helping` : current.status}</div></div>
                </div>
                <div className="flex items-center gap-2"><StatusBadge status={current.status} />
                  <button className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-line xl:hidden" aria-label="Show customer profile" onClick={() => setShowProfile(true)}><PanelRight className="size-4" /></button>
                  <button className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-line disabled:opacity-40" aria-label="Resolve conversation" disabled={current.status === "Resolved"} onClick={resolve}><CheckCircle2 className="size-[18px]" /></button>
                </div>
              </header>

              {needs ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-5 py-3">
                  <div><div className="text-sm font-semibold text-warning">AI paused · {current.status === "Human handling" ? "You’re handling this conversation" : "Customer asked for a human"}</div><div className="text-xs text-ink-3">{current.handoverReason || "A human touch will help move this forward."}</div></div>
                  <div className="flex gap-2">{current.status === "Needs human" && <Button size="sm" onClick={takeOver}>Take over</Button>}<Button size="sm" onClick={returnAI}>Return to AI</Button></div>
                </div>
              ) : (
                <div className="flex items-center justify-between border-b border-line bg-bg-deep/30 px-5 py-2 text-xs text-ink-3"><span>{current.status === "Resolved" ? "✓ This conversation is resolved." : "✦ AI is answering from your catalog and knowledge."}</span><button className="font-medium text-brand hover:underline" onClick={takeOver}>Take over</button></div>
              )}

              <div ref={logRef} role="log" aria-label="Conversation messages" aria-live="polite" className="scroll-y flex-1 space-y-4 px-5 py-5">
                <div className="text-center text-[11px] uppercase tracking-[0.12em] text-ink-4">Demo conversation · All messages stay in this browser</div>
                {current.messages.map((m) => <Bubble key={m.id} m={m as Message & Record<string, any>} c={current} products={products} orders={orders} agentName={agentName} />)}
                {typing.includes(current.id) && <div className="text-xs italic text-ink-3">{agentName} is typing…</div>}
              </div>

              <div className="border-t border-line p-4">
                <div className="mb-3 flex items-center gap-1.5">
                  {(["message", "note"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={clsx("rounded-md px-3 py-1.5 text-[13px] font-medium", mode === m ? "bg-raised text-ink" : "text-ink-3 hover:text-ink")}>{m === "message" ? "Reply" : "Internal note"}</button>)}
                  <button onClick={() => setModal("quick")} className="ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-ink-3 hover:text-brand"><Zap className="size-3.5" /> Quick replies</button>
                </div>
                {mode === "message" && expired ? (
                  <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
                    <div className="text-sm font-semibold text-warning">24-hour reply window expired</div>
                    <p className="mt-1 text-[13px] text-ink-2">For WhatsApp, use an approved template with customer opt-in. A template does not reopen the free-text window; a new customer message does.</p>
                    <Button variant="primary" size="sm" className="mt-3" icon={<FilePlus2 className="size-4" />} onClick={() => setModal("template")}>Send a template message</Button>
                  </div>
                ) : (
                  <form onSubmit={sendReply}>
                    {mode === "message" ? (
                      <div className="mb-2 flex items-center justify-between text-xs text-ink-3"><span className="inline-flex items-center gap-1.5"><Sparkles className="size-3.5 text-brand" /> AI can help draft your next reply.</span><button type="button" className="font-medium text-brand hover:underline" onClick={() => setModal("suggest")}>Suggest reply</button></div>
                    ) : <div className="mb-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">Only your team can see this note. It is never sent to the customer.</div>}
                    <Textarea aria-label={mode === "note" ? "Internal note" : "Message to customer"} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} placeholder={mode === "note" ? "Add context for your team…" : "Write your reply…"} rows={2} className="!min-h-[64px] resize-none" />
                    <div className="mt-2.5 flex items-center justify-between"><span className="text-xs text-ink-3">{mode === "note" ? "Internal only" : current.channel === "WhatsApp" ? `Approved free reply window · ${windowRemaining(current)}` : "Human reply · AI pauses when you send"}</span><Button type="submit" variant="primary" size="sm" icon={mode === "note" ? <StickyNote className="size-4" /> : <Send className="size-4" />}>{mode === "note" ? "Add note" : "Send reply"}</Button></div>
                  </form>
                )}
              </div>
            </>
          )}
        </section>

        {/* profile */}
        {current && (
          <aside className={clsx("scroll-y min-h-0 border-l border-line bg-surface p-5 xl:block", showProfile ? "fixed inset-0 z-[70] block w-full max-w-sm !border-l-0 bg-surface shadow-pop sm:right-0 sm:left-auto sm:border-l" : "hidden")}>
            {showProfile && <button className="mb-4 inline-flex items-center gap-2 text-sm text-ink-3 hover:text-ink xl:hidden" onClick={() => setShowProfile(false)}><X className="size-4" /> Close profile</button>}
            <Profile c={current} orders={orders} onTag={() => setModal("tag")} onReturn={returnAI} onResolve={resolve} />
          </aside>
        )}
      </section>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-line px-5 py-3 text-[13px] text-ink-3">
        <span className="flex items-center gap-2"><span className={clsx("size-2 rounded-full", demo.live ? "bg-success" : "bg-ink-4")} />{demo.live ? "A new incoming message arrives about every 20 seconds." : "Turn on Live incoming messages in Demo controls to watch your agent reply."}</span>
        <Link href="/app/agent" className="font-medium text-brand hover:underline">Agent settings →</Link>
      </div>

      <SimulateModal open={modal === "simulate"} onClose={() => setModal(null)} onSend={(t) => { incoming(t); setModal(null); }} products={products} />
      <QuickModal open={modal === "quick"} onClose={() => setModal(null)} onPick={(t) => { setDraft(t); setMode("message"); setModal(null); }} />
      <SuggestModal open={modal === "suggest"} onClose={() => setModal(null)} conv={current} onUse={(t) => { setDraft(t); setMode("message"); setModal(null); }} />
      <TemplateModal open={modal === "template"} onClose={() => setModal(null)} conv={current} templates={templates} onSent={(text, name) => { if (current) addMessage(current.id, "human", text, { templateName: name }); setModal(null); toast("Template delivered. Reply window remains expired.", "success"); }} />
      <TagModal open={modal === "tag"} onClose={() => setModal(null)} onAdd={(tag) => { if (current) updateConversation(current.id, (x) => { if (!x.tags.includes(tag)) x.tags.push(tag); }); setModal(null); toast("Customer tag added.", "success"); }} />
    </>
  );
}

function Bubble({ m, c, products, orders, agentName }: { m: Message & Record<string, any>; c: Conv; products: Product[]; orders: Order[]; agentName: string }) {
  if (m.role === "note") {
    return (
      <div className="flex justify-center"><div className="max-w-[80%] rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm"><div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-warning"><StickyNote className="size-3" /> Internal note · Team only</div>{m.text}<div className="mt-1 text-[11px] text-ink-3">{m.time || "Just now"}</div></div></div>
    );
  }
  const customer = m.role === "customer";
  const product = m.productId ? products.find((p) => p.id === m.productId) : null;
  const cards = (m.cards || []).filter((x: any) => x.type === "product");
  const order = m.orderId ? orders.find((o) => o.id === m.orderId) : null;
  return (
    <div className={clsx("flex flex-col", customer ? "items-start" : "items-end")}>
      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-ink-3">
        {m.role === "ai" ? <Sparkles className="size-3 text-brand" /> : m.role === "human" ? <UserRound className="size-3" /> : null}
        {customer ? c.name : m.role === "ai" ? `${agentName} · AI assistant` : "You · Human agent"}{m.templateName ? ` · Template: ${m.templateName}` : ""}
      </div>
      <div className={clsx("max-w-[78%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed", customer ? "rounded-bl-md bg-raised" : m.role === "ai" ? "rounded-br-md bg-brand text-white" : "rounded-br-md bg-invert text-invert-ink")}>
        {m.text}
        {(product ? [{ name: product.name, price: product.discountPrice || product.price, stock: product.stock, image: product.images[0] }] : cards).map((p: any) => (
          <div key={p.name} className="mt-2.5 flex items-center gap-2.5 rounded-lg bg-white p-2 text-[#111]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt="" className="size-11 rounded-md object-cover" />
            <div className="text-xs leading-tight"><div className="font-semibold">{p.name}</div><div className="text-[#555]">{money(p.price)} · {p.stock} in stock</div></div>
          </div>
        ))}
        {order && <div className="mt-2.5 rounded-lg bg-white/15 p-2.5 text-xs"><strong>✓ {order.id} · AI-collected order</strong><div>{order.customer} · {money(order.total)} · {order.status}</div><Link href={`/app/orders?id=${order.id}`} className="font-semibold underline">View details →</Link></div>}
      </div>
      <div className="mt-1 text-[11px] text-ink-4">{m.time || "Just now"}{!customer ? " · ✓✓ Delivered" : ""}</div>
    </div>
  );
}

function Profile({ c, orders, onTag, onReturn, onResolve }: { c: Conv; orders: Order[]; onTag: () => void; onReturn: () => void; onResolve: () => void }) {
  const { toast } = useUI();
  const mine = orders.filter((o) => o.conversationId === c.id || o.customer === c.name);
  const [notes, setNotes] = useState(c.notes || "");
  useEffect(() => setNotes(c.notes || ""), [c.id, c.notes]);
  const expired = windowExpired(c);
  return (
    <div className="space-y-6">
      <div className="text-center"><div className="mx-auto w-fit"><Avatar name={c.name} colour={c.colour} size={64} /></div><h2 className="mt-3 text-lg font-semibold">{c.name}</h2><div className="mt-2 flex justify-center"><ChannelChip type={c.channel} /></div><p className="mt-2 text-sm text-ink-3">{c.phone || "Phone not shared yet"}</p></div>
      <div><div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink-4">Customer tags <button className="normal-case tracking-normal text-brand hover:underline" onClick={onTag}>+ Add</button></div><div className="flex flex-wrap gap-1.5">{c.tags.map((t) => <Badge key={t}>{t}</Badge>)}{!c.tags.length && <span className="text-sm text-ink-3">No tags yet</span>}</div></div>
      <div className="rounded-xl border border-line bg-bg-deep/40 p-4"><div className="text-sm font-semibold">{c.channel === "WhatsApp" ? "WhatsApp free reply window" : "Customer reply window"}</div><div className={clsx("num mt-1 text-sm", expired ? "text-warning" : "text-ink-2")}>{expired ? "Expired · Use a template" : windowRemaining(c)}</div><p className="mt-1.5 text-xs text-ink-3">{c.channel === "WhatsApp" ? "A customer message opens a 24-hour window." : "Provider messaging restrictions may apply. This is a demo indicator."}</p></div>
      <div><div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink-4">Past orders <span className="num">{mine.length}</span></div>
        {mine.length ? mine.map((o) => <Link key={o.id} href={`/app/orders?id=${o.id}`} className="block border-b border-line py-2.5 text-sm last:border-0 hover:text-brand">{o.id} · {money(o.total)}<div className="text-xs text-ink-3">{o.status} · {o.payment}</div></Link>) : <p className="text-sm text-ink-3">No orders yet. Your agent can collect one here.</p>}</div>
      <div><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-4">Customer notes</div><Textarea aria-label="Customer profile notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Helpful context for your team…" /><Button size="sm" className="mt-2 w-full" onClick={() => { updateConversation(c.id, (x) => { x.notes = notes; }); toast("Customer profile notes saved.", "success"); }}>Save notes</Button></div>
      <div className="grid gap-2"><Button onClick={onReturn}>Return to AI</Button><Button onClick={onResolve} disabled={c.status === "Resolved"}>Mark resolved</Button></div>
    </div>
  );
}

function SimulateModal({ open, onClose, onSend, products }: { open: boolean; onClose: () => void; onSend: (t: string) => void; products: Product[] }) {
  const [text, setText] = useState("");
  useEffect(() => { if (open) setText(`${products.find((p) => p.status === "Active")?.name ?? "Red shirt"} price`); }, [open, products]);
  return (
    <Modal open={open} onClose={onClose} title="Be the customer for a moment" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!text.trim()} onClick={() => onSend(text.trim())}>Deliver message</Button></>}>
      <p className="mb-4 text-sm text-ink-2">Add a simulated incoming message to the selected conversation. Your agent replies only when it is live, the channel is connected and AI is handling the thread.</p>
      <Field label="Customer message"><Input value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <div className="mt-4 rounded-lg border border-line bg-bg-deep/40 p-3.5 text-[13px] text-ink-3">To test an order, send “I want to order [product]”, then the requested name, phone, address, quantity and variant details one message at a time.</div>
    </Modal>
  );
}

function QuickModal({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (t: string) => void }) {
  return (
    <Modal open={open} onClose={onClose} title="A helpful starting point" size="sm">
      <p className="mb-3 text-sm text-ink-2">Select a quick reply, then edit it in the composer.</p>
      <div className="grid gap-2">{["Thanks for reaching out! How can we help?", "ঢাকায় ১–২ দিন, ঢাকার বাইরে ২–৪ দিনে ডেলিভারি।", "We accept bKash, Nagad, card and Cash on Delivery.", "Could you share your order number?"].map((s) => <button key={s} onClick={() => onPick(s)} className="rounded-lg border border-line px-4 py-3 text-left text-sm hover:border-brand hover:bg-brand-soft">{s}</button>)}</div>
    </Modal>
  );
}

function SuggestModal({ open, onClose, conv, onUse }: { open: boolean; onClose: () => void; conv?: Conv; onUse: (t: string) => void }) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!open || !conv) return;
    const latest = conv.messages.filter((m) => m.role === "customer").at(-1);
    setText(MockAgent.reply({ message: latest?.text || "hello", channel: conv.channel, conversationState: {} }).text);
  }, [open, conv]);
  return (
    <Modal open={open} onClose={onClose} title="AI-suggested reply" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => onUse(text)}>Use this draft</Button></>}>
      <p className="mb-3 text-sm text-ink-2">Review and edit before sending. This is a local suggestion drawn from your catalog and knowledge.</p>
      <Field label="Reply draft"><Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} /></Field>
    </Modal>
  );
}

function TemplateModal({ open, onClose, conv, templates, onSent }: { open: boolean; onClose: () => void; conv?: Conv; templates: Template[]; onSent: (text: string, name: string) => void }) {
  const { toast } = useUI();
  const list = templates.filter((t) => t.status === "Approved" && t.category !== "Authentication");
  const [id, setId] = useState("");
  const [vals, setVals] = useState<Record<string, string>>({});
  const [optin, setOptin] = useState(false);
  const chosen = list.find((t) => t.id === id) ?? list[0];
  useEffect(() => { if (open) { setId(list[0]?.id ?? ""); setOptin(false); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const vars = chosen ? [...new Set([...chosen.text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => m[1]))] : [];
  useEffect(() => { if (chosen && conv) setVals(Object.fromEntries(vars.map((v, i) => [v, i === 0 ? conv.name : i === 1 ? "SP-1042" : "Dhaka Threads"]))); }, [chosen?.id, conv?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const preview = chosen ? vars.reduce((t, v) => t.replaceAll(`{{${v}}}`, vals[v] || `{{${v}}}`), chosen.text) : "";
  if (!list.length) return <Modal open={open} onClose={onClose} title="No approved templates"><EmptyState title="A template is needed" text="This workspace has no approved Utility or Marketing templates available." /></Modal>;
  return (
    <Modal open={open} onClose={onClose} title="Send an approved WhatsApp template" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => { if (!optin) return toast("Confirm the customer opt-in before sending.", "warning"); if (vars.some((v) => !vals[v]?.trim())) return toast("Fill every template variable.", "warning"); onSent(preview, chosen!.name); }}>Send template</Button></>}>
      <p className="mb-4 text-sm text-ink-2">The free-text window has expired. A template requires customer opt-in and does not reopen that window.</p>
      <div className="space-y-4">
        <Field label="Approved template"><Select value={chosen?.id} onChange={(e) => setId(e.target.value)}>{list.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.category}</option>)}</Select></Field>
        {vars.map((v) => <Field key={v} label={`Variable {{${v}}}`}><Input value={vals[v] ?? ""} onChange={(e) => setVals((s) => ({ ...s, [v]: e.target.value }))} /></Field>)}
        <div className="rounded-lg border border-line bg-bg-deep/50 p-4 text-sm">{preview}</div>
        <Checkbox checked={optin} onChange={setOptin} label="Customer has opted in to this business message." />
      </div>
    </Modal>
  );
}

function TagModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (t: string) => void }) {
  const [tag, setTag] = useState("");
  useEffect(() => { if (open) setTag(""); }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="Add a customer tag" size="sm" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={tag.trim().length < 2} onClick={() => onAdd(tag.trim())}>Add tag</Button></>}>
      <Field label="Tag"><Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. VIP, Bulk buyer" autoFocus /></Field>
    </Modal>
  );
}
