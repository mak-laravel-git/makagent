"use client";

import { useState } from "react";
import { AlertCircle, FilePlus2, Plus, Send, Trash2 } from "lucide-react";
import { Badge, Button, Card, Checkbox, Drawer, EmptyState, Field, Input, PageHeader, Select, StatusBadge, Tabs, Textarea } from "@/components/ui";
import { store, uid, useStore } from "@/lib/store";
import { useUI } from "@/components/providers";
import type { Template } from "@/lib/data";

const CATS = ["Utility", "Marketing", "Authentication"];

export default function TemplatesPage() {
  const { toast, confirm } = useUI();
  const templates = useStore<Template[]>("templates", []);
  const [filter, setFilter] = useState("All");
  const [editing, setEditing] = useState<Template | null>(null);
  const rows = templates.filter((t) => filter === "All" || t.status === filter);

  const submit = (t: Template) => {
    const exists = templates.some((x) => x.id === t.id);
    const next = { ...t, status: "Pending", reason: "" };
    if (exists) store.patch("templates", t.id, next); else store.add("templates", next);
    setEditing(null);
    toast("Template submitted for review…", "info");
    setTimeout(() => {
      const bad = t.category === "Marketing" && !/stop|opt.?out|unsubscribe/i.test(t.text);
      store.patch("templates", t.id, bad ? { status: "Rejected", reason: "Missing opt-out instructions for a Marketing template." } : { status: "Approved", reason: "" });
      toast(bad ? "Template was rejected. Review the reason and resubmit." : "Template approved. You can use it in the inbox.", bad ? "error" : "success");
    }, 1800);
  };

  return (
    <>
      <PageHeader title="Templates that get approved." description="Pre-approved WhatsApp messages for conversations outside the 24-hour window."
        actions={<Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing({ id: uid(), clientId: "cl-dhaka", name: "", category: "Utility", status: "Draft", text: "", reason: "", optInRequired: true, language: "en" })}>New template</Button>} />
      <div className="mb-5"><Tabs value={filter} onChange={setFilter} options={["All", "Approved", "Pending", "Rejected", "Draft"].map((v) => ({ value: v, label: v, count: v === "All" ? templates.length : templates.filter((t) => t.status === v).length }))} /></div>
      {rows.length === 0 ? <Card><EmptyState icon={<FilePlus2 className="size-5" />} title="No templates here" text="Create a template and submit it for review." /></Card> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((t) => (
            <Card key={t.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3"><div><h3 className="font-mono text-[15px] font-medium">{t.name}</h3><div className="mt-2 flex gap-1.5"><Badge>{t.category}</Badge><Badge>{t.language}</Badge></div></div><StatusBadge status={t.status} /></div>
              <div className="mt-4 rounded-xl rounded-tl-sm bg-[#dcf8c6] p-3.5 text-sm text-[#111]">{t.text}</div>
              {t.status === "Rejected" && <div className="mt-3 flex gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-[13px] text-danger"><AlertCircle className="mt-0.5 size-4 shrink-0" />{t.reason}</div>}
              <div className="mt-auto flex gap-2 pt-5"><Button size="sm" disabled={t.status === "Pending"} onClick={() => setEditing(structuredClone(t))}>{t.status === "Rejected" ? "Revise & resubmit" : "Edit"}</Button><Button size="sm" variant="ghost" aria-label="Delete template" onClick={async () => { if (await confirm({ title: "Delete template?", danger: true })) { store.remove("templates", t.id); toast("Template deleted.", "success"); } }}><Trash2 className="size-4" /></Button></div>
            </Card>
          ))}
        </div>
      )}
      {editing && <Editor t={editing} onClose={() => setEditing(null)} onSubmit={submit} onDraft={(t) => { templates.some((x) => x.id === t.id) ? store.patch("templates", t.id, t) : store.add("templates", t); setEditing(null); toast("Draft saved.", "success"); }} />}
    </>
  );
}

function Editor({ t, onClose, onSubmit, onDraft }: { t: Template; onClose: () => void; onSubmit: (t: Template) => void; onDraft: (t: Template) => void }) {
  const { toast, } = useUI();
  const all = useStore<Template[]>("templates", []);
  const [d, setD] = useState(t);
  const vars = [...new Set([...d.text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => m[1]))];
  const [samples, setSamples] = useState<Record<string, string>>({ "1": "Nusrat", "2": "SP-1042", "3": "৳1,280" });
  const preview = vars.reduce((s, v) => s.replaceAll(`{{${v}}}`, samples[v] || `{{${v}}}`), d.text);
  const validate = () => {
    if (!/^[a-z][a-z0-9_]{2,}$/.test(d.name)) return toast("Use a lowercase name with letters, numbers and underscores.", "warning"), false;
    if (all.some((x) => x.id !== d.id && x.name === d.name)) return toast("A template with this name already exists.", "warning"), false;
    if (d.text.trim().length < 10) return toast("Write the message body (at least 10 characters).", "warning"), false;
    if (!d.optInRequired) return toast("Customer opt-in confirmation is required.", "warning"), false;
    return true;
  };
  return (
    <Drawer open onClose={onClose} width="max-w-3xl" title={t.name ? "Revise template" : "Create a template"} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => d.name && onDraft(d)}>Save draft</Button><Button variant="primary" icon={<Send className="size-4" />} onClick={() => validate() && onSubmit(d)}>Submit for review</Button></>}>
      <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <Field label="Template name" hint="Lowercase, underscores — e.g. order_confirmation"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Category"><Select value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</Select></Field><Field label="Language"><Select value={d.language} onChange={(e) => setD({ ...d, language: e.target.value })}><option value="en">English</option><option value="bn">Bangla</option></Select></Field></div>
          <Field label="Message body" hint="Use {{1}}, {{2}}… for variables. Marketing templates must include opt-out text (e.g. “Reply STOP to opt out”)."><Textarea rows={5} value={d.text} onChange={(e) => setD({ ...d, text: e.target.value })} /></Field>
          {vars.length > 0 && <div className="grid gap-3 sm:grid-cols-2">{vars.map((v) => <Field key={v} label={`Sample for {{${v}}}`}><Input value={samples[v] ?? ""} onChange={(e) => setSamples((s) => ({ ...s, [v]: e.target.value }))} /></Field>)}</div>}
          <Checkbox checked={d.optInRequired} onChange={(v) => setD({ ...d, optInRequired: v })} label="I have customer opt-in for messages sent with this template." />
        </div>
        <div><div className="mb-3 text-sm font-semibold">Live preview</div><div className="rounded-2xl bg-[#0b141a] p-4"><div className="rounded-xl rounded-tl-sm bg-[#dcf8c6] p-3.5 text-sm text-[#111]">{preview || <span className="text-black/40">Your message appears here.</span>}<div className="mt-1.5 text-right text-[10px] text-black/40">12:04 ✓✓</div></div></div>
          <p className="mt-3 text-xs text-ink-4">Approval is simulated: Pending → Approved after a short review. A template never reopens the 24-hour free-text window.</p></div>
      </div>
    </Drawer>
  );
}
