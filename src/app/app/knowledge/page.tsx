"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, CircleHelp, FileText, FlaskConical, Pencil, Plus, Search, ShieldCheck, Sparkles, Trash2, Upload } from "lucide-react";
import { Badge, Button, Card, Drawer, EmptyState, Field, Input, PageHeader, Select, Skeleton, Tabs, Textarea } from "@/components/ui";
import { store, uid, useStore } from "@/lib/store";
import { MockAgent } from "@/lib/mock-agent";
import { syncKnowledge } from "@/lib/actions";
import { useUI } from "@/components/providers";

type K = Record<string, any>;
const TABS = ["All knowledge", "FAQs", "Policies", "Documents"] as const;

export default function KnowledgePage() {
  const { toast, confirm } = useUI();
  const faqs = useStore<K[]>("faqs", []);
  const docs = useStore<K[]>("documents", []);
  const knowledge = useStore<K[]>("knowledge", []);
  const policiesCfg = useStore<K>("onboarding.policies", {});
  const initialised = useStore<boolean>("onboarding.knowledgeInitialized", false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("All knowledge");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<null | { text: string; sources: string[]; hadCards: boolean }>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // seed default policies once, like the original
  useEffect(() => {
    // Read fresh state: React strict mode runs this effect twice before the store re-renders.
    const fresh = store.get<K[]>("knowledge", []);
    if (initialised || fresh.some((k) => k.type === "Policy")) { if (!initialised) store.set("onboarding.knowledgeInitialized", true); return; }
    store.update<K[]>("knowledge", (ks) => {
      const defaults: K[] = [
        { id: "policy-delivery", title: "Delivery policy", text: policiesCfg.delivery || "Inside Dhaka: 1–2 days, ৳80. Outside Dhaka: 2–4 days, ৳130.", type: "Policy", status: "Indexed" },
        { id: "policy-return", title: "Returns & exchanges", text: policiesCfg.returns || "Exchange unused items with original tags within 7 days. Return courier fees apply.", type: "Policy", status: "Indexed" },
        { id: "policy-payment", title: "Payment methods", text: (policiesCfg.payments || ["bKash", "Nagad", "Cash on Delivery", "Card"]).join(", "), type: "Policy", status: "Indexed" },
      ];
      defaults.forEach((d) => { if (!ks.some((k) => k.id === d.id)) ks.push(d); });
    });
    store.set("onboarding.knowledgeInitialized", true);
  }, [initialised, knowledge, policiesCfg]);

  const items: K[] = [...faqs, ...docs, ...knowledge.filter((k) => k.type === "Policy")];
  const rows = items
    .filter((k) => tab === "All knowledge" || (tab === "FAQs" ? k.type === "FAQ" : tab === "Policies" ? k.type === "Policy" : k.type === "Document"))
    .filter((k) => ((k.title || k.name) + " " + (k.text || k.answer || "")).toLowerCase().includes(query.toLowerCase()));

  const keyFor = (k: K) => (k.type === "FAQ" ? "faqs" : k.type === "Document" ? "documents" : "knowledge");
  const index = (k: K, fail = false) => {
    store.patch(keyFor(k), k.id, { status: "Indexing" });
    setTimeout(() => {
      store.patch(keyFor(k), k.id, { status: fail ? "Error" : "Indexed" });
      syncKnowledge();
      toast(fail ? "Indexing failed in the demo. Use Retry to recover." : "Knowledge indexed. Your AI can use it now.", fail ? "error" : "success");
    }, 800);
  };

  const remove = async (k: K) => {
    if (!(await confirm({ title: "Delete this knowledge entry?", message: `Your AI will stop using ${k.title}.`, danger: true }))) return;
    if (k.type === "FAQ") store.remove("faqs", k.id); else if (k.type === "Document") store.remove("documents", k.id);
    store.remove("knowledge", k.id);
    if (k.id === "policy-delivery") store.set("onboarding.policies.delivery", "");
    if (k.id === "policy-return") store.set("onboarding.policies.returns", "");
    if (k.id === "policy-payment") store.set("onboarding.policies.payments", []);
    syncKnowledge();
    toast("Knowledge entry removed.", "success");
  };

  const upload = async (file?: File) => {
    if (!file) return;
    if (file.size > 2000000 || !/\.(pdf|txt)$/i.test(file.name)) return toast("Choose a PDF or text file smaller than 2 MB.", "error");
    const entry = { id: uid(), name: file.name, title: file.name, type: "Document", text: /\.txt$/i.test(file.name) ? (await file.text()).slice(0, 50000) : `PDF indexing is simulated for ${file.name}. Add a text summary to make this document searchable.`, size: file.size, status: "Indexing", uploadedAt: new Date().toISOString() };
    store.add("documents", entry);
    syncKnowledge();
    index(entry);
  };

  const test = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setAnswer(null);
    setTimeout(() => {
      const r = MockAgent.reply({ message: question, channel: "Facebook", conversationState: {} });
      setAnswer({ text: r.text, sources: r.sources || [], hadCards: r.cards.length > 0 });
      setBusy(false);
    }, 600);
  };

  const snippets = answer ? items.filter((k) => answer.sources.includes(k.title || k.name)) : [];

  return (
    <>
      <PageHeader
        title="A little knowledge. Much better answers."
        description="Give your agent the facts, policies and context that make your business yours."
        actions={<><input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" aria-label="Upload knowledge document" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} /><Button icon={<Upload className="size-4" />} onClick={() => fileRef.current?.click()}>Upload document</Button><Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>Add knowledge</Button></>}
      />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" /><Input aria-label="Search knowledge" placeholder="Search questions, policies or documents…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" /></div>
            <Tabs value={tab} onChange={setTab} options={TABS.map((t) => ({ value: t, label: t }))} />
          </div>
          <Card>
            {rows.length === 0 ? <EmptyState icon={<BookOpen className="size-5" />} title="Every good answer starts somewhere" text="Add an FAQ, a policy, or a business document." /> : rows.map((k) => {
              const Icon = k.type === "FAQ" ? CircleHelp : k.type === "Policy" ? ShieldCheck : FileText;
              const text = k.text || k.answer || "";
              return (
                <article key={k.id} className="flex items-start gap-4 border-b border-line p-5 last:border-0">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-raised text-brand"><Icon className="size-[18px]" /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold tracking-tight">{k.title || k.name}</h3>
                    <p className="mt-1 text-sm text-ink-2">{text.slice(0, 210)}{text.length > 210 ? "…" : ""}</p>
                    <div className="mt-3 flex gap-2"><Badge>{k.type}</Badge><Badge tone={k.status === "Indexed" ? "success" : k.status === "Error" ? "danger" : "warning"} dot>{k.status}</Badge></div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {k.status === "Error" && <Button size="sm" onClick={() => index(k)}>Retry</Button>}
                    <button aria-label={`Edit ${k.title}`} onClick={() => setEditing(k.id)} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line hover:text-ink"><Pencil className="size-4" /></button>
                    <button aria-label={`Delete ${k.title}`} onClick={() => remove(k)} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line hover:text-danger"><Trash2 className="size-4" /></button>
                  </div>
                </article>
              );
            })}
            <div className="flex justify-between border-t border-line px-5 py-3 text-[13px] text-ink-3"><span>{rows.length} knowledge entries</span><span>{items.filter((k) => k.status === "Indexed").length} ready for your AI</span></div>
          </Card>
          <div className="mt-4 rounded-xl border border-line bg-surface p-4 text-[13px] text-ink-3">Text documents can be searched by the local agent. PDF indexing is a metadata simulation, not text extraction. Avoid personal data and payment secrets.</div>
        </section>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <Card className="p-6">
            <Badge tone="info"><Sparkles className="size-3" /> Grounded answers</Badge>
            <h2 className="mt-4 text-xl font-bold tracking-tight">Would your agent know?</h2>
            <p className="mt-1.5 text-sm text-ink-3">Ask a customer question. See the answer and exactly which saved snippets the rule engine used.</p>
            <form onSubmit={test} className="mt-5 space-y-3">
              <Field label="Test question"><Textarea rows={3} required value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What is your exchange policy?" /></Field>
              <Button type="submit" variant="primary" className="w-full" loading={busy} icon={<FlaskConical className="size-4" />}>Test answer</Button>
            </form>
            <div aria-live="polite" className="mt-4">
              {busy && <Skeleton className="h-24" />}
              {answer && (
                <>
                  <div className="rounded-xl border border-line bg-bg-deep/50 p-4 text-sm">{answer.text}<div className="mt-3 flex flex-wrap gap-1.5">{answer.sources.length ? answer.sources.map((s) => <Badge key={s} tone="info">{s}</Badge>) : <Badge>{answer.hadCards ? "Product catalog" : "No knowledge match"}</Badge>}</div></div>
                  {snippets.map((k) => <div key={k.id} className="mt-3 rounded-xl border border-brand-line bg-brand-soft p-3.5"><strong className="text-sm">{k.title}</strong><p className="mt-1 text-[13px] text-ink-2">{(k.text || k.answer).slice(0, 300)}</p></div>)}
                </>
              )}
            </div>
            <div className="my-5 h-px bg-line" />
            <h3 className="text-sm font-semibold">A useful rule of thumb</h3>
            <p className="mt-1 text-[13px] text-ink-3">Short, specific answers work best. Include timeframes, delivery areas, payment options, and any exceptions.</p>
          </Card>
        </aside>
      </div>

      {editing && <KEditor key={editing} k={editing === "new" ? undefined : items.find((x) => x.id === editing)} onClose={() => setEditing(null)} onSaved={(entry, fail) => { index(entry, fail); }} />}
    </>
  );
}

function KEditor({ k, onClose, onSaved }: { k?: K; onClose: () => void; onSaved: (entry: K, fail: boolean) => void }) {
  const { toast } = useUI();
  const [f, setF] = useState({ type: k?.type || "FAQ", title: k?.title || k?.name || "", text: k?.text || k?.answer || "", indexMode: "success" });
  const save = () => {
    if (f.title.trim().length < 3 || !f.text.trim()) return toast("Add a title and some text.", "warning");
    const id = k?.id || uid();
    const entry: K = { ...(k || {}), type: f.type, title: f.title, text: f.text, id, question: f.title, answer: f.text, name: k?.name || f.title, status: "Indexing" };
    if (k) { store.remove("faqs", id); store.remove("documents", id); store.remove("knowledge", id); }
    if (entry.type === "FAQ") store.add("faqs", entry); else if (entry.type === "Document") store.add("documents", entry); else store.add("knowledge", entry);
    if (id === "policy-delivery") store.set("onboarding.policies.delivery", entry.text);
    if (id === "policy-return") store.set("onboarding.policies.returns", entry.text);
    if (id === "policy-payment") store.set("onboarding.policies.payments", entry.text.split(",").map((x: string) => x.trim()));
    syncKnowledge();
    toast("Saved. Indexing the new knowledge…", "info");
    onSaved(entry, f.indexMode === "error");
    onClose();
  };
  return (
    <Drawer open onClose={onClose} title={k ? "Make this answer clearer" : "Teach your agent something useful"} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save & index</Button></>}>
      <div className="space-y-5">
        <Field label="Entry type"><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{["FAQ", "Policy", "Document"].map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label={f.type === "FAQ" ? "Customer question" : "Title"}><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Answer / source text"><Textarea rows={8} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field>
        {f.type === "Document" && <div className="rounded-lg border border-line bg-bg-deep/40 p-3.5 text-[13px] text-ink-3">Editing the text changes the local searchable snippet. It does not modify the original file.</div>}
        <Field label="Indexing scenario"><Select value={f.indexMode} onChange={(e) => setF({ ...f, indexMode: e.target.value })}><option value="success">Index successfully</option><option value="error">Simulate indexing error</option></Select></Field>
      </div>
    </Drawer>
  );
}
