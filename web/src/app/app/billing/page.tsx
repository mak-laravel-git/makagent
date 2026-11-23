"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { CreditCard, Download, Gauge, Receipt, RotateCw } from "lucide-react";
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, Progress, Select, StatusBadge, Table, Td, Th } from "@/components/ui";
import { store, useStore, money, download } from "@/lib/store";
import { addNotification } from "@/lib/actions";
import { useUI } from "@/components/providers";
import type { Channel, Invoice, Plan, TeamMember } from "@/lib/data";

const iso = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const today = () => iso(new Date());
const nextDate = (start: string, cycle: string) => { const d = new Date(start + "T12:00:00+06:00"); if (cycle === "yearly") d.setFullYear(d.getFullYear() + 1); else d.setMonth(d.getMonth() + 1); return iso(d); };
const fmtDate = (s: string) => new Date(s + "T12:00:00+06:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

type Sub = { planId: string; cycle: "monthly" | "yearly"; status: string; periodStart: string; periodEnd: string; credit: number };

export default function BillingPage() {
  const { toast } = useUI();
  const plans = useStore<Plan[]>("plans", []);
  const sub = useStore<Sub | undefined>("subscription", undefined);
  const invoices = useStore<Invoice[]>("invoices", []);
  const method = useStore<any>("paymentMethod", undefined);
  const client = useStore<any>("client", {});
  const conversations = useStore<any[]>("conversations", []);
  const channels = useStore<Channel[]>("channels", []);
  const team = useStore<TeamMember[]>("team", []);
  const demo = useStore<any>("demo", {});
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [status, setStatus] = useState("All invoices");
  const [pmOpen, setPmOpen] = useState(false);
  const [change, setChange] = useState<Plan | null>(null);

  // initialise subscription + payment method once
  useEffect(() => {
    if (!plans.length) return;
    if (!store.get("subscription")) {
      const p = plans.find((x) => x.name === client.plan) || plans[2];
      const start = p.id === "trial" ? today() : today().slice(0, 8) + "01";
      store.set("subscription", { planId: p.id, cycle: "monthly", status: p.id === "trial" ? "Trial" : "Active", periodStart: start, periodEnd: p.id === "trial" ? iso(new Date(new Date(start + "T12:00:00+06:00").getTime() + 14 * 86400000)) : nextDate(start, "monthly"), credit: 0 });
    }
    if (!store.get("paymentMethod")) store.set("paymentMethod", { brand: "Visa", last4: "4242", holder: client.owner || "Account owner", expiry: "12/28" });
  }, [plans, client.plan, client.owner]);

  useEffect(() => { if (sub?.cycle) setCycle(sub.cycle); }, [sub?.cycle]);
  if (!sub || !method || !plans.length) return null;

  const plan = plans.find((p) => p.id === sub.planId) || plans[2];
  const amountOf = (p: Plan, i: string) => (i === "yearly" ? p.yearly : p.monthly);
  const due = invoices.filter((i) => ["Due", "Failed"].includes(i.status));
  const usage: Record<string, [number, number]> = {
    Conversations: [conversations.length, plan.conversations],
    Channels: [channels.filter((c) => c.status === "Connected").length, plan.channels],
    "Team seats": [team.filter((t) => t.status !== "Removed").length, plan.seats],
  };
  const methodText = `${method.brand} ending ${method.last4}`;

  const pay = (id: string) => {
    if (store.get("demo.paymentFailed")) {
      store.patch("invoices", id, { status: "Failed" });
      toast("Demo payment failed. Turn off “Simulate failed payment” in Demo controls, then retry.", "error");
      addNotification("Payment failed", `Invoice ${id} could not be paid with ${methodText}.`, "payment");
      return;
    }
    store.patch("invoices", id, { status: "Paid", method: methodText });
    toast("Demo payment received. No real money moved.", "success");
  };

  const proration = (target: Plan) => {
    const total = Math.max(1, (new Date(sub.periodEnd).getTime() - new Date(sub.periodStart).getTime()) / 86400000);
    const left = Math.max(0, Math.min(total, (new Date(sub.periodEnd).getTime() - new Date(today()).getTime()) / 86400000));
    const unused = Math.round(amountOf(plan, sub.cycle) * (left / total));
    const newCost = Math.round(amountOf(target, cycle) * (left / total));
    return { left: Math.round(left), unused, newCost, diff: newCost - unused - (sub.credit || 0) };
  };

  const apply = (target: Plan) => {
    const pr = proration(target);
    const start = today();
    if (pr.diff > 0 && store.get("demo.paymentFailed")) return toast("Demo payment failed — your plan was not changed.", "error");
    store.set("subscription", { ...sub, planId: target.id, cycle, status: target.id === "trial" ? "Trial" : "Active", periodStart: start, periodEnd: nextDate(start, cycle), credit: pr.diff < 0 ? Math.abs(pr.diff) : 0 });
    store.set("client.plan", target.name);
    if (pr.diff > 0) store.add("invoices", { id: "INV-" + Date.now().toString().slice(-7), clientId: "cl-dhaka", date: start, amount: pr.diff, plan: target.name, status: "Paid", method: methodText });
    addNotification(`Plan updated to ${target.name}`, "Your local subscription has been updated.", "payment");
    toast(`You’re on the ${target.name} plan.`, "success");
    setChange(null);
  };

  const downloadInvoice = (i: Invoice) => {
    const html = `<!doctype html><meta charset="utf-8"><title>${i.id}</title><body style="font-family:system-ui;max-width:640px;margin:48px auto;color:#111"><h1>Invoice ${i.id}</h1><p><strong>DEMO RECORD — not a tax invoice.</strong></p><table style="width:100%;border-collapse:collapse"><tr><td>Customer</td><td>${client.name}</td></tr><tr><td>Date</td><td>${i.date}</td></tr><tr><td>Plan</td><td>${i.plan}</td></tr><tr><td>Amount</td><td>৳${i.amount.toLocaleString()}</td></tr><tr><td>Status</td><td>${i.status}</td></tr></table></body>`;
    download(`${i.id}.html`, html, "text/html");
  };

  const rows = invoices.filter((i) => status === "All invoices" || i.status === status);

  return (
    <>
      <PageHeader eyebrow="Your workspace, your pace" title="A plan that grows with your business." description="Clear limits, simple choices, and no real charges in this demo." actions={<Button icon={<CreditCard className="size-4" />} onClick={() => setPmOpen(true)}>Payment method</Button>} />

      {due.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-warning/30 bg-warning/10 p-5">
          <div><strong className="text-warning">{due.some((i) => i.status === "Failed") ? "A demo payment needs attention" : "You have an invoice waiting"}</strong><p className="mt-0.5 text-sm text-ink-2">{due.length} unpaid {due.length === 1 ? "invoice" : "invoices"} · {money(due.reduce((n, i) => n + i.amount, 0))}. Update your demo payment method or retry below.</p></div>
          <Button icon={<RotateCw className="size-4" />} onClick={() => pay(due[0].id)}>Retry payment</Button>
        </div>
      )}

      <section className="relative overflow-hidden rounded-2xl border border-brand-line bg-brand p-8 text-white">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div><Badge className="!bg-white/20 !text-white">{sub.status}</Badge><h2 className="mt-4 text-4xl font-bold tracking-[-0.03em]">{plan.name} plan</h2><p className="mt-2 text-white/85">{money(amountOf(plan, sub.cycle))} / {sub.cycle === "yearly" ? "year" : "month"} · {plan.id === "trial" ? "Trial ends" : "Renews"} {fmtDate(sub.periodEnd)}</p><p className="mt-1 text-sm text-white/70">Account credit {money(sub.credit || 0)} · Local simulation, not money held.</p></div>
          <div className="text-right text-sm text-white/85"><div className="font-semibold text-white">{client.name}</div><div>{client.email}</div><div>{methodText}</div></div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card><CardHeader title="Room to keep growing" description="Current local workspace usage against your plan." action={<Gauge className="size-5 text-ink-3" />} />
          <div className="space-y-5 p-5">{Object.entries(usage).map(([k, [v, lim]]) => <div key={k}><div className="mb-2 flex justify-between text-sm"><strong className="font-medium">{k}</strong><span className="num text-ink-3">{v} / {lim.toLocaleString()} {v > lim && "· Over limit"}</span></div><Progress value={(v / Math.max(1, lim)) * 100} tone={v > lim ? "warning" : "brand"} /></div>)}
            <p className="text-xs text-ink-4">Usage is illustrative local records, not metered API billing. Existing records are kept when downgrading.</p></div></Card>
        <Card><CardHeader title="Payment method" description="No real card or bank information is collected." />
          <div className="p-5"><div className="rounded-xl border border-line bg-bg-deep/50 p-4"><div className="font-semibold">{method.brand} · •••• {method.last4}</div><div className="text-sm text-ink-3">{method.holder}{method.expiry ? ` · Expiry ${method.expiry}` : ""}</div></div><Button className="mt-4" onClick={() => setPmOpen(true)}>Edit demo method</Button>{demo.paymentFailed && <p className="mt-3 text-xs text-warning">“Simulate failed payment” is on in Demo controls.</p>}</div></Card>
      </div>

      <div className="mb-5 mt-10 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-bold tracking-tight">The right fit for your next chapter.</h2><p className="text-sm text-ink-3">Compare plans, then review the prorated change.</p></div>
        <div role="group" className="inline-flex rounded-full border border-line-strong bg-surface p-1">{(["monthly", "yearly"] as const).map((v) => <button key={v} aria-pressed={cycle === v} onClick={() => setCycle(v)} className={clsx("rounded-full px-5 py-1.5 text-sm font-medium", cycle === v ? "bg-brand text-white" : "text-ink-2")}>{v === "yearly" ? "Yearly · save" : "Monthly"}</button>)}</div></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => { const current = p.id === plan.id && cycle === sub.cycle; return (
          <Card key={p.id} className={clsx("flex flex-col p-6", p.id === plan.id && "border-brand")}>
            <div className="flex items-center justify-between"><h3 className="font-semibold">{p.name}</h3>{p.id === plan.id && <Badge tone="info">Current</Badge>}</div>
            <div className="num mt-4 text-3xl font-bold tracking-tight">{money(amountOf(p, cycle))}<span className="text-sm font-normal text-ink-3"> / {cycle === "yearly" ? "year" : "month"}</span></div>
            <div className="mt-1 text-xs text-ink-3">{cycle === "yearly" && p.monthly ? `Save ${money(p.monthly * 12 - p.yearly)} annually` : p.trialDays ? `${p.trialDays}-day demo trial` : "Billed monthly"}</div>
            <ul className="my-5 space-y-2 text-sm text-ink-2"><li>{p.conversations.toLocaleString()} conversations</li><li>{p.channels} connected channels</li><li>{p.seats} team seats</li><li>{p.scheduler ? "Post scheduling included" : "Basic posting"}</li><li>{p.analytics} analytics</li></ul>
            <Button className="mt-auto" variant={p.id === plan.id ? "secondary" : "primary"} disabled={current} onClick={() => setChange(p)}>{current ? "Your current plan" : "Review change"}</Button>
          </Card>); })}
      </div>

      <Card className="mt-8">
        <div className="flex items-center justify-between border-b border-line px-5 py-4"><strong>Invoices and receipts</strong><Select aria-label="Filter invoices" className="w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>{["All invoices", "Paid", "Due", "Failed"].map((s) => <option key={s}>{s}</option>)}</Select></div>
        {rows.length === 0 ? <EmptyState icon={<Receipt className="size-5" />} title="No invoices here" text="Try another invoice status." /> : (
          <Table><thead><tr><Th>Invoice</Th><Th>Plan</Th><Th>Amount</Th><Th>Status</Th><Th>Method</Th><Th /></tr></thead>
            <tbody>{rows.map((i) => <tr key={i.id}><Td><strong className="text-ink">{i.id}</strong><div className="text-xs text-ink-3">{fmtDate(i.date)}</div></Td><Td>{i.plan}</Td><Td className="num">{money(i.amount)}</Td><Td><StatusBadge status={i.status} /></Td><Td>{i.method || methodText}</Td><Td><div className="flex gap-2"><Button size="sm" icon={<Download className="size-3.5" />} onClick={() => downloadInvoice(i)}>Download</Button>{["Due", "Failed"].includes(i.status) && <Button size="sm" onClick={() => pay(i.id)}>Pay demo</Button>}</div></Td></tr>)}</tbody></Table>
        )}
      </Card>
      <p className="mt-4 text-xs text-ink-4">Proration previews are illustrative. No taxes, exchange rates or processor fees are simulated. Invoices download as printable HTML marked as demo records.</p>

      <PaymentModal open={pmOpen} onClose={() => setPmOpen(false)} method={method} />
      <Modal open={!!change} onClose={() => setChange(null)} title={change ? `Switch to ${change.name}` : ""} footer={<><Button variant="ghost" onClick={() => setChange(null)}>Cancel</Button><Button variant="primary" onClick={() => change && apply(change)}>Confirm change</Button></>}>
        {change && (() => { const pr = proration(change); return (
          <div className="space-y-4 text-sm"><p className="text-ink-2">{plan.name} → {change.name} ({cycle}). {pr.left} days remain in this period.</p>
            <div className="divide-y divide-line rounded-xl border border-line">{([["Unused time on current plan", `− ${money(pr.unused)}`], ["New plan, prorated", money(pr.newCost)], ["Account credit applied", `− ${money(sub.credit || 0)}`]] as [string, string][]).map(([k, v]) => <div key={k} className="flex justify-between p-3.5"><span className="text-ink-2">{k}</span><span className="num">{v}</span></div>)}<div className="flex justify-between p-3.5 font-semibold"><span>{pr.diff >= 0 ? "Due today" : "Credit added"}</span><span className="num">{money(Math.abs(pr.diff))}</span></div></div>
            {change.conversations < plan.conversations && <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-[13px] text-warning">Downgrading lowers your limits. Existing records are kept.</div>}</div>); })()}
      </Modal>
    </>
  );
}

function PaymentModal({ open, onClose, method }: { open: boolean; onClose: () => void; method: any }) {
  const { toast } = useUI();
  const [m, setM] = useState(method);
  useEffect(() => { if (open) setM(method); }, [open, method]);
  const save = () => {
    if (!m.holder.trim()) return toast("Enter a fictional account holder.", "warning");
    if (!/^\d{4}$/.test(m.last4)) return toast("Enter the last four digits only.", "warning");
    if (m.expiry && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(m.expiry)) return toast("Use MM/YY for the expiry.", "warning");
    store.set("paymentMethod", m); toast("Demo payment method saved.", "success"); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Edit a demo payment method" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save demo method</Button></>}>
      <p className="mb-4 text-sm text-ink-2">Enter a fictional display method only. Never enter a full card number, CVV, PIN, OTP or actual bank credentials.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Method"><Select value={m.brand} onChange={(e) => setM({ ...m, brand: e.target.value })}>{["Visa", "Mastercard", "bKash", "Nagad"].map((b) => <option key={b}>{b}</option>)}</Select></Field>
        <Field label="Fictional account holder"><Input value={m.holder} onChange={(e) => setM({ ...m, holder: e.target.value })} /></Field>
        <Field label="Last four digits only"><Input inputMode="numeric" maxLength={4} value={m.last4} onChange={(e) => setM({ ...m, last4: e.target.value.replace(/\D/g, "") })} /></Field>
        <Field label="Demo expiry (MM/YY)"><Input placeholder="12/28" value={m.expiry || ""} onChange={(e) => setM({ ...m, expiry: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
