"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Video } from "lucide-react";
import { Badge, Button, Card, CardHeader, Checkbox, Modal, PageHeader, Progress, Select, StatusBadge, Table, Td, Textarea, Th, Field } from "@/components/ui";
import { audit } from "@/lib/admin";
import { store, useStore } from "@/lib/store";
import { useUI } from "@/components/providers";

type Perm = { id: string; name: string; access: string; reviewState: string; reason: string; screencast: { recorded: boolean; permissionShown: boolean; testCredentials: boolean } };

export default function MetaStatus() {
  const { toast } = useUI();
  const meta = useStore<any>("admin.metaStatus", {});
  const [edit, setEdit] = useState<Perm | null>(null);
  const perms: Perm[] = meta.permissions || [];
  const checklist: { label: string; done: boolean }[] = meta.reviewChecklist || [];
  const approved = perms.filter((p) => p.reviewState === "Approved").length;
  const casts = perms.filter((p) => p.screencast.recorded && p.screencast.permissionShown && p.screencast.testCredentials).length;
  const readiness = Math.round(((approved / Math.max(1, perms.length)) * 0.5 + (checklist.filter((c) => c.done).length / Math.max(1, checklist.length)) * 0.3 + (casts / Math.max(1, perms.length)) * 0.2) * 100);

  const setP = (id: string, v: Partial<Perm>) => store.update<any>("admin.metaStatus", (m) => { Object.assign(m.permissions.find((p: Perm) => p.id === id), v); });

  return (
    <>
      <PageHeader eyebrow="Platform · Admin" title="App review, without the guesswork." description="Where every permission stands — and what still blocks launch." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[["Business verification", meta.businessVerification], ["App mode", meta.appMode], ["Tech provider", meta.techProvider], ["Graph API version", meta.apiVersion]].map(([k, v]) => <Card key={k} className="p-5"><div className="text-xs uppercase tracking-wider text-ink-3">{k}</div><div className="mt-2 text-xl font-bold tracking-tight">{v}</div></Card>)}
      </div>
      <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">{meta.deprecationWarning}</div>

      <Card className="mt-6"><CardHeader title="Review readiness" description="Weighted: approvals, checklist and complete screencasts." action={<span className="num text-3xl font-bold tracking-tight">{readiness}%</span>} /><div className="p-6"><Progress value={readiness} tone={readiness > 80 ? "success" : "brand"} /></div></Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card><CardHeader title="Permissions" description="Standard vs. Advanced access, and review status for each." />
          <Table><thead><tr><Th>Permission</Th><Th>Access</Th><Th>Review</Th><Th>Screencast</Th><Th /></tr></thead>
            <tbody>{perms.map((p) => { const full = p.screencast.recorded && p.screencast.permissionShown && p.screencast.testCredentials; return (
              <tr key={p.id}><Td className="font-mono text-[13px] text-ink">{p.name}</Td><Td><Badge tone={p.access === "Advanced" ? "brand" : "neutral"}>{p.access}</Badge></Td><Td><StatusBadge status={p.reviewState} />{p.reason && <div className="mt-1 max-w-[220px] text-xs text-danger">{p.reason}</div>}</Td><Td><span className={full ? "text-success" : "text-warning"}>{full ? "Complete" : "Incomplete"}</span></Td><Td><Button size="sm" onClick={() => setEdit(structuredClone(p))}>Update</Button></Td></tr>); })}</tbody></Table></Card>

        <div className="space-y-6">
          <Card><CardHeader title="Submission checklist" />
            <ul className="divide-y divide-line">{checklist.map((c, i) => <li key={c.label}><button onClick={() => { store.update<any>("admin.metaStatus", (m) => { m.reviewChecklist[i].done = !m.reviewChecklist[i].done; }); }} className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-sm hover:bg-line">{c.done ? <CheckCircle2 className="size-[18px] text-success" /> : <Circle className="size-[18px] text-ink-4" />}<span className={c.done ? "text-ink-3 line-through" : ""}>{c.label}</span></button></li>)}</ul></Card>
          <Card><CardHeader title="Screencast checklist" description="Each recording must show the permission in use, with test credentials." />
            <div className="space-y-2 p-5 text-sm">{[["Recorded", perms.filter((p) => p.screencast.recorded).length], ["Permission shown", perms.filter((p) => p.screencast.permissionShown).length], ["Test credentials included", perms.filter((p) => p.screencast.testCredentials).length]].map(([k, n]) => <div key={k as string} className="flex items-center justify-between"><span className="flex items-center gap-2 text-ink-2"><Video className="size-4 text-ink-4" />{k}</span><span className="num">{n} / {perms.length}</span></div>)}</div></Card>
        </div>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit ? `Update ${edit.name}` : ""} footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button variant="primary" onClick={() => { if (!edit) return; if (edit.reviewState === "Rejected" && edit.reason.trim().length < 5) return toast("Record the rejection reason.", "warning"); setP(edit.id, { access: edit.access, reviewState: edit.reviewState, reason: edit.reviewState === "Rejected" ? edit.reason : "", screencast: edit.screencast }); audit("Updated Meta permission", "", `${edit.name}: ${edit.reviewState}`); toast("Permission status updated.", "success"); setEdit(null); }}>Save</Button></>}>
        {edit && <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Access level"><Select value={edit.access} onChange={(e) => setEdit({ ...edit, access: e.target.value })}><option>Standard</option><option>Advanced</option></Select></Field><Field label="Review state"><Select value={edit.reviewState} onChange={(e) => setEdit({ ...edit, reviewState: e.target.value })}>{["Not submitted", "In review", "Approved", "Rejected"].map((s) => <option key={s}>{s}</option>)}</Select></Field></div>
          {edit.reviewState === "Rejected" && <Field label="Rejection reason"><Textarea rows={3} value={edit.reason} onChange={(e) => setEdit({ ...edit, reason: e.target.value })} /></Field>}
          <div className="space-y-2.5">{(["recorded", "permissionShown", "testCredentials"] as const).map((k) => <Checkbox key={k} checked={edit.screencast[k]} onChange={(v) => setEdit({ ...edit, screencast: { ...edit.screencast, [k]: v } })} label={{ recorded: "Screencast recorded", permissionShown: "Permission demonstrated on screen", testCredentials: "Test credentials provided" }[k]} />)}</div></div>}
      </Modal>
    </>
  );
}
