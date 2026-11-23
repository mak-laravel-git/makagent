"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { Badge, Button, Card, CardHeader, Checkbox, Field, Input, Modal, PageHeader, Select, Switch, Table, Td, Th } from "@/components/ui";
import { ReasonModal } from "@/components/app/reason-modal";
import { audit, type Coupon } from "@/lib/admin";
import { store, uid, useStore, money } from "@/lib/store";
import { useUI } from "@/components/providers";
import type { Client, Plan } from "@/lib/data";

const blank = (): Plan => ({ id: uid(), name: "", monthly: 0, yearly: 0, conversations: 1000, channels: 2, seats: 2, scheduler: true, analytics: "Basic", limits: { conversations: 1000, channels: 2, team: 2 }, features: { scheduler: true, advancedAnalytics: false } });

export default function PlansPage() {
  const { toast } = useUI();
  const plans = useStore<Plan[]>("plans", []);
  const coupons = useStore<Coupon[]>("admin.coupons", []);
  const clients = useStore<Client[]>("admin.clients", []);
  const [edit, setEdit] = useState<Plan | null>(null);
  const [del, setDel] = useState<Plan | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [preview, setPreview] = useState<string>("growth");

  const save = () => {
    if (!edit) return;
    if (edit.name.trim().length < 2) return toast("Name the plan.", "warning");
    if (plans.some((p) => p.id !== edit.id && p.name.toLowerCase() === edit.name.toLowerCase())) return toast("A plan with this name exists.", "warning");
    if (edit.yearly && edit.yearly > edit.monthly * 12) return toast("Yearly price should not exceed 12 × monthly.", "warning");
    const p: Plan = { ...edit, limits: { conversations: edit.conversations, channels: edit.channels, team: edit.seats }, features: { scheduler: edit.scheduler, advancedAnalytics: edit.analytics === "Advanced" } };
    if (plans.some((x) => x.id === p.id)) store.patch("plans", p.id, p); else store.add("plans", p);
    audit("Saved plan", "", `${p.name}: ${money(p.monthly)}/mo`);
    toast("Plan saved.", "success"); setEdit(null);
  };
  const p = plans.find((x) => x.id === preview) ?? plans[0];
  const subs = (name: string) => clients.filter((c) => c.plan === name && c.status !== "Deleted").length;

  return (
    <>
      <PageHeader eyebrow="Commercial · Admin" title="Plans & coupons" description="Pricing, limits and promotions — with a live preview of what customers see." actions={<Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setEdit(blank())}>New plan</Button>} />
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card><CardHeader title="Plans" />
          <Table><thead><tr><Th>Plan</Th><Th>Monthly</Th><Th>Yearly</Th><Th>Limits</Th><Th>Clients</Th><Th /></tr></thead>
            <tbody>{plans.map((x) => <tr key={x.id} className={preview === x.id ? "bg-brand-soft/40" : ""}><Td className="font-medium text-ink"><button onClick={() => setPreview(x.id)} className="hover:text-brand">{x.name}</button></Td><Td className="num">{money(x.monthly)}</Td><Td className="num">{money(x.yearly)}</Td><Td className="text-xs">{x.conversations.toLocaleString()} conv · {x.channels} ch · {x.seats} seats</Td><Td className="num">{subs(x.name)}</Td><Td><div className="flex gap-1"><button aria-label={`Edit ${x.name}`} onClick={() => setEdit(structuredClone(x))} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line hover:text-ink"><Pencil className="size-4" /></button><button aria-label={`Delete ${x.name}`} onClick={() => setDel(x)} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line hover:text-danger"><Trash2 className="size-4" /></button></div></Td></tr>)}</tbody></Table></Card>

        {p && (
          <Card className="p-6"><div className="mb-4 text-xs uppercase tracking-wider text-ink-3">Customer pricing-card preview</div>
            <div className="rounded-2xl border border-brand bg-surface p-7"><h3 className="text-xl font-semibold">{p.name}</h3><div className="num mt-4 text-4xl font-bold tracking-[-0.04em]">{money(p.monthly)}<span className="text-sm font-normal text-ink-3"> / month</span></div><p className="mt-1 text-[13px] text-ink-3">{money(p.yearly)} billed yearly</p>
              <ul className="mt-6 space-y-3 border-t border-line pt-6 text-sm text-ink-2">{[`${p.conversations.toLocaleString()} AI conversations / month`, `${p.channels} connected channel${p.channels > 1 ? "s" : ""}`, `${p.seats} team member${p.seats > 1 ? "s" : ""}`, p.scheduler ? "Post scheduling included" : "Core inbox & product catalog", `${p.analytics} analytics`].map((t) => <li key={t} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-brand" />{t}</li>)}</ul></div></Card>
        )}
      </div>

      <Card className="mt-6"><CardHeader title="Coupons" description="Codes customers can apply at checkout." action={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setCoupon({ id: uid(), code: "", percent: 10, validUntil: "2026-12-31", redemptions: 0, enabled: true })}>New coupon</Button>} />
        <Table><thead><tr><Th>Code</Th><Th>Discount</Th><Th>Valid until</Th><Th>Redemptions</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>{coupons.map((c) => { const exp = c.validUntil < new Date().toISOString().slice(0, 10); return <tr key={c.id}><Td className="font-mono font-medium text-ink"><Tag className="mr-2 inline size-3.5 text-brand" />{c.code}</Td><Td>{c.percent}%</Td><Td>{c.validUntil}</Td><Td className="num">{c.redemptions}</Td><Td><div className="flex items-center gap-3"><Switch checked={c.enabled && !exp} disabled={exp} label={`Enable ${c.code}`} onChange={(v) => store.patch("admin.coupons", c.id, { enabled: v })} />{exp && <Badge tone="danger">Expired</Badge>}</div></Td><Td><button aria-label={`Edit ${c.code}`} onClick={() => setCoupon({ ...c })} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line"><Pencil className="size-4" /></button></Td></tr>; })}</tbody></Table></Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={plans.some((x) => x.id === edit?.id) ? "Edit plan" : "Create a plan"} size="lg" footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button variant="primary" onClick={save}>Save plan</Button></>}>
        {edit && <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field><Field label="Analytics"><Select value={edit.analytics} onChange={(e) => setEdit({ ...edit, analytics: e.target.value })}><option>Basic</option><option>Advanced</option></Select></Field>
          <Field label="Monthly price (৳)"><Input type="number" min={0} value={edit.monthly} onChange={(e) => setEdit({ ...edit, monthly: +e.target.value })} /></Field><Field label="Yearly price (৳)"><Input type="number" min={0} value={edit.yearly} onChange={(e) => setEdit({ ...edit, yearly: +e.target.value })} /></Field>
          <Field label="Conversations / month"><Input type="number" min={1} value={edit.conversations} onChange={(e) => setEdit({ ...edit, conversations: +e.target.value })} /></Field><Field label="Channels"><Input type="number" min={1} value={edit.channels} onChange={(e) => setEdit({ ...edit, channels: +e.target.value })} /></Field>
          <Field label="Team seats"><Input type="number" min={1} value={edit.seats} onChange={(e) => setEdit({ ...edit, seats: +e.target.value })} /></Field><div className="flex items-end"><Checkbox checked={edit.scheduler} onChange={(v) => setEdit({ ...edit, scheduler: v })} label="Post scheduler included" /></div></div>}
      </Modal>
      <ReasonModal open={!!del} onClose={() => setDel(null)} title={`Delete ${del?.name}`} danger confirmLabel="Delete plan" onConfirm={(reason) => { if (!del) return; if (subs(del.name) > 0) { toast("Move this plan’s clients elsewhere before deleting it.", "warning"); return false; } store.remove("plans", del.id); audit("Deleted plan", "", `${del.name}. ${reason}`); toast("Plan deleted.", "success"); }}><p className="text-sm text-ink-2">Plans with active clients cannot be deleted.</p></ReasonModal>
      <Modal open={!!coupon} onClose={() => setCoupon(null)} title={coupons.some((x) => x.id === coupon?.id) ? "Edit coupon" : "New coupon"} size="sm" footer={<><Button variant="ghost" onClick={() => setCoupon(null)}>Cancel</Button><Button variant="primary" onClick={() => { if (!coupon) return; if (!/^[A-Z0-9]{3,16}$/.test(coupon.code)) return toast("Use 3–16 uppercase letters or numbers.", "warning"); if (coupons.some((x) => x.id !== coupon.id && x.code === coupon.code)) return toast("That code already exists.", "warning"); coupons.some((x) => x.id === coupon.id) ? store.patch("admin.coupons", coupon.id, coupon) : store.add("admin.coupons", coupon); toast("Coupon saved.", "success"); setCoupon(null); }}>Save coupon</Button></>}>
        {coupon && <div className="space-y-4"><Field label="Code"><Input value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} /></Field><Field label="Discount (%)"><Input type="number" min={1} max={100} value={coupon.percent} onChange={(e) => setCoupon({ ...coupon, percent: +e.target.value })} /></Field><Field label="Valid until"><Input type="date" value={coupon.validUntil} onChange={(e) => setCoupon({ ...coupon, validUntil: e.target.value })} /></Field></div>}
      </Modal>
    </>
  );
}
