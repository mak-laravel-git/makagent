"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, MailWarning, Radio, Webhook } from "lucide-react";
import { Badge, Button, Card, CardHeader, ChannelChip, EmptyState, Modal, PageHeader, Select, Stat, StatusBadge, Table, Td, Th } from "@/components/ui";
import { LineSeries } from "@/components/charts/charts";
import { audit, type AdminChannel } from "@/lib/admin";
import { store, useStore } from "@/lib/store";
import { useUI } from "@/components/providers";

export default function AdminChannels() {
  const { toast } = useUI();
  const channels = useStore<AdminChannel[]>("admin.channels", []);
  const metrics = useStore<any[]>("admin.systemMetrics", []);
  const [filter, setFilter] = useState("All");
  const [type, setType] = useState("All types");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState(false);

  const rows = useMemo(() => channels.filter((c) => (filter === "All" || c.health === filter) && (type === "All types" || c.type === type)), [channels, filter, type]);
  const count = (h: string) => channels.filter((c) => c.health === h).length;
  const oauth = channels.filter((c) => c.oauthError === 190);
  const chosen = channels.filter((c) => sel.has(c.id));
  const toggle = (id: string, on: boolean) => setSel((s) => { const n = new Set(s); on ? n.add(id) : n.delete(id); return n; });

  const fix = (c: AdminChannel) => { store.update<AdminChannel[]>("admin.channels", (cs) => { const x = cs.find((k) => k.id === c.id)!; Object.assign(x, { health: "Active", tokenHealth: "Healthy", oauthError: undefined, webhook: true, bot: true, lastEvent: "Just now" }); }); audit("Channel restored", c.clientId, `${c.type} ${c.name} marked healthy after owner re-authorisation (demo).`); toast("Channel marked healthy.", "success"); };

  return (
    <>
      <PageHeader eyebrow="Platform · Admin" title="Every channel, across every client." description="Spot expiring tokens and failing webhooks before customers notice." actions={<Button icon={<MailWarning className="size-4" />} disabled={!sel.size} onClick={() => setNotice(true)}>Reconnect notice ({sel.size})</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="All channels" value={channels.length} icon={<Radio className="size-4" />} />
        <Stat label="Active" value={count("Active")} hint="healthy" />
        <Stat label="Needs reconnect" value={count("Needs reconnect")} hint="OAuth 190" icon={<AlertTriangle className="size-4" />} accent />
        <Stat label="Webhook failing" value={count("Webhook failing")} icon={<Webhook className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card><CardHeader title="Webhook delivery success" description="Illustrative platform-wide success rate, last 30 days" /><div className="p-5"><LineSeries data={metrics.slice(-30).map((m) => ({ label: m.date.slice(5), "Success %": m.webhookSuccess }))} series={[{ key: "Success %", color: "#3ccf91" }]} height={240} /></div></Card>
        <Card><CardHeader title="OAuth error 190" description="Tokens that expired or were revoked" />
          {oauth.length ? oauth.map((c) => <div key={c.id} className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5 last:border-0"><div><div className="text-sm font-medium">{c.client}</div><div className="text-xs text-ink-3">{c.type} · {c.lastEvent}</div></div><Button size="sm" onClick={() => fix(c)}>Mark restored</Button></div>) : <EmptyState title="No expired tokens" text="Every connected account is healthy." />}</Card>
      </div>

      <div className="mb-4 mt-8 flex flex-wrap gap-2.5">
        <Select aria-label="Health" className="w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>{["All", "Active", "Needs reconnect", "Webhook failing"].map((v) => <option key={v}>{v}</option>)}</Select>
        <Select aria-label="Type" className="w-auto" value={type} onChange={(e) => setType(e.target.value)}>{["All types", "Facebook", "Instagram", "WhatsApp"].map((v) => <option key={v}>{v}</option>)}</Select>
      </div>
      <Card>
        {rows.length === 0 ? <EmptyState title="No channels match" /> : (
          <Table><thead><tr><Th className="w-10" /><Th>Client</Th><Th>Channel</Th><Th>Health</Th><Th>Token</Th><Th>Webhook</Th><Th>Last event</Th></tr></thead>
            <tbody>{rows.map((c) => <tr key={c.id}><Td><input type="checkbox" aria-label={`Select ${c.client} ${c.type}`} className="accent-[var(--brand)]" checked={sel.has(c.id)} onChange={(e) => toggle(c.id, e.target.checked)} /></Td><Td className="font-medium text-ink">{c.client}</Td><Td><div className="flex items-center gap-2"><ChannelChip type={c.type} compact />{c.name}</div></Td><Td><StatusBadge status={c.health === "Active" ? "Connected" : c.health} /></Td><Td>{c.tokenHealth}</Td><Td>{c.webhook ? <Badge tone="success">Subscribed</Badge> : <Badge tone="danger">Failing</Badge>}</Td><Td className="text-ink-3">{c.lastEvent}</Td></tr>)}</tbody></Table>
        )}
      </Card>

      <Modal open={notice} onClose={() => setNotice(false)} title="Preview a reconnect notice" footer={<><Button variant="ghost" onClick={() => setNotice(false)}>Close</Button><Button variant="primary" onClick={() => { chosen.forEach((c) => audit("Reconnect notice previewed", c.clientId, `${c.type} notice preview; no email sent.`)); toast("Notice preview recorded. No email sent.", "success"); setNotice(false); setSel(new Set()); }}>Record demo notice</Button></>}>
        <p className="mb-3 text-sm text-ink-2">Recipients ({chosen.length}): {[...new Set(chosen.map((c) => c.client))].join(", ")}</p>
        <div className="rounded-xl border border-line bg-bg-deep/50 p-4 text-sm"><strong>Subject: Please reconnect your {[...new Set(chosen.map((c) => c.type))].join(" / ")} account</strong><p className="mt-2 text-ink-2">Hello, your channel connection needs re-authorisation so your AI agent can keep replying. Sign in and choose Channels → Reconnect. Existing conversations are safe.</p></div>
        <p className="mt-3 text-xs text-ink-3">No email is sent. Recording the preview adds audit entries only.</p>
      </Modal>
    </>
  );
}
