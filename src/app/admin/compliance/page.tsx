"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Badge, Button, Card, CardHeader, EmptyState, Input, PageHeader, Select, Stat, StatusBadge, Table, Tabs, Td, Th, Field } from "@/components/ui";
import { ReasonModal } from "@/components/app/reason-modal";
import { audit, fmtDate } from "@/lib/admin";
import { store, useStore, download, toCsv } from "@/lib/store";
import { useUI } from "@/components/providers";

type Del = { id: string; client: string; status: string; code: string; requested: string; completed: string | null };

export default function Compliance() {
  const { toast } = useUI();
  const dels = useStore<Del[]>("admin.deletionRequests", []);
  const consent = useStore<any[]>("admin.consentLogs", []);
  const log = useStore<any[]>("admin.auditLog", []);
  const [tab, setTab] = useState<"deletions" | "consent" | "policies" | "audit">("deletions");
  const [complete, setComplete] = useState<Del | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [who, setWho] = useState("All admins");

  const filtered = useMemo(() => log.filter((a) => (who === "All admins" || a.who === who) && (a.action + a.client + a.details + a.who).toLowerCase().includes(q.toLowerCase())).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [log, q, who]);
  const open = dels.filter((d) => d.status !== "Completed").length;

  return (
    <>
      <PageHeader eyebrow="Operations · Admin" title="Privacy, with a paper trail." description="Deletion requests, consent records, policy versions and every sensitive action." />
      <div className="grid gap-4 sm:grid-cols-3"><Stat label="Open deletion requests" value={open} accent /><Stat label="Consent records" value={consent.length} /><Stat label="Audit entries" value={log.length} /></div>
      <div className="my-6"><Tabs value={tab} onChange={setTab} options={[{ value: "deletions", label: "Deletion queue", count: dels.length }, { value: "consent", label: "Consent logs" }, { value: "policies", label: "Policy versions" }, { value: "audit", label: "Audit log", count: log.length }]} /></div>

      {tab === "deletions" && (
        <Card><Table><thead><tr><Th>Request</Th><Th>Client</Th><Th>Code</Th><Th>Requested</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>{dels.map((d) => <tr key={d.id}><Td className="font-medium text-ink">{d.id}</Td><Td>{d.client}</Td><Td className="font-mono text-[13px]">{d.code}</Td><Td>{fmtDate(d.requested)}</Td><Td><StatusBadge status={d.status} /></Td><Td>{d.status === "Pending" && <Button size="sm" onClick={() => { store.patch("admin.deletionRequests", d.id, { status: "Processing" }); audit("Processing deletion", "", `${d.id} · ${d.client}`); toast("Marked as processing.", "info"); }}>Start processing</Button>}{d.status === "Processing" && <Button size="sm" variant="primary" onClick={() => { setCode(""); setName(""); setComplete(d); }}>Complete</Button>}{d.status === "Completed" && <span className="text-xs text-ink-3">Done {d.completed && fmtDate(d.completed)}</span>}</Td></tr>)}</tbody></Table></Card>
      )}
      {tab === "consent" && (
        <Card>{consent.length ? <Table><thead><tr><Th>Client</Th><Th>Action</Th><Th>Date</Th><Th>Policy version</Th></tr></thead><tbody>{consent.map((c) => <tr key={c.id || c.date}><Td className="font-medium text-ink">{c.client}</Td><Td>{c.action}</Td><Td>{fmtDate(c.date)}</Td><Td><Badge>v{c.policyVersion}</Badge></Td></tr>)}</tbody></Table> : <EmptyState title="No consent records" />}</Card>
      )}
      {tab === "policies" && (
        <Card><CardHeader title="Published policy versions" />
          {[["Privacy Policy", "/privacy", "2.0"], ["Terms of Service", "/terms", "2.0"], ["Data Deletion Instructions", "/data-deletion", "2.0"]].map(([t, href, v]) => <div key={t} className="flex items-center justify-between border-b border-line px-5 py-4 last:border-0"><div><div className="font-medium">{t}</div><div className="text-xs text-ink-3">Updated 23 November 2026</div></div><div className="flex items-center gap-3"><Badge tone="success">v{v}</Badge><Button size="sm" href={href}>View</Button></div></div>)}</Card>
      )}
      {tab === "audit" && (
        <Card>
          <div className="flex flex-wrap items-center gap-3 border-b border-line p-4"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" /><Input aria-label="Search audit log" placeholder="Search action, client, details…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" /></div><Select aria-label="Admin" className="w-auto" value={who} onChange={(e) => setWho(e.target.value)}>{["All admins", ...new Set(log.map((a) => a.who as string))].map((w) => <option key={w}>{w}</option>)}</Select><Button icon={<Download className="size-4" />} onClick={() => download("audit-log.csv", toCsv(filtered.map((a) => ({ date: a.date, admin: a.who, action: a.action, client: a.client, details: a.details }))))}>Export</Button></div>
          {filtered.length ? <Table><thead><tr><Th>When</Th><Th>Admin</Th><Th>Action</Th><Th>Client</Th><Th>Details</Th></tr></thead><tbody>{filtered.map((a) => <tr key={a.id}><Td className="whitespace-nowrap">{fmtDate(a.date)}<div className="text-xs text-ink-4">{new Date(a.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" })}</div></Td><Td>{a.who}</Td><Td className="font-medium text-ink">{a.action}</Td><Td>{a.client}</Td><Td className="text-[13px]">{a.details}</Td></tr>)}</tbody></Table> : <EmptyState title="No matching entries" />}
        </Card>
      )}

      <ReasonModal open={!!complete} onClose={() => setComplete(null)} title={`Complete ${complete?.id}`} confirmLabel="Mark completed" onConfirm={(reason) => { if (!complete) return; if (code.trim() !== complete.code || name.trim() !== complete.client) { toast("The request code and exact business name must both match.", "warning"); return false; } store.patch("admin.deletionRequests", complete.id, { status: "Completed", completed: new Date().toISOString().slice(0, 10) }); audit("Processed deletion", "", `${complete.id} · ${complete.client}. ${reason}`); toast("Deletion completed and logged.", "success"); }}>
        <p className="text-sm text-ink-2">Confirm you verified the owner. Enter the request code and the exact business name to complete.</p>
        <Field label="Request code"><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={complete?.code} /></Field><Field label="Business name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={complete?.client} /></Field>
      </ReasonModal>
    </>
  );
}
