"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Save } from "lucide-react";
import { Badge, Button, Card, CardHeader, Checkbox, Field, Input, PageHeader, Select, Switch, Textarea } from "@/components/ui";
import { AgentChat } from "@/components/app/agent-chat";
import { store, useStore } from "@/lib/store";
import { useUI } from "@/components/providers";

const LANGS = ["Bangla", "Banglish", "English"];
const TONES = ["Friendly", "Professional", "Casual"];
const FIELDS: [string, string][] = [["name", "Name"], ["phone", "Phone"], ["address", "Address"], ["product", "Product"], ["quantity", "Quantity"], ["size", "Size"], ["colour", "Colour"]];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const AFTER = ["Collect details and notify the team", "Pause automated replies", "Reply with business hours"];

export default function AgentPage() {
  const { toast } = useUI();
  const saved = useStore<any>("agent", {});
  const client = useStore<any>("client", {});
  const [a, setA] = useState<any>(null);
  const [dirty, setDirty] = useState(false);
  const [blocked, setBlocked] = useState("");

  useEffect(() => { if (saved?.name && !dirty) { setA(structuredClone(saved)); setBlocked((saved.blockedWords || []).join(", ")); } }, [saved, dirty]);
  if (!a) return null;

  const set = (patch: any) => { setA((x: any) => ({ ...x, ...patch })); setDirty(true); };
  const setH = (patch: any) => set({ handover: { ...a.handover, ...patch } });
  const override = (ch: string, patch: any) => set({ channelOverrides: { ...a.channelOverrides, [ch]: { ...(a.channelOverrides?.[ch] || {}), ...patch } } });
  const toggleIn = (key: string, v: string) => set({ [key]: a[key]?.includes(v) ? a[key].filter((x: string) => x !== v) : [...(a[key] || []), v] });

  const save = () => {
    if (!a.name.trim()) return toast("Give your agent a name.", "error");
    if (!a.languages?.length) return toast("Choose at least one language.", "error");
    if (!a.orderFields?.length) return toast("Collect at least one order field.", "error");
    store.set("agent", { ...a, blockedWords: blocked.split(",").map((s) => s.trim()).filter(Boolean) });
    setDirty(false);
    toast("Agent settings saved. Your preview now uses them.", "success");
  };

  return (
    <>
      <PageHeader
        title="Shape how your agent sells."
        description="Voice, rules and hand-over behaviour. Changes apply to every new conversation."
        actions={<><label className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2 text-sm"><span className="font-medium">AI agent {client.agentLive ? "is live" : "is off"}</span><Switch checked={!!client.agentLive} label="Turn the AI agent on" onChange={(v) => { store.set("client.agentLive", v); toast(v ? "Your AI agent is live." : "AI agent turned off.", v ? "success" : "info"); }} /></label><Button variant="primary" icon={<Save className="size-4" />} disabled={!dirty} onClick={save}>Save changes</Button></>}
      />
      {dirty && <div className="mb-5"><Badge tone="warning" dot>Unsaved changes</Badge></div>}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card><CardHeader title="Identity & voice" />
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <Field label="Agent name"><Input value={a.name} onChange={(e) => set({ name: e.target.value })} /></Field>
              <Field label="Tone"><Select value={a.tone} onChange={(e) => set({ tone: e.target.value })}>{TONES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
              <div className="sm:col-span-2"><span className="mb-2 block text-[13px] font-medium text-ink-2">Languages</span><div className="flex flex-wrap gap-5">{LANGS.map((l) => <Checkbox key={l} checked={a.languages.includes(l)} onChange={() => toggleIn("languages", l)} label={l} />)}</div></div>
              <Field label="Greeting" className="sm:col-span-2"><Textarea rows={2} value={a.greeting} onChange={(e) => set({ greeting: e.target.value })} /></Field>
              <label className="flex items-center gap-3 sm:col-span-2"><Switch checked={a.disclosure} label="AI disclosure" onChange={(v) => set({ disclosure: v })} /><span className="text-sm"><strong className="font-medium">Disclose that customers are chatting with an AI</strong><span className="block text-[13px] text-ink-3">Recommended — adds an “AI assistant” note to the greeting.</span></span></label>
            </div>
          </Card>

          <Card><CardHeader title="Hand over to a human" description="Your agent pauses and notifies the team when…" />
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <label className="flex items-center gap-3"><Switch checked={a.handover.keyword !== false} label="Customer asks for a human" onChange={(v) => setH({ keyword: v })} /><span className="text-sm">Customer asks for a human (“agent chai”)</span></label>
              <label className="flex items-center gap-3"><Switch checked={a.handover.angry !== false} label="Angry customer" onChange={(v) => setH({ angry: v })} /><span className="text-sm">Customer sounds angry or frustrated</span></label>
              <label className="flex items-center gap-3"><Switch checked={a.handover.unknown !== false} label="Unknown question" onChange={(v) => setH({ unknown: v })} /><span className="text-sm">Two unknown questions in a row</span></label>
              <Field label="Order amount above (৳)"><Input type="number" min={0} value={a.handover.amount ?? ""} onChange={(e) => setH({ amount: +e.target.value })} /></Field>
              <Field label="Escalation email"><Input type="email" value={a.escalationEmail || ""} onChange={(e) => set({ escalationEmail: e.target.value })} placeholder="team@yourbusiness.com" /></Field>
              <Field label="Escalation WhatsApp"><Input value={a.escalationWhatsapp || ""} onChange={(e) => set({ escalationWhatsapp: e.target.value })} placeholder="01712345678" /></Field>
            </div>
          </Card>

          <Card><CardHeader title="Order collection" description="The agent asks for these, one natural step at a time." />
            <div className="flex flex-wrap gap-x-6 gap-y-3 p-5">{FIELDS.map(([k, l]) => <Checkbox key={k} checked={a.orderFields.includes(k)} onChange={() => toggleIn("orderFields", k)} label={l} />)}</div>
          </Card>

          <Card><CardHeader title="Business hours" />
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <Field label="Opens"><Input type="time" value={a.opens || "10:00"} onChange={(e) => set({ opens: e.target.value })} /></Field>
              <Field label="Closes"><Input type="time" value={a.closes || "22:00"} onChange={(e) => set({ closes: e.target.value })} /></Field>
              <div className="sm:col-span-2"><span className="mb-2 block text-[13px] font-medium text-ink-2">Working days <span className="font-normal text-ink-3">(leave empty to answer every day, any time)</span></span><div className="flex flex-wrap gap-2">{DAYS.map((d) => { const on = a.workingDays?.includes(d); return <button key={d} type="button" aria-pressed={!!on} onClick={() => toggleIn("workingDays", d)} className={clsx("rounded-full border px-4 py-1.5 text-sm font-medium transition-colors", on ? "border-brand bg-brand text-white" : "border-line-strong text-ink-2 hover:border-brand")}>{d}</button>; })}</div></div>
              <Field label="Outside business hours" className="sm:col-span-2"><Select value={a.afterHours} onChange={(e) => set({ afterHours: e.target.value })}>{AFTER.map((o) => <option key={o}>{o}</option>)}</Select></Field>
            </div>
          </Card>

          <Card><CardHeader title="Channel overrides" description="Give a channel its own language, tone or greeting." />
            <div className="divide-y divide-line">{["Facebook", "Instagram", "WhatsApp"].map((ch) => { const o = a.channelOverrides?.[ch] || {}; return (
              <div key={ch} className="p-5"><label className="flex items-center justify-between"><span className="font-medium">{ch}</span><Switch checked={!!o.enabled} label={`Override ${ch}`} onChange={(v) => override(ch, { enabled: v })} /></label>
                {o.enabled && <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Language"><Select value={o.language || "English"} onChange={(e) => override(ch, { language: e.target.value })}>{LANGS.map((l) => <option key={l}>{l}</option>)}</Select></Field><Field label="Tone"><Select value={o.tone || a.tone} onChange={(e) => override(ch, { tone: e.target.value })}>{TONES.map((t) => <option key={t}>{t}</option>)}</Select></Field><Field label="Greeting" className="sm:col-span-2"><Input value={o.greeting || ""} onChange={(e) => override(ch, { greeting: e.target.value })} placeholder="Use the default greeting" /></Field></div>}
              </div>); })}</div>
          </Card>

          <Card><CardHeader title="Guardrails" />
            <div className="space-y-5 p-5">
              <Field label="Blocked words" hint="Comma-separated. The agent hands over instead of replying when a customer uses one."><Input value={blocked} onChange={(e) => { setBlocked(e.target.value); setDirty(true); }} placeholder="refund fraud, lawsuit" /></Field>
              <Field label="Custom instructions"><Textarea rows={4} value={a.customInstructions} onChange={(e) => set({ customInstructions: e.target.value })} /></Field>
            </div>
          </Card>
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <Card><CardHeader title="Live preview" description={dirty ? "Save changes to preview them." : "Talk to your agent exactly as a customer would."} />
            <div className="p-4"><AgentChat key={JSON.stringify([saved.name, saved.tone, saved.languages])} greeting={saved.greeting} height={420} /></div>
          </Card>
        </div>
      </div>
    </>
  );
}
