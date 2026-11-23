"use client";

import Link from "next/link";
import { useState } from "react";
import { ListChecks, Plug, Plus, RotateCw, Search, ShieldCheck, Webhook } from "lucide-react";
import { Badge, Button, Card, ChannelChip, EmptyState, Input, Modal, PageHeader, Select, StatusBadge, Switch } from "@/components/ui";
import { store, useStore } from "@/lib/store";
import { useConnect } from "@/components/app/connect";
import { useUI } from "@/components/providers";
import type { Channel, Template } from "@/lib/data";

export default function ChannelsPage() {
  const { toast } = useUI();
  const connect = useConnect();
  const channels = useStore<Channel[]>("channels", []);
  const demo = useStore<any>("demo", {});
  const client = useStore<any>("client", {});
  const templates = useStore<Template[]>("templates", []);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [add, setAdd] = useState(false);
  const [tpl, setTpl] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const rows = channels
    .filter((c) => (c.name + " " + c.type).toLowerCase().includes(query.toLowerCase()))
    .filter((c) => filter === "All" || (filter === "Needs reconnect" ? (demo.tokenExpired && c.type === "Facebook") || c.status === "Needs reconnect" : c.status === filter));

  const testWebhook = (id: string) => {
    setTesting(id);
    setTimeout(() => { store.patch("channels", id, { lastEvent: "Just now", lastWebhook: new Date().toISOString(), webhook: true }); setTesting(null); toast("Demo webhook received · HTTP 200.", "success"); }, 600);
  };

  return (
    <>
      <PageHeader title="Every channel. One connected business." description="Keep your business accounts healthy, and your customers within reach."
        actions={<><Button href="/app/connections" icon={<Plug className="size-4" />}>Real connections</Button><Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setAdd(true)}>Add a channel</Button></>} />
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] max-w-sm flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" /><Input aria-label="Search channels" placeholder="Search accounts, numbers or channels…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" /></div>
        <Select aria-label="Channel status" className="w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>{["All", "Connected", "Needs reconnect", "Not connected"].map((v) => <option key={v}>{v}</option>)}</Select>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {rows.map((c) => {
          const expired = (demo.tokenExpired && c.type === "Facebook") || c.status === "Needs reconnect";
          const connected = c.status === "Connected" && !expired;
          return (
            <Card key={c.id} className="flex flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <div><ChannelChip type={c.type} /><h2 className="mt-3 text-lg font-semibold tracking-tight">{c.name || `${c.type} business`}</h2><p className="text-[13px] text-ink-3">{c.type === "WhatsApp" ? (c as any).displayName || client.name : `Business account · ${client.name}`}</p></div>
                {expired ? <Badge tone="warning" dot>Needs reconnect</Badge> : <StatusBadge status={c.status} />}
              </div>
              {expired && <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-[13px] text-danger">OAuth error 190 · Your demo token expired. Reconnect to restore access.</div>}
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                {([
                  ["Token health", expired ? "Expired" : c.tokenHealth || "Not authorised"],
                  ["Last webhook event", c.lastEvent || "No events yet"],
                  ["Webhook subscription", c.webhook && connected ? "✓ Subscribed" : "Not active"],
                  [c.type === "Instagram" ? "Message access" : "Connection type", c.type === "Instagram" ? (c.messageAccess ? "✓ Enabled" : "! Setup needed") : c.type === "WhatsApp" ? "Embedded Signup" : "Page authorisation"],
                  ...(c.type === "WhatsApp" ? [["Quality rating", c.quality || "High"], ["Messaging tier", `${c.tier || 1000} / day`], ["Display name review", c.displayNameStatus || "Pending"], ["Business name", (c as any).displayName || client.name]] : []),
                ] as [string, string][]).map(([k, v]) => <div key={k}><dt className="text-xs text-ink-4">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>)}
              </dl>
              <label className="mt-5 flex items-center justify-between rounded-xl border border-line bg-bg-deep/40 p-4"><span className="text-sm font-medium">AI replies {c.bot && connected ? "on" : "paused"}<span className="block text-xs font-normal text-ink-3">Manage automated replies for this account.</span></span><Switch checked={!!c.bot && connected} disabled={!connected} label={`AI replies for ${c.name}`} onChange={(v) => { store.patch("channels", c.id, { bot: v }); toast(v ? "AI replies enabled for this channel." : "AI replies paused for this channel.", "info"); }} /></label>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" variant={connected ? "secondary" : "primary"} icon={<RotateCw className="size-3.5" />} onClick={() => connect.reconnect(c.id)}>{connected ? "Re-authorise" : "Reconnect"}</Button>
                {connected && <Button size="sm" loading={testing === c.id} icon={<Webhook className="size-3.5" />} onClick={() => testWebhook(c.id)}>Test webhook</Button>}
                {c.type === "Instagram" && <Button size="sm" icon={<ListChecks className="size-3.5" />} onClick={() => connect.instagram(undefined, c.id)}>Setup checklist</Button>}
                {c.type === "WhatsApp" && <Button size="sm" onClick={() => setTpl(true)}>View templates</Button>}
                <Button size="sm" variant="ghost" className="text-danger hover:!text-danger" disabled={c.status === "Not connected"} onClick={() => connect.disconnect(c.id)}>Disconnect</Button>
              </div>
              <p className="mt-auto pt-5 text-xs text-ink-4">{c.type === "WhatsApp" ? "Provider limits and quality are illustrative. Outside the reply window, use an approved template with customer opt-in." : "Only authorised business assets are accessed. All permissions and events here are simulated."}</p>
            </Card>
          );
        })}
        {!rows.length && <Card className="lg:col-span-2 xl:col-span-3"><EmptyState title="No matching channels" text="Try another search or add your business account." /></Card>}
      </div>

      <Card className="mt-6 flex items-start gap-4 p-6"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" /><div><h3 className="font-semibold">Your accounts. Your control.</h3><p className="mt-1 text-sm text-ink-3">Connecting is a local simulation. No real credentials, Meta tokens or customer messages are transmitted. Disconnecting pauses new events but keeps your existing demo conversations and orders.</p></div></Card>

      <Modal open={add} onClose={() => setAdd(false)} title="Connect another business channel" size="sm">
        <p className="mb-4 text-sm text-ink-2">Select a business account type. You’ll review permissions before the local connection is added.</p>
        <div className="grid gap-2">{[["Facebook", "Facebook Page"], ["Instagram", "Instagram Business"], ["WhatsApp", "WhatsApp Business"]].map(([t, l]) => <button key={t} onClick={() => { setAdd(false); t === "WhatsApp" ? connect.whatsapp(undefined, { add: true }) : t === "Instagram" ? connect.instagram() : connect.facebook(); }} className="flex items-center gap-3 rounded-xl border border-line p-4 text-left hover:border-brand hover:bg-brand-soft"><ChannelChip type={t} compact /><span className="font-medium">{l}</span></button>)}</div>
      </Modal>
      <Modal open={tpl} onClose={() => setTpl(false)} title="WhatsApp message templates" footer={<><Button variant="ghost" onClick={() => setTpl(false)}>Done</Button><Button href="/app/templates" variant="primary">Manage templates</Button></>}>
        {templates.map((t) => <div key={t.id} className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-0"><div><div className="font-medium">{t.name}</div><div className="text-[13px] text-ink-3">{t.text}</div></div><StatusBadge status={t.status} /></div>)}
        {!templates.length && <p className="text-sm text-ink-3">No templates yet. <Link href="/app/templates" className="text-brand">Create one</Link>.</p>}
      </Modal>
    </>
  );
}
