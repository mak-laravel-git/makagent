"use client";

import { useState } from "react";
import { EyeOff, MessageSquarePlus, Pencil, Plus, ShieldBan, Trash2, MessageSquareText } from "lucide-react";
import { Badge, Button, Card, CardHeader, Checkbox, Drawer, EmptyState, Field, Input, Modal, PageHeader, Select, Switch, Textarea, ChannelChip, Table, Th, Td } from "@/components/ui";
import { store, uid, useStore } from "@/lib/store";
import { useUI } from "@/components/providers";
import type { CommentRule } from "@/lib/data";

type Rule = CommentRule & Record<string, any>;
type Log = { id: string; at: string; platform: string; author: string; text: string; ruleName: string; outcome: string; tone: "success" | "warning" | "neutral" | "danger"; detail: string };

const blank = (): Rule => ({ id: uid(), name: "", platforms: ["Facebook", "Instagram"], trigger: "keyword", keywords: "", reply: "", privateReply: false, privateText: "", moderation: "none", moderationWords: "", enabled: true } as Rule);

export default function CommentsPage() {
  const { toast, confirm } = useUI();
  const rules = useStore<Rule[]>("commentRules", []);
  const log = useStore<Log[]>("commentActivity", []);
  const auto = useStore<boolean>("commentAutomation", true);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [sim, setSim] = useState(false);

  const saveRule = (r: Rule) => {
    if (rules.some((x) => x.id === r.id)) store.patch("commentRules", r.id, r); else store.add("commentRules", r);
    toast("Comment rule saved.", "success");
    setEditing(null);
  };

  return (
    <>
      <PageHeader title="Answer every comment, thoughtfully." description="Turn public questions on your posts into private, helpful conversations."
        actions={<><label className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2 text-sm"><span className="font-medium">Automation {auto ? "on" : "paused"}</span><Switch checked={auto} label="Comment automation" onChange={(v) => { store.set("commentAutomation", v); toast(v ? "Comment automation resumed." : "Comment automation paused.", "info"); }} /></label><Button icon={<MessageSquarePlus className="size-4" />} onClick={() => setSim(true)}>Simulate a comment</Button><Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing(blank())}>New rule</Button></>} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="Rules" description="Evaluated top to bottom. The first matching rule wins." />
          {rules.length === 0 ? <EmptyState icon={<MessageSquareText className="size-5" />} title="No comment rules yet" text="Create a rule to reply to price questions and keywords on your posts." action={<Button variant="primary" onClick={() => setEditing(blank())}>Create a rule</Button>} /> : rules.map((r) => (
            <article key={r.id} className="flex items-start gap-4 border-b border-line p-5 last:border-0">
              <Switch checked={r.enabled} label={`Enable ${r.name}`} onChange={(v) => store.patch("commentRules", r.id, { enabled: v })} />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold tracking-tight">{r.name}</h3>
                <p className="mt-1 text-sm text-ink-3">{r.trigger === "any" ? "Any comment" : r.trigger === "question" ? "Comments that ask a question" : `Keywords: ${r.keywords}`}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">{(r.platforms || ["Facebook", "Instagram"]).map((p: string) => <ChannelChip key={p} type={p} />)}{r.privateReply && <Badge tone="info">Private reply</Badge>}{r.moderation && r.moderation !== "none" && <Badge tone="warning">{r.moderation}</Badge>}</div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button aria-label={`Edit ${r.name}`} onClick={() => setEditing(structuredClone(r))} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line hover:text-ink"><Pencil className="size-4" /></button>
                <button aria-label={`Delete ${r.name}`} onClick={async () => { if (await confirm({ title: "Delete this rule?", message: "Comments will no longer be matched by it.", danger: true })) { store.remove("commentRules", r.id); toast("Rule deleted.", "success"); } }} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line hover:text-danger"><Trash2 className="size-4" /></button>
              </div>
            </article>
          ))}
        </Card>

        <Card>
          <CardHeader title="Activity" description="Every simulated comment and what your agent did." action={log.length > 0 ? <Button size="sm" variant="ghost" onClick={() => store.set("commentActivity", [])}>Clear</Button> : undefined} />
          {log.length === 0 ? <EmptyState title="No activity yet" text="Use “Simulate a comment” to see a rule in action." /> : (
            <ul className="scroll-y max-h-[560px] divide-y divide-line">{log.map((l) => (
              <li key={l.id} className="p-5">
                <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-sm font-medium"><ChannelChip type={l.platform} compact />{l.author}</span><Badge tone={l.tone}>{l.outcome}</Badge></div>
                <p className="mt-2 text-sm text-ink-2">“{l.text}”</p>
                <p className="mt-1.5 text-xs text-ink-3">{l.ruleName ? `Rule: ${l.ruleName} · ` : ""}{l.detail}</p>
              </li>
            ))}</ul>
          )}
        </Card>
      </div>

      {editing && <RuleEditor rule={editing} onClose={() => setEditing(null)} onSave={saveRule} />}
      <SimModal open={sim} onClose={() => setSim(false)} />
    </>
  );
}

function RuleEditor({ rule, onClose, onSave }: { rule: Rule; onClose: () => void; onSave: (r: Rule) => void }) {
  const { toast } = useUI();
  const [r, setR] = useState<Rule>({ ...rule, platforms: rule.platforms || ["Facebook", "Instagram"], privateText: rule.privateText || "", moderation: rule.moderation || "none", moderationWords: rule.moderationWords || "" });
  const set = (p: Partial<Rule>) => setR((x) => ({ ...x, ...p }));
  const save = () => {
    if (r.name.trim().length < 2) return toast("Name your rule.", "warning");
    if (!r.platforms.length) return toast("Choose at least one platform.", "warning");
    if (r.trigger === "keyword" && !r.keywords.trim()) return toast("Add at least one keyword.", "warning");
    if (r.moderation === "none" && !r.reply.trim()) return toast("Add a public reply (one variant per line).", "warning");
    if (r.privateReply && !(r.privateText || "").trim() && !r.reply.trim()) return toast("Add a private reply.", "warning");
    onSave(r);
  };
  return (
    <Drawer open onClose={onClose} width="max-w-xl" title={rule.name ? "Edit rule" : "Build a comment rule"} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save rule</Button></>}>
      <div className="space-y-5">
        <Field label="Rule name"><Input value={r.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Price questions" /></Field>
        <div><span className="mb-2 block text-[13px] font-medium text-ink-2">Platforms</span><div className="flex gap-6">{["Facebook", "Instagram"].map((p) => <Checkbox key={p} checked={r.platforms.includes(p)} onChange={(v) => set({ platforms: v ? [...r.platforms, p] : r.platforms.filter((x: string) => x !== p) })} label={p} />)}</div></div>
        <Field label="Trigger"><Select value={r.trigger} onChange={(e) => set({ trigger: e.target.value })}><option value="any">Any comment</option><option value="keyword">Contains keywords</option><option value="question">Asks a question</option></Select></Field>
        {r.trigger === "keyword" && <Field label="Keywords" hint="Comma-separated — Bangla and Banglish work too."><Input value={r.keywords} onChange={(e) => set({ keywords: e.target.value })} placeholder="price, দাম, koto" /></Field>}
        <Field label="Moderation action"><Select value={r.moderation} onChange={(e) => set({ moderation: e.target.value })}><option value="none">Reply to the comment</option><option value="hide">Hide the comment</option><option value="ignore">Ignore the comment</option><option value="spam">Mark as spam</option></Select></Field>
        {r.moderation === "none" ? (
          <>
            <Field label="Public reply variants" hint="One per line. Variants rotate so replies don’t look repetitive."><Textarea rows={4} value={r.reply} onChange={(e) => set({ reply: e.target.value })} placeholder={"Thanks for asking! Check your inbox.\nHappy to help — we’ve sent you a message."} /></Field>
            <label className="flex items-center gap-3"><Switch checked={r.privateReply} label="Send a private reply" onChange={(v) => set({ privateReply: v })} /><span className="text-sm"><strong className="font-medium">Also send a private reply</strong><span className="block text-[13px] text-ink-3">One private reply per comment, within 7 days of the comment.</span></span></label>
            {r.privateReply && <Field label="Private reply message"><Textarea rows={3} value={r.privateText} onChange={(e) => set({ privateText: e.target.value })} placeholder="Hi! Here are the details you asked about…" /></Field>}
          </>
        ) : <Field label="Moderation keywords" hint="Leave empty to apply to every comment that matches the trigger."><Input value={r.moderationWords} onChange={(e) => set({ moderationWords: e.target.value })} placeholder="scam, fake, free followers" /></Field>}
      </div>
    </Drawer>
  );
}

function SimModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useUI();
  const [f, setF] = useState({ platform: "Facebook", author: "Rafiq Ahmed", text: "Bhai price koto?", days: 0, repeat: false });
  const run = () => {
    const rules = store.get<Rule[]>("commentRules", []);
    const automation = store.get<boolean>("commentAutomation", true);
    const q = f.text.toLowerCase();
    const entry: Log = { id: uid(), at: new Date().toISOString(), platform: f.platform, author: f.author, text: f.text, ruleName: "", outcome: "No rule matched", tone: "neutral", detail: "The comment was left for your team." };
    if (!automation) { entry.outcome = "Automation paused"; entry.tone = "warning"; entry.detail = "Turn automation on to process comments."; }
    else {
      const rule = rules.find((r) => r.enabled && (r.platforms || ["Facebook", "Instagram"]).includes(f.platform) && (r.trigger === "any" || (r.trigger === "question" && /\?|koto|kemon|kobe|কত|কি |কী |how|what|when|price/.test(q)) || (r.trigger === "keyword" && r.keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean).some((k) => q.includes(k)))));
      if (rule) {
        entry.ruleName = rule.name;
        if (rule.moderation && rule.moderation !== "none") {
          const words = (rule.moderationWords || "").split(",").map((w: string) => w.trim().toLowerCase()).filter(Boolean);
          if (!words.length || words.some((w: string) => q.includes(w))) { entry.outcome = rule.moderation === "hide" ? "Hidden" : rule.moderation === "spam" ? "Marked as spam" : "Ignored"; entry.tone = "danger"; entry.detail = `Moderation action: ${rule.moderation}.`; }
          else { entry.outcome = "Moderation skipped"; entry.detail = "No moderation keyword matched."; }
        } else {
          const variants = String(rule.reply).split("\n").map((v) => v.trim()).filter(Boolean);
          const used = store.get<Log[]>("commentActivity", []).filter((l) => l.ruleName === rule.name).length;
          const pub = variants.length ? variants[used % variants.length] : "";
          const parts = [`Public reply: “${pub}”`];
          if (rule.privateReply) parts.push(f.repeat ? "Private reply skipped — one per comment already sent." : f.days > 7 ? "Private reply blocked — the comment is older than 7 days." : "Private reply sent.");
          entry.outcome = "Replied"; entry.tone = "success"; entry.detail = parts.join(" ");
        }
      }
    }
    store.update<Log[]>("commentActivity", (l) => [entry, ...l].slice(0, 50));
    toast(entry.outcome, entry.tone === "success" ? "success" : "info");
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Simulate a comment" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={run}>Run through rules</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Platform"><Select value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })}><option>Facebook</option><option>Instagram</option></Select></Field>
        <Field label="Commenter"><Input value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} /></Field>
        <Field label="Comment" className="sm:col-span-2"><Textarea rows={2} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field>
        <Field label="Comment age (days)"><Input type="number" min={0} max={30} value={f.days} onChange={(e) => setF({ ...f, days: +e.target.value })} /></Field>
        <div className="flex items-end"><Checkbox checked={f.repeat} onChange={(v) => setF({ ...f, repeat: v })} label="A private reply was already sent for this comment" /></div>
      </div>
    </Modal>
  );
}
