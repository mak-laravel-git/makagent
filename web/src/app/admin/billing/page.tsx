"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Download, RotateCw, Undo2, Wallet } from "lucide-react";
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, PageHeader, Select, Stat, StatusBadge, Table, Tabs, Td, Th } from "@/components/ui";
import { BarSeries } from "@/components/charts/charts";
import { ReasonModal } from "@/components/app/reason-modal";
import { audit, fmtDate, mrrOf, type AdminInvoice } from "@/lib/admin";
import { store, useStore, money, download, toCsv } from "@/lib/store";
import { useUI } from "@/components/providers";
import type { Client } from "@/lib/data";

export default function AdminBilling() {
  const { toast } = useUI();
  const invoices = useStore<AdminInvoice[]>("admin.invoices", []);
  const clients = useStore<Client[]>("admin.clients", []);
  const [tab, setTab] = useState<"invoices" | "failures" | "subscriptions" | "reports">("invoices");
  const [status, setStatus] = useState("All");
  const [refund, setRefund] = useState<AdminInvoice | null>(null);
  const [amount, setAmount] = useState(0);

  const net = (i: AdminInvoice) => i.amount - (i.refundedAmount || 0);
  const paid = (i: AdminInvoice) => ["Paid", "Partially refunded", "Refunded"].includes(i.status);
  const collected = invoices.filter(paid).reduce((n, i) => n + net(i), 0);
  const failed = invoices.filter((i) => ["Failed", "Due"].includes(i.status));
  const refunded = invoices.reduce((n, i) => n + (i.refundedAmount || 0), 0);
  const rows = invoices.filter((i) => status === "All" || i.status === status);
  const monthly = useMemo(() => ["2026-08", "2026-09", "2026-10"].map((m) => ({ label: m, Collected: invoices.filter((i) => i.date.startsWith(m) && paid(i)).reduce((n, i) => n + net(i), 0), Outstanding: invoices.filter((i) => i.date.startsWith(m) && ["Failed", "Due"].includes(i.status)).reduce((n, i) => n + i.amount, 0) })), [invoices]); // eslint-disable-line react-hooks/exhaustive-deps

  const retry = (i: AdminInvoice) => {
    const ok = !store.get("demo.paymentFailed") && i.attempts < 3;
    store.patch("admin.invoices", i.id, ok ? { status: "Paid", attempts: i.attempts + 1 } : { status: "Failed", attempts: i.attempts + 1 });
    audit(ok ? "Payment retried" : "Payment retry failed", i.clientId, `${i.id} · attempt ${i.attempts + 1}`);
    toast(ok ? "Retry succeeded (demo). No money moved." : "Retry failed. Dunning continues.", ok ? "success" : "error");
  };
  const dunning = (i: AdminInvoice) => i.attempts >= 3 ? "Final notice · suspend at day 14" : i.attempts === 2 ? "Reminder 2 sent · next retry in 3 days" : "Reminder 1 sent · retry in 2 days";

  return (
    <>
      <PageHeader eyebrow="Commercial · Admin" title="Money in, clearly accounted for." description="Subscriptions, invoices, failures and refunds. All amounts are fictional."
        actions={<Button icon={<Download className="size-4" />} onClick={() => { download("admin-invoices.csv", toCsv(invoices.map((i) => ({ id: i.id, client: i.client, date: i.date, plan: i.plan, amount: i.amount, refunded: i.refundedAmount || 0, status: i.status })))); toast("Invoices exported.", "success"); }}>Export invoices</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Collected (net)" value={money(collected)} icon={<Wallet className="size-4" />} accent />
        <Stat label="Outstanding" value={money(failed.reduce((n, i) => n + i.amount, 0))} hint={`${failed.length} invoices`} icon={<AlertCircle className="size-4" />} />
        <Stat label="Refunded" value={money(refunded)} icon={<Undo2 className="size-4" />} />
        <Stat label="MRR" value={money(Math.round(clients.reduce((n, c) => n + mrrOf(c), 0)))} hint="active subscriptions" />
      </div>
      <div className="my-6"><Tabs value={tab} onChange={setTab} options={[{ value: "invoices", label: "Invoices", count: invoices.length }, { value: "failures", label: "Failures & dunning", count: failed.length }, { value: "subscriptions", label: "Subscriptions" }, { value: "reports", label: "Reports" }]} /></div>

      {tab === "invoices" && (
        <Card><div className="flex items-center justify-between border-b border-line px-5 py-4"><strong>All invoices</strong><Select aria-label="Status" className="w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>{["All", "Paid", "Due", "Failed", "Refunded", "Partially refunded"].map((s) => <option key={s}>{s}</option>)}</Select></div>
          <Table><thead><tr><Th>Invoice</Th><Th>Client</Th><Th>Plan</Th><Th>Amount</Th><Th>Status</Th><Th /></tr></thead>
            <tbody>{rows.map((i) => <tr key={i.id}><Td className="font-medium text-ink">{i.id}<div className="text-xs font-normal text-ink-3">{fmtDate(i.date)}</div></Td><Td>{i.client}</Td><Td>{i.plan}</Td><Td className="num">{money(i.amount)}{!!i.refundedAmount && <div className="text-xs text-warning">− {money(i.refundedAmount)} refunded</div>}</Td><Td><StatusBadge status={i.status === "Refunded" || i.status === "Partially refunded" ? "Pending" : i.status} /><span className="ml-2 text-xs text-ink-3">{["Refunded", "Partially refunded"].includes(i.status) ? i.status : ""}</span></Td><Td>{["Failed", "Due"].includes(i.status) ? <Button size="sm" icon={<RotateCw className="size-3.5" />} onClick={() => retry(i)}>Retry</Button> : i.status !== "Refunded" && <Button size="sm" onClick={() => { setAmount(net(i)); setRefund(i); }}>Refund</Button>}</Td></tr>)}</tbody></Table></Card>
      )}
      {tab === "failures" && (
        <Card><CardHeader title="Failed & overdue payments" description="Dunning runs automatically: reminders, retries, then suspension." />
          {failed.length ? failed.map((i) => <div key={i.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-0"><div><div className="font-medium">{i.client} · {i.id}</div><div className="text-sm text-ink-3">{money(i.amount)} · {i.method} · {i.attempts} attempt{i.attempts > 1 ? "s" : ""}</div><Badge tone="warning" className="mt-2">{dunning(i)}</Badge></div><Button size="sm" variant="primary" icon={<RotateCw className="size-3.5" />} onClick={() => retry(i)}>Retry payment</Button></div>) : <EmptyState title="No failures" text="Every invoice is settled." />}</Card>
      )}
      {tab === "subscriptions" && (
        <Card><Table><thead><tr><Th>Client</Th><Th>Plan</Th><Th>Status</Th><Th>MRR</Th></tr></thead><tbody>{clients.filter((c) => c.status !== "Deleted").map((c) => <tr key={c.id}><Td className="font-medium text-ink">{c.name}</Td><Td>{c.plan}</Td><Td><StatusBadge status={c.status} /></Td><Td className="num">{money(mrrOf(c))}</Td></tr>)}</tbody></Table></Card>
      )}
      {tab === "reports" && (
        <Card><CardHeader title="Collected vs. outstanding" description="Last three invoice months" /><div className="p-5"><BarSeries legend data={monthly} series={[{ key: "Collected" }, { key: "Outstanding", color: "#f5b544" }]} fmt={(n) => money(n)} /></div></Card>
      )}

      <ReasonModal open={!!refund} onClose={() => setRefund(null)} title={`Refund ${refund?.id}`} confirmLabel="Issue demo refund" onConfirm={(reason) => { if (!refund) return; const max = net(refund); if (!(amount > 0) || amount > max) { toast(`Enter an amount between ৳1 and ${money(max)}.`, "warning"); return false; } const total = (refund.refundedAmount || 0) + amount; store.patch("admin.invoices", refund.id, { refundedAmount: total, status: total >= refund.amount ? "Refunded" : "Partially refunded" }); audit("Issued refund", refund.clientId, `${refund.id}: ${money(amount)}. ${reason}`); toast("Demo refund recorded. No money moved.", "success"); }}>
        <Field label={`Amount (max ${refund ? money(net(refund)) : ""})`}><Input type="number" min={1} value={amount} onChange={(e) => setAmount(+e.target.value)} /></Field>
      </ReasonModal>
    </>
  );
}
