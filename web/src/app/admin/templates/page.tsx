"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button, Card, EmptyState, Field, Modal, PageHeader, Select, Stat, StatusBadge, Table, Td, Textarea, Th, Badge } from "@/components/ui";
import { audit, type AdminTemplate } from "@/lib/admin";
import { store, useStore } from "@/lib/store";
import { useUI } from "@/components/providers";

export default function AdminTemplates() {
  const { toast } = useUI();
  const list = useStore<AdminTemplate[]>("admin.templates", []);
  const [status, setStatus] = useState("All");
  const [cat, setCat] = useState("All categories");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [reject, setReject] = useState<AdminTemplate[] | null>(null);
  const [reason, setReason] = useState("");

  const rows = list.filter((t) => (status === "All" || t.status === status) && (cat === "All categories" || t.category === cat));
  const n = (s: string) => list.filter((t) => t.status === s).length;
  const toggle = (id: string, on: boolean) => setSel((s) => { const x = new Set(s); on ? x.add(id) : x.delete(id); return x; });
  const chosen = list.filter((t) => sel.has(t.id));

  const approve = (ts: AdminTemplate[]) => { store.update<AdminTemplate[]>("admin.templates", (l) => l.forEach((t) => { if (ts.some((x) => x.id === t.id)) { t.status = "Approved"; t.reason = ""; } })); ts.forEach((t) => audit("Approved template", t.clientId, t.name)); toast(`${ts.length} template${ts.length > 1 ? "s" : ""} approved.`, "success"); setSel(new Set()); };
  const doReject = () => { if (!reject) return; if (reason.trim().length < 5) return toast("Give the client a clear rejection reason.", "warning"); store.update<AdminTemplate[]>("admin.templates", (l) => l.forEach((t) => { if (reject.some((x) => x.id === t.id)) { t.status = "Rejected"; t.reason = reason.trim(); } })); reject.forEach((t) => audit("Rejected template", t.clientId, `${t.name}: ${reason.trim()}`)); toast("Template rejected with reason.", "success"); setReject(null); setReason(""); setSel(new Set()); };

  return (
    <>
      <PageHeader eyebrow="Operations · Admin" title="Templates, moderated." description="Review every client’s WhatsApp templates before they are used." />
      <div className="grid gap-4 sm:grid-cols-3"><Stat label="Pending review" value={n("Pending")} accent /><Stat label="Approved" value={n("Approved")} /><Stat label="Rejected" value={n("Rejected")} /></div>
      <div className="mb-4 mt-6 flex flex-wrap items-center gap-2.5">
        <Select aria-label="Status" className="w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>{["All", "Pending", "Approved", "Rejected"].map((s) => <option key={s}>{s}</option>)}</Select>
        <Select aria-label="Category" className="w-auto" value={cat} onChange={(e) => setCat(e.target.value)}>{["All categories", "Utility", "Marketing", "Authentication"].map((s) => <option key={s}>{s}</option>)}</Select>
        {sel.size > 0 && <div className="ml-auto flex items-center gap-2"><span className="text-sm text-ink-3">{sel.size} selected</span><Button size="sm" icon={<Check className="size-3.5" />} onClick={() => approve(chosen)}>Approve</Button><Button size="sm" variant="danger" icon={<X className="size-3.5" />} onClick={() => setReject(chosen)}>Reject</Button></div>}
      </div>
      <Card>
        {rows.length === 0 ? <EmptyState title="No templates match" /> : (
          <Table><thead><tr><Th className="w-10" /><Th>Template</Th><Th>Client</Th><Th>Category</Th><Th>Message</Th><Th>Status</Th><Th /></tr></thead>
            <tbody>{rows.map((t) => <tr key={t.id}><Td><input type="checkbox" aria-label={`Select ${t.name}`} className="accent-[var(--brand)]" checked={sel.has(t.id)} onChange={(e) => toggle(t.id, e.target.checked)} /></Td><Td className="font-mono text-[13px] text-ink">{t.name}</Td><Td>{t.client}</Td><Td><Badge>{t.category}</Badge></Td><Td className="max-w-[300px] text-[13px]">{t.text}{t.reason && <div className="mt-1 text-xs text-danger">{t.reason}</div>}</Td><Td><StatusBadge status={t.status} /></Td><Td><div className="flex gap-1.5">{t.status !== "Approved" && <Button size="sm" onClick={() => approve([t])}>Approve</Button>}{t.status !== "Rejected" && <Button size="sm" variant="ghost" onClick={() => setReject([t])}>Reject</Button>}</div></Td></tr>)}</tbody></Table>
        )}
      </Card>
      <Modal open={!!reject} onClose={() => setReject(null)} title={`Reject ${reject?.length} template${(reject?.length ?? 0) > 1 ? "s" : ""}`} footer={<><Button variant="ghost" onClick={() => setReject(null)}>Cancel</Button><Button variant="danger" onClick={doReject}>Reject with reason</Button></>}>
        <Field label="Reason shown to the client"><Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Marketing templates must include opt-out instructions." /></Field>
      </Modal>
    </>
  );
}
