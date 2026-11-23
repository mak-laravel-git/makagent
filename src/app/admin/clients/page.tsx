"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Banknote, Building2, CheckCircle2, ChevronLeft, ChevronRight, Download, Search, ShieldAlert } from "lucide-react";
import { Avatar, Badge, Button, Card, EmptyState, Input, Modal, PageHeader, Select, Stat, StatusBadge, Table, Td, Th, Progress, Field } from "@/components/ui";
import { audit, mrrOf, usageOf } from "@/lib/admin";
import { store, useStore, money, download, toCsv } from "@/lib/store";
import { ReasonModal } from "@/components/app/reason-modal";
import { useUI } from "@/components/providers";
import type { Client, Plan } from "@/lib/data";

const SIZE = 6;

export default function ClientsPage() {
  return <Suspense><Clients /></Suspense>;
}

function Clients() {
  const params = useSearchParams();
  const { toast } = useUI();
  const all = useStore<Client[]>("admin.clients", []);
  const plans = useStore<Plan[]>("plans", []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [plan, setPlan] = useState("All plans");
  const [health, setHealth] = useState(params.get("health") || "All health");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<null | "plan" | "notice">(null);
  const [target, setTarget] = useState("growth");

  const rows = useMemo(() => all
    .filter((c) => (status === "Deleted" ? c.status === "Deleted" : c.status !== "Deleted" && (status === "All statuses" || c.status === status)))
    .filter((c) => plan === "All plans" || c.plan === plan)
    .filter((c) => health === "All health" || c.health === health)
    .filter((c) => (c.name + " " + c.email + " " + c.owner + " " + c.id).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === "usage" ? usageOf(b).percent - usageOf(a).percent : sort === "mrr" ? mrrOf(b) - mrrOf(a) : sort === "health" ? a.healthScore - b.healthScore : a.name.localeCompare(b.name)), [all, query, status, plan, health, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / SIZE));
  const pg = Math.min(page, pages);
  const visible = rows.slice((pg - 1) * SIZE, pg * SIZE);
  const live = all.filter((c) => c.status !== "Deleted");

  const exportRows = (list: Client[]) => download("admin-clients.csv", toCsv(list.map((c) => ({ id: c.id, business: c.name, owner: c.owner, email: c.email, plan: c.plan, status: c.status, mrr: mrrOf(c), channels: c.channelsConnected, usage_pct: usageOf(c).percent, health: c.health }))));
  const chosen = all.filter((c) => sel.has(c.id) && c.status !== "Deleted");

  const bulkPlan = (reason: string) => {
    const p = plans.find((x) => x.id === target); if (!p) return false;
    chosen.forEach((c) => { store.patch("admin.clients", c.id, { plan: p.name, status: c.status === "Suspended" ? "Suspended" : p.id === "trial" ? "Trial" : "Active", mrr: p.monthly }); audit("Bulk plan change", c.id, `${p.name}. ${reason}`); });
    toast("Selected client plans updated.", "success");
  };

  return (
    <>
      <PageHeader eyebrow="Your clients · Admin" title="Good businesses. A little more support." description="Find the workspace, understand its health, and act with context." actions={<Button icon={<Download className="size-4" />} onClick={() => exportRows(rows)}>Export clients</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Client workspaces" value={live.length} icon={<Building2 className="size-4" />} />
        <Stat label="Active & trial" value={live.filter((c) => ["Active", "Trial"].includes(c.status)).length} icon={<CheckCircle2 className="size-4" />} />
        <Stat label="Need attention" value={live.filter((c) => c.health !== "Healthy").length} icon={<ShieldAlert className="size-4" />} accent />
        <Stat label="MRR snapshot" value={money(Math.round(all.reduce((n, c) => n + mrrOf(c), 0)))} icon={<Banknote className="size-4" />} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <div className="relative min-w-[240px] flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" /><Input type="search" aria-label="Search clients" placeholder="Search business, owner, email or ID…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} className="pl-10" /></div>
        <Select aria-label="Client status" className="w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>{["All statuses", "Active", "Trial", "Suspended", "Churned", "Deleted"].map((v) => <option key={v}>{v}</option>)}</Select>
        <Select aria-label="Client plan" className="w-auto" value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }}>{["All plans", ...plans.map((p) => p.name)].map((v) => <option key={v}>{v}</option>)}</Select>
        <Select aria-label="Client health" className="w-auto" value={health} onChange={(e) => { setHealth(e.target.value); setPage(1); }}>{["All health", "Healthy", "Needs reconnect", "Webhook failing", "At risk"].map((v) => <option key={v}>{v}</option>)}</Select>
        <Select aria-label="Sort clients" className="w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>{[["name", "Business A–Z"], ["usage", "Highest usage"], ["mrr", "Highest MRR"], ["health", "Lowest health score"]].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</Select>
      </div>

      {sel.size > 0 && <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-xl border border-brand-line bg-brand-soft px-4 py-3"><strong className="text-sm">{sel.size} selected across pages</strong><Button size="sm" onClick={() => setModal("plan")}>Change plan</Button><Button size="sm" onClick={() => setModal("notice")}>Reconnect notice</Button><Button size="sm" onClick={() => exportRows(all.filter((c) => sel.has(c.id)))}>Export selected</Button><button className="ml-auto text-sm text-brand hover:underline" onClick={() => setSel(new Set())}>Clear</button></div>}

      <Card className="mt-4">
        {visible.length === 0 ? <EmptyState title="No clients match" text="Try another filter." /> : (
          <Table>
            <thead><tr><Th className="w-10"><input type="checkbox" aria-label="Select clients on this page" className="accent-[var(--brand)]" checked={!!visible.length && visible.every((c) => sel.has(c.id))} onChange={(e) => setSel((s) => { const n = new Set(s); visible.forEach((c) => (e.target.checked ? n.add(c.id) : n.delete(c.id))); return n; })} /></Th><Th>Business / owner</Th><Th>Plan / MRR</Th><Th>Status</Th><Th>Channels</Th><Th>Usage</Th><Th>Health</Th><Th>Last active</Th></tr></thead>
            <tbody>{visible.map((c) => { const u = c.status === "Deleted" ? { percent: 0, used: 0, limit: 0, channels: 0 } : usageOf(c); return (
              <tr key={c.id} className="transition-colors hover:bg-line/50">
                <Td><input type="checkbox" aria-label={`Select ${c.name}`} className="accent-[var(--brand)]" checked={sel.has(c.id)} onChange={(e) => setSel((s) => { const n = new Set(s); e.target.checked ? n.add(c.id) : n.delete(c.id); return n; })} /></Td>
                <Td><Link href={`/admin/clients/${c.id}`} className="flex items-center gap-3"><Avatar name={c.name} colour="#dce6f4" /><div className="leading-tight"><div className="font-medium text-ink hover:text-brand">{c.name}</div><div className="text-xs text-ink-3">{c.owner} · {c.email}</div></div></Link></Td>
                <Td>{c.plan}<div className="num text-xs text-ink-3">{money(Math.round(mrrOf(c)))}/mo</div></Td>
                <Td><StatusBadge status={c.status} /></Td>
                <Td className="num">{u.channels}</Td>
                <Td className="min-w-[130px]"><div className="num mb-1.5 text-xs">{u.percent}%</div><Progress value={Math.min(100, u.percent)} tone={u.percent > 100 ? "warning" : "brand"} /></Td>
                <Td><StatusBadge status={c.health} /><div className="num mt-1 text-xs text-ink-4">score {c.healthScore}</div></Td>
                <Td className="whitespace-nowrap text-ink-3">{c.lastActive}</Td>
              </tr>); })}</tbody>
          </Table>
        )}
        <div className="flex items-center justify-between border-t border-line px-5 py-3 text-[13px] text-ink-3"><span>Showing {rows.length ? (pg - 1) * SIZE + 1 : 0}–{Math.min(pg * SIZE, rows.length)} of {rows.length}</span><div className="flex items-center gap-3"><Button size="sm" disabled={pg <= 1} onClick={() => setPage(pg - 1)} icon={<ChevronLeft className="size-4" />}>Previous</Button><span className="num">{pg} / {pages}</span><Button size="sm" disabled={pg >= pages} onClick={() => setPage(pg + 1)}>Next <ChevronRight className="size-4" /></Button></div></div>
      </Card>

      <ReasonModal open={modal === "plan"} onClose={() => setModal(null)} title={`Change plan for ${chosen.length} clients`} onConfirm={bulkPlan} confirmLabel="Apply plan">
        <Field label="Target plan"><Select value={target} onChange={(e) => setTarget(e.target.value)}>{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        <p className="text-[13px] text-ink-3">Immediate local overrides, no real billing or proration. Existing records are kept.</p>
      </ReasonModal>
      <Modal open={modal === "notice"} onClose={() => setModal(null)} title="Preview a reconnect notice" footer={<><Button variant="ghost" onClick={() => setModal(null)}>Close</Button><Button variant="primary" disabled={!chosen.length} onClick={() => { chosen.forEach((c) => audit("Reconnect notice previewed", c.id, "Bulk email preview; no email sent.")); toast("Notice preview recorded. No email sent.", "success"); setModal(null); }}>Record demo notice</Button></>}>
        <p className="mb-3 text-sm text-ink-2">Recipients ({chosen.length}): {chosen.map((c) => c.email).join(", ") || "—"}</p>
        <div className="rounded-xl border border-line bg-bg-deep/50 p-4 text-sm"><strong>Subject: Please reconnect your business channels</strong><p className="mt-2 text-ink-2">Hello, please sign in to your workspace and re-authorise your connected channels. Existing conversations and orders are safe.</p></div>
        <p className="mt-3 text-xs text-ink-3">No email is sent. Recording the preview adds an audit entry, not a token change.</p>
      </Modal>
    </>
  );
}
