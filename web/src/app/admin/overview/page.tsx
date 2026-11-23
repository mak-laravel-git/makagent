"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Banknote, Building2, Cpu, Download, FileText, MessagesSquare, Receipt, Sparkles, TrendingUp, UserMinus, UserPlus, Radio } from "lucide-react";
import { Button, Card, CardHeader, PageHeader, Select, Stat } from "@/components/ui";
import { BarSeries, LineSeries } from "@/components/charts/charts";
import { useStore, money, download, toCsv } from "@/lib/store";
import { mrrOf, type AdminChannel, type AdminInvoice } from "@/lib/admin";
import type { Client } from "@/lib/data";
import { useUI } from "@/components/providers";

type Metric = { date: string; messages: number; aiShare: number; signups: number; cost: number };

export default function AdminOverview() {
  const { toast } = useUI();
  const all = useStore<Client[]>("admin.clients", []);
  const metrics = useStore<Metric[]>("admin.systemMetrics", []);
  const invoices = useStore<AdminInvoice[]>("admin.invoices", []);
  const channels = useStore<AdminChannel[]>("admin.channels", []);
  const [range, setRange] = useState("30");

  const d = useMemo(() => {
    const clients = all.filter((c) => c.status !== "Deleted");
    const days = metrics.slice(-Number(range));
    const from = days[0]?.date ?? "", to = days.at(-1)?.date ?? "";
    const inv = invoices.filter((i) => i.date >= from && i.date <= to);
    const paid = (i: AdminInvoice) => ["Paid", "Partially refunded", "Refunded"].includes(i.status);
    const net = (i: AdminInvoice) => i.amount - (i.refundedAmount || 0);
    const revenue = invoices.filter((i) => paid(i)).reduce((n, i) => n + net(i), 0);
    const mrr = clients.reduce((n, c) => n + mrrOf(c), 0);
    const factor = days.length / 30;
    const llm = clients.reduce((n, c) => n + c.llmCost, 0) * factor;
    const wa = clients.reduce((n, c) => n + c.whatsappCost, 0) * factor;
    const gross = mrr ? Math.round(((mrr - clients.reduce((n, c) => n + c.llmCost + c.whatsappCost, 0)) / mrr) * 100) : 0;
    const msgs = days.reduce((n, x) => n + x.messages, 0);
    const ai = Math.round(days.reduce((n, x) => n + x.messages * x.aiShare, 0) / Math.max(1, msgs));
    return { clients, days, from, to, inv, revenue, mrr, llm, wa, gross, msgs, ai, paid, net };
  }, [all, metrics, invoices, range]);

  const expired = channels.filter((c) => c.health === "Needs reconnect");
  const webhook = channels.filter((c) => c.health === "Webhook failing");
  const failed = invoices.filter((i) => ["Failed", "Due"].includes(i.status));
  const atRisk = d.clients.filter((c) => c.health === "At risk" || c.status === "Suspended");
  const rev = d.days.map((x) => ({ label: x.date.slice(5), Revenue: d.inv.filter((i) => i.date === x.date && d.paid(i)).reduce((n, i) => n + d.net(i), 0) }));

  return (
    <>
      <PageHeader eyebrow="Platform pulse · Admin" title="A healthy platform starts with a clear picture." description="Business growth, reliable channels and costs worth watching."
        actions={<><Select aria-label="Reporting window" className="w-auto" value={range} onChange={(e) => setRange(e.target.value)}>{["7", "14", "30"].map((n) => <option key={n} value={n}>Last {n} days</option>)}</Select><Button icon={<Download className="size-4" />} onClick={() => { download("admin-platform-snapshot.csv", toCsv([{ metric: "MRR", value: d.mrr }, { metric: "active_clients", value: d.clients.filter((c) => ["Active", "Trial"].includes(c.status)).length }, { metric: "messages_demo", value: d.msgs }, { metric: "LLM_cost_estimate", value: Math.round(d.llm) }, { metric: "net_invoice_revenue", value: d.revenue }])); toast("Snapshot exported.", "success"); }}>Export snapshot</Button></>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Monthly recurring revenue" value={money(Math.round(d.mrr))} hint="active paid subscriptions" icon={<Banknote className="size-4" />} accent />
        <Stat label="Active clients" value={d.clients.filter((c) => ["Active", "Trial"].includes(c.status)).length} hint="paid and trial" icon={<Building2 className="size-4" />} />
        <Stat label="Signups in period" value={d.days.reduce((n, x) => n + x.signups, 0)} hint="historical series" icon={<UserPlus className="size-4" />} />
        <Stat label="Churned clients" value={all.filter((c) => c.status === "Churned").length} hint="recorded status" icon={<UserMinus className="size-4" />} />
        <Stat label="Messages in period" value={d.msgs.toLocaleString()} hint="platform traffic" icon={<MessagesSquare className="size-4" />} />
        <Stat label="AI-handled share" value={`${d.ai}%`} hint="weighted daily" icon={<Sparkles className="size-4" />} />
        <Stat label="LLM cost estimate" value={money(Math.round(d.llm))} hint="seed cost × days / 30" icon={<Cpu className="size-4" />} />
        <Stat label="Template cost" value={money(Math.round(d.wa))} hint="provider estimate" icon={<FileText className="size-4" />} />
        <Stat label="Gross margin" value={`${d.gross}%`} hint="MRR less sample cost" icon={<TrendingUp className="size-4" />} />
        <Stat label="Net invoice revenue" value={money(d.revenue)} hint="paid less refunds" icon={<Receipt className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><CardHeader title="Revenue collected" description="Net paid invoice amounts by invoice date" /><div className="p-5"><LineSeries data={rev} series={[{ key: "Revenue" }]} fmt={(n) => money(n)} /></div></Card>
        <Card><CardHeader title="New workspaces" description="Illustrative daily signups" /><div className="p-5"><BarSeries data={d.days.map((x) => ({ label: x.date.slice(5), Signups: x.signups }))} series={[{ key: "Signups" }]} /></div></Card>
        <Card><CardHeader title="Messages handled" description="Illustrative platform volume" /><div className="p-5"><LineSeries data={d.days.map((x) => ({ label: x.date.slice(5), Messages: x.messages }))} series={[{ key: "Messages", color: "#3ccf91" }]} /></div></Card>
        <Card><CardHeader title="Cost and revenue" description="Daily sample operating costs vs. net invoice revenue" /><div className="p-5"><LineSeries legend data={d.days.map((x, i) => ({ label: x.date.slice(5), Revenue: rev[i]?.Revenue ?? 0, Costs: Math.round(x.cost * 0.35) }))} series={[{ key: "Revenue" }, { key: "Costs", color: "#f5b544" }]} /></div></Card>
      </div>

      <Card className="mt-6"><CardHeader title="The right place for a little attention" description="Linked alerts — each opens the page that resolves it." />
        <div className="grid divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
          {[
            { Icon: Radio, label: "Expired tokens", n: expired.length, href: "/admin/channels", tone: "text-danger" },
            { Icon: AlertTriangle, label: "Webhook failures", n: webhook.length, href: "/admin/channels", tone: "text-warning" },
            { Icon: Receipt, label: "Failed or due invoices", n: failed.length, href: "/admin/billing", tone: "text-warning" },
            { Icon: Building2, label: "Clients at risk", n: atRisk.length, href: "/admin/clients?health=At risk", tone: "text-danger" },
          ].map(({ Icon, label, n, href, tone }) => (
            <Link key={label} href={href} className="group flex items-center justify-between gap-4 p-6 transition-colors hover:bg-line">
              <div className="flex items-center gap-4"><span className={`grid size-11 place-items-center rounded-xl bg-raised ${n ? tone : "text-success"}`}><Icon className="size-5" /></span><div><div className="num text-2xl font-bold">{n}</div><div className="text-sm text-ink-3">{label}</div></div></div>
              <ArrowRight className="size-4 text-ink-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </Card>
    </>
  );
}
