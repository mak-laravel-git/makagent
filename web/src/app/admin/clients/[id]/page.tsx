"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Eye, KeyRound, Trash2 } from "lucide-react";
import { Avatar, Badge, Button, Card, CardHeader, Checkbox, ChannelChip, EmptyState, Field, Input, Modal, PageHeader, Progress, Select, Stat, StatusBadge, Tabs, Textarea, Drawer } from "@/components/ui";
import { ReasonModal } from "@/components/app/reason-modal";
import { audit, fmtDate, mrrOf, planOf, usageOf, type AdminChannel } from "@/lib/admin";
import { store, uid, useStore, money } from "@/lib/store";
import { useUI } from "@/components/providers";
import { SEED, type Client, type Plan } from "@/lib/data";

export default function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useUI();
  const clients = useStore<Client[]>("admin.clients", []);
  const plans = useStore<Plan[]>("plans", []);
  const channels = useStore<AdminChannel[]>("admin.channels", []);
  const log = useStore<any[]>("admin.auditLog", []);
  const [tab, setTab] = useState("Profile");
  const [modal, setModal] = useState<null | "plan" | "trial" | "suspend" | "reconnect" | "delete" | "impersonate">(null);
  const [planId, setPlanId] = useState("growth");
  const [days, setDays] = useState(7);
  const [typed, setTyped] = useState("");
  const [note, setNote] = useState("");
  const [ack, setAck] = useState(false);
  const [readReason, setReadReason] = useState("");
  const [access, setAccess] = useState(false);
  const [thread, setThread] = useState<any>(null);

  const c = clients.find((x) => x.id === id);
  if (!c) return (<><PageHeader title="That workspace could not be found." description="Choose a client from the directory." actions={<Button href="/admin/clients" variant="primary">Back to clients</Button>} /><Card><EmptyState icon={<Building2 className="size-5" />} title="Unknown client ID" text="No client record matches this address." /></Card></>);

  const deleted = c.status === "Deleted";
  const p = planOf(c);
  const u = usageOf(c);
  const mine = channels.filter((x) => x.clientId === id);
  const events = log.filter((a) => a.clientId === id);
  const convs = SEED.conversations.slice(0, 8);

  const patch = (v: Partial<Client>) => store.patch("admin.clients", id, v);

  const impersonate = (reason: string) => {
    const original = store.get<any>("session");
    store.set("impersonation", { original, originalClient: store.get("client"), returnTo: `/admin/clients/${id}` });
    store.update<any>("client", (cl) => Object.assign(cl, { name: c.name, owner: c.owner, email: c.email, plan: c.plan, status: c.status }));
    store.set("session", { ...original, role: "client", impersonating: true, clientId: id });
    audit("Impersonated client", id, `Support session started. ${reason}`);
    router.push("/app/overview");
  };

  return (
    <>
      <PageHeader eyebrow="Client workspace · Admin" title="A little context. Better support." description="Inspect the workspace, explain each action, and leave a clear trail."
        actions={<><Button href="/admin/clients" icon={<ArrowLeft className="size-4" />}>All clients</Button>{!deleted && <Button variant="primary" icon={<Eye className="size-4" />} onClick={() => setModal("impersonate")}>Impersonate client</Button>}</>} />

      <Card className="mb-6 flex flex-wrap items-center justify-between gap-5 p-6">
        <div className="flex items-center gap-4"><Avatar name={c.name} colour="#dce6f4" size={56} /><div><h2 className="text-2xl font-bold tracking-tight">{c.name}</h2><p className="text-sm text-ink-3">{c.owner} · {c.email}<br />{c.category} · {c.id}</p></div></div>
        <div className="flex flex-wrap gap-2"><StatusBadge status={c.status} /><Badge tone="info">{c.plan}</Badge><StatusBadge status={c.health} /></div>
      </Card>

      {deleted ? <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">This client workspace has been deleted. Customer records and support notes are erased. Fictional financial history and sensitive-action audit records are retained.</div> : (
        <div className="mb-6 flex flex-wrap gap-2.5"><Button onClick={() => setModal("plan")}>Change plan</Button><Button onClick={() => setModal("trial")}>Extend trial</Button><Button onClick={() => setModal("suspend")}>{c.status === "Suspended" ? "Reactivate client" : "Suspend client"}</Button><Button onClick={() => setModal("reconnect")}>Force reconnect</Button><Button variant="danger" icon={<Trash2 className="size-4" />} onClick={() => { setTyped(""); setModal("delete"); }}>Delete client</Button></div>
      )}

      <div className="mb-6"><Tabs value={tab} onChange={setTab} options={(deleted ? ["Profile", "Notes & timeline"] : ["Profile", "Channels", "Usage", "Conversations", "Notes & timeline"]).map((t) => ({ value: t, label: t }))} /></div>

      {tab === "Profile" && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card><CardHeader title="Business profile" description="Saved client identity and local support context." />
            <dl className="grid gap-5 p-6 sm:grid-cols-2">{[["Owner", c.owner], ["Business email", c.email || "Erased"], ["Category", c.category], ["Channels connected", String(u.channels)], ["Last active", c.lastActive], ["Client ID", c.id]].map(([k, v]) => <div key={k}><dt className="text-xs uppercase tracking-wider text-ink-4">{k}</dt><dd className="mt-1 font-medium">{v}</dd></div>)}</dl>
            <p className="border-t border-line px-6 py-4 text-[13px] text-ink-3">Profile details are read-only here. Impersonation is the explicit, audited route for support changes inside a client workspace.</p></Card>
          <Card><CardHeader title="Subscription" description={`${c.plan} · monthly billing`} />
            <div className="divide-y divide-line text-sm">{[["Monthly recurring revenue", money(Math.round(mrrOf(c)))], ["Trial end", fmtDate(c.trialEnds)], ["Conversation limit", (p?.conversations ?? 0).toLocaleString()], ["Channels / team seats", `${p?.channels ?? 0} / ${p?.seats ?? 0}`]].map(([k, v]) => <div key={k} className="flex justify-between px-6 py-3.5"><span className="text-ink-3">{k}</span><strong className="num">{v}</strong></div>)}</div>
            <div className="p-5"><Button href="/admin/billing" className="w-full">View billing</Button></div></Card>
        </div>
      )}

      {tab === "Channels" && (
        <Card><CardHeader title="Authorised business channels" description="Tokens are deliberately redacted demo markers, not stored API credentials." />
          {mine.length ? mine.map((ch) => (
            <div key={ch.id} className="border-b border-line p-6 last:border-0">
              <div className="flex items-center justify-between"><div className="flex items-center gap-3"><ChannelChip type={ch.type} /><strong>{ch.name}</strong></div><StatusBadge status={ch.health === "Active" ? "Connected" : ch.health} /></div>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-bg-deep/60 px-3 py-2 font-mono text-xs text-ink-3"><KeyRound className="size-3.5" /> DEMO •••• •••• · {ch.tokenHealth}</div>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-4">{[["Webhook", ch.webhook ? "Subscribed" : "Not active"], ["AI replies", ch.bot ? "On" : "Paused"], ["Last event", ch.lastEvent], ["Diagnosis", ch.oauthError ? "OAuth 190 · re-authorisation needed" : "No token error"]].map(([k, v]) => <div key={k}><dt className="text-xs text-ink-4">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>)}</dl>
            </div>
          )) : <EmptyState title="No connected accounts" text="This workspace has no saved business-channel records." />}
        </Card>
      )}

      {tab === "Usage" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Conversations" value={u.used.toLocaleString()} hint="illustrative metered count" /><Stat label="Usage" value={`${u.percent}%`} hint={`${u.limit.toLocaleString()} allowance`} accent /><Stat label="LLM tokens" value={c.llmTokens.toLocaleString()} hint="illustrative monthly" /><Stat label="Provider costs" value={money(c.llmCost + c.whatsappCost)} hint="LLM + WhatsApp" /></div>
          <Card className="mt-6"><CardHeader title="Allowance and operating context" description="Metering examples are not real API counts or charges." />
            <div className="space-y-5 p-6">{([["Conversations", u.used, p?.conversations ?? 0], ["Connected channels", u.channels, p?.channels ?? 0], ["Team seats", u.seats, p?.seats ?? 0]] as [string, number, number][]).map(([k, used, lim]) => <div key={k}><div className="mb-2 flex justify-between text-sm"><strong className="font-medium">{k}</strong><span className="num text-ink-3">{used} / {lim}{used > lim && " · over limit"}</span></div><Progress value={(used / Math.max(1, lim)) * 100} tone={used > lim ? "warning" : "brand"} /></div>)}
              <div className="flex justify-between border-t border-line pt-4 text-sm"><span className="text-ink-3">Monthly gross margin estimate</span><strong className="num">{mrrOf(c) ? Math.round(((mrrOf(c) - c.llmCost - c.whatsappCost) / mrrOf(c)) * 100) + "%" : "No recurring revenue"}</strong></div></div></Card>
        </>
      )}

      {tab === "Conversations" && (
        <Card><CardHeader title="Private customer conversations" description="Support access must be justified. These are fictional records, but the workflow models production privacy expectations." />
          {!access ? (
            <div className="space-y-5 p-6"><div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">Do not access message contents casually. Review only the minimum needed for a support request. No sending or editing is available in this admin view.</div>
              <Checkbox checked={ack} onChange={setAck} label="I have a legitimate support reason to inspect these messages." />
              <Field label="Support reason"><Input value={readReason} onChange={(e) => setReadReason(e.target.value)} placeholder="e.g. TK-201: diagnose missing replies" /></Field>
              <Button variant="primary" onClick={() => { if (!ack) return toast("Acknowledge the privacy notice first.", "warning"); if (readReason.trim().length < 5) return toast("Explain the support reason in at least five characters.", "warning"); audit("Viewed client conversations", id, `Read-only support access. ${readReason}`); setAccess(true); }}>Load read-only conversations</Button></div>
          ) : (
            <>
              <div className="border-b border-line bg-brand-soft px-6 py-3 text-sm">Read-only access for: {readReason} · Access is audited.</div>
              {convs.map((cv) => <div key={cv.id} className="flex items-center justify-between gap-4 border-b border-line px-6 py-4 last:border-0"><div><strong className="text-sm">{cv.name}</strong><div className="text-xs text-ink-3">{cv.phone.replace(/\d(?=\D*\d{4})/g, "•")} · {cv.status}</div><div className="mt-1.5"><ChannelChip type={cv.channel} /></div></div><Button size="sm" onClick={() => { audit("Read conversation", id, `${cv.id}. ${readReason}`); setThread(cv); }}>Read thread</Button></div>)}
            </>
          )}
        </Card>
      )}

      {tab === "Notes & timeline" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader title="Internal support notes" description="Visible to the platform team, not the business owner." />
            <div className="p-6">{!deleted && <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!note.trim()) return; store.update<Client[]>("admin.clients", (cs) => { cs.find((x) => x.id === id)!.notes.push({ id: uid(), text: note.trim(), who: "Arman Kabir", at: new Date().toISOString() } as any); }); audit("Added support note", id, "Internal admin note saved."); setNote(""); toast("Internal support note saved.", "success"); }}><Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should the next teammate know?" /><Button type="submit" variant="primary">Save internal note</Button></form>}
              <div className="mt-5 space-y-3">{(c.notes as any[]).slice().reverse().map((n, i) => <div key={n.id || i} className="rounded-xl border border-line bg-bg-deep/40 p-4 text-sm"><p className="whitespace-pre-wrap">{n.text || n}</p><div className="mt-2 flex items-center justify-between text-xs text-ink-3"><span>{n.who || "Admin"} · {n.at ? fmtDate(n.at) : ""}</span>{n.id && <button aria-label="Remove note" onClick={() => { store.update<Client[]>("admin.clients", (cs) => { const x = cs.find((k) => k.id === id)!; x.notes = (x.notes as any[]).filter((m) => m.id !== n.id) as any; }); audit("Removed support note", id, "Internal note removed."); }} className="hover:text-danger"><Trash2 className="size-3.5" /></button>}</div></div>)}</div></div></Card>
          <Card><CardHeader title="A clear trail of what changed" description="New local actions first." />
            <div className="scroll-y max-h-[560px] divide-y divide-line">{events.map((a) => <article key={a.id} className="px-6 py-4"><strong className="text-sm">{a.action}</strong><p className="text-sm text-ink-2">{a.details}</p><small className="text-xs text-ink-3">{a.who} · {fmtDate(a.date)} · {new Date(a.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" })}</small></article>)}{!events.length && <p className="p-6 text-sm text-ink-3">No sensitive actions are recorded for this workspace yet.</p>}</div></Card>
        </div>
      )}

      <ReasonModal open={modal === "impersonate"} onClose={() => setModal(null)} title={`Impersonate ${c.name}`} confirmLabel="Start support session" onConfirm={impersonate}><p className="text-sm text-ink-2">You will enter this client’s workspace with a visible support banner. Every action is audited. Use “Exit impersonation” to return here.</p></ReasonModal>
      <ReasonModal open={modal === "plan"} onClose={() => setModal(null)} title={`Change plan for ${c.name}`} onConfirm={(reason) => { const np = plans.find((x) => x.id === planId); if (!np) return false; patch({ plan: np.name, status: c.status === "Suspended" ? "Suspended" : np.id === "trial" ? "Trial" : "Active", mrr: np.monthly }); audit("Changed plan", id, `${c.plan} → ${np.name}. ${reason}`); toast("Plan changed.", "success"); }}><Field label="New plan"><Select value={planId} onChange={(e) => setPlanId(e.target.value)}>{plans.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field></ReasonModal>
      <ReasonModal open={modal === "trial"} onClose={() => setModal(null)} title="Extend trial" onConfirm={(reason) => { const d = new Date(c.trialEnds + "T12:00:00"); d.setDate(d.getDate() + days); patch({ trialEnds: d.toISOString().slice(0, 10), status: "Trial" }); audit("Extended trial", id, `Trial extended by ${days} days. ${reason}`); toast("Trial extended.", "success"); }}><Field label="Extra days"><Select value={days} onChange={(e) => setDays(+e.target.value)}>{[3, 7, 14, 30].map((n) => <option key={n} value={n}>{n} days</option>)}</Select></Field></ReasonModal>
      <ReasonModal open={modal === "suspend"} onClose={() => setModal(null)} title={c.status === "Suspended" ? "Reactivate client" : "Suspend client"} danger={c.status !== "Suspended"} confirmLabel={c.status === "Suspended" ? "Reactivate" : "Suspend"} onConfirm={(reason) => { const next = c.status === "Suspended" ? (c.plan === "Free Trial" ? "Trial" : "Active") : "Suspended"; patch({ status: next }); audit(next === "Suspended" ? "Suspended client" : "Reactivated client", id, reason); toast(`Client ${next === "Suspended" ? "suspended" : "reactivated"}.`, "success"); }}><p className="text-sm text-ink-2">{c.status === "Suspended" ? "The client regains access to their workspace." : "The client is signed out and blocked from their workspace until reactivated."}</p></ReasonModal>
      <ReasonModal open={modal === "reconnect"} onClose={() => setModal(null)} title="Force reconnect" onConfirm={(reason) => { store.update<AdminChannel[]>("admin.channels", (cs) => cs.filter((x) => x.clientId === id).forEach((x) => Object.assign(x, { health: "Needs reconnect", tokenHealth: "Expired", oauthError: 190, bot: false }))); patch({ health: "Needs reconnect" }); audit("Forced reconnect", id, `Expired OAuth token (190). ${reason}`); toast("All channels flagged for reconnect.", "success"); }}><p className="text-sm text-ink-2">Marks every channel as expired so the owner is prompted to re-authorise. Local flags only — no provider token is touched.</p></ReasonModal>
      <ReasonModal open={modal === "delete"} onClose={() => setModal(null)} title={`Delete ${c.name}`} danger confirmLabel="Delete client" onConfirm={(reason) => { if (typed !== c.name) { toast("Type the exact business name to confirm.", "warning"); return false; } patch({ status: "Deleted", email: "", notes: [] as any, health: "Deleted" }); audit("Deleted client", id, `Workspace erased. ${reason}`); toast("Client deleted.", "success"); setTab("Profile"); }}>
        <p className="text-sm text-ink-2">This erases customer records and support notes. Fictional financial history and audit entries are kept. Type <strong className="text-ink">{c.name}</strong> to confirm.</p><Input value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Type the business name" />
      </ReasonModal>
      <Drawer open={!!thread} onClose={() => setThread(null)} title={thread ? `${thread.name} · Read-only support view` : ""} footer={<Button variant="primary" onClick={() => setThread(null)}>Done</Button>}>
        {thread && <div className="space-y-4"><div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-[13px] text-warning">Fictional customer data. Read-only preview; no message composer, customer contact or real API access.</div><ChannelChip type={thread.channel} />{thread.messages.map((m: any) => <div key={m.id} className="rounded-xl border border-line p-4"><strong className="text-[13px]">{m.role === "customer" ? thread.name : `Nila · ${m.role}`}</strong><p className="mt-1 whitespace-pre-wrap text-sm text-ink-2">{m.text}</p><small className="text-xs text-ink-4">{m.time}</small></div>)}</div>}
      </Drawer>
    </>
  );
}
