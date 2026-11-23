"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Cpu, Download, Gauge, TrendingUp } from "lucide-react";
import { Badge, Button, Card, CardHeader, PageHeader, Progress, Select, Stat, Table, Td, Th } from "@/components/ui";
import { BarSeries, Donut, LineSeries } from "@/components/charts/charts";
import { mrrOf, usageOf } from "@/lib/admin";
import { useStore, money, download, toCsv } from "@/lib/store";
import type { Client } from "@/lib/data";

export default function UsagePage() {
  const all = useStore<Client[]>("admin.clients", []);
  const metrics = useStore<any[]>("admin.systemMetrics", []);
  const [sort, setSort] = useState("margin");
  const clients = all.filter((c) => c.status !== "Deleted");
  const rows = useMemo(() => clients.map((c) => { const m = mrrOf(c), cost = c.llmCost + c.whatsappCost; const u = usageOf(c); return { c, m, cost, margin: m - cost, pct: m ? Math.round(((m - cost) / m) * 100) : -100, over: u.percent > 100, usage: u.percent, overage: Math.max(0, u.used - u.limit) }; }).sort((a, b) => sort === "cost" ? b.cost - a.cost : sort === "usage" ? b.usage - a.usage : a.pct - b.pct), [clients, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  const totals = rows.reduce((t, r) => ({ cost: t.cost + r.cost, llm: t.llm + r.c.llmCost, wa: t.wa + r.c.whatsappCost, mrr: t.mrr + r.m, tokens: t.tokens + r.c.llmTokens }), { cost: 0, llm: 0, wa: 0, mrr: 0, tokens: 0 });
  const unprofitable = rows.filter((r) => r.margin < 0 && r.m > 0);
  const small = Math.round(totals.tokens * 0.72), large = totals.tokens - small;
  const forecast = metrics.slice(-14).map((m, i, a) => ({ label: m.date.slice(5), Actual: i < 10 ? Math.round(m.cost * 0.35) : undefined, Forecast: i >= 9 ? Math.round(a[9].cost * 0.35 * (1 + (i - 9) * 0.03)) : undefined }));

  return (
    <>
      <PageHeader eyebrow="Commercial · Admin" title="Where the margin lives." description="Per-client AI and WhatsApp costs against what each plan earns." actions={<><Select aria-label="Sort" className="w-auto" value={sort} onChange={(e) => setSort(e.target.value)}><option value="margin">Lowest margin first</option><option value="cost">Highest cost</option><option value="usage">Highest usage</option></Select><Button icon={<Download className="size-4" />} onClick={() => download("admin-usage.csv", toCsv(rows.map((r) => ({ client: r.c.name, plan: r.c.plan, mrr: r.m, llm_cost: r.c.llmCost, whatsapp_cost: r.c.whatsappCost, margin_pct: r.pct, usage_pct: r.usage, tokens: r.c.llmTokens }))))}>Export</Button></>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total tokens (month)" value={(totals.tokens / 1e6).toFixed(1) + "M"} icon={<Cpu className="size-4" />} />
        <Stat label="LLM cost" value={money(totals.llm)} hint="illustrative" />
        <Stat label="WhatsApp cost" value={money(totals.wa)} hint="illustrative" />
        <Stat label="Blended margin" value={`${totals.mrr ? Math.round(((totals.mrr - totals.cost) / totals.mrr) * 100) : 0}%`} icon={<TrendingUp className="size-4" />} accent />
      </div>

      {unprofitable.length > 0 && <div className="mt-6 flex gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger"><AlertTriangle className="size-5 shrink-0" /><div><strong>{unprofitable.length} unprofitable client{unprofitable.length > 1 ? "s" : ""}:</strong> {unprofitable.map((r) => r.c.name).join(", ")}. Consider a plan change or overage billing.</div></div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><CardHeader title="Model mix" description="Share of tokens by model size (illustrative)" /><div className="p-6"><Donut data={[{ name: "Small model", value: small, color: "#3ccf91" }, { name: "Large model", value: large, color: "#6ea0ff" }]} /></div></Card>
        <Card><CardHeader title="Cost forecast" description="Actual daily cost and a +3%/day projection" /><div className="p-5"><LineSeries legend height={230} data={forecast} series={[{ key: "Actual" }, { key: "Forecast", color: "#f5b544" }]} fmt={(n) => money(n)} /></div></Card>
      </div>

      <Card className="mt-6"><CardHeader title="Per-client economics" />
        <Table><thead><tr><Th>Client</Th><Th>Plan</Th><Th>MRR</Th><Th>LLM</Th><Th>WhatsApp</Th><Th>Margin</Th><Th>Usage</Th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.c.id}><Td className="font-medium text-ink">{r.c.name}</Td><Td>{r.c.plan}</Td><Td className="num">{money(r.m)}</Td><Td className="num">{money(r.c.llmCost)}</Td><Td className="num">{money(r.c.whatsappCost)}</Td><Td><Badge tone={r.pct < 0 ? "danger" : r.pct < 40 ? "warning" : "success"}>{r.m ? `${r.pct}%` : "No revenue"}</Badge></Td><Td className="min-w-[150px]"><div className="num mb-1 text-xs">{r.usage}%{r.over && <span className="ml-2 text-warning">over by {r.overage.toLocaleString()}</span>}</div><Progress value={Math.min(100, r.usage)} tone={r.over ? "warning" : "brand"} /></Td></tr>)}</tbody></Table></Card>
      <div className="mt-6"><Card><CardHeader title="Cost by client" description="Top 8 by combined AI + provider cost" /><div className="p-5"><BarSeries horizontal data={[...rows].sort((a, b) => b.cost - a.cost).slice(0, 8).map((r) => ({ label: r.c.name.slice(0, 16), Cost: r.cost }))} series={[{ key: "Cost", color: "#b07cff" }]} height={300} fmt={(n) => money(n)} /></div></Card></div>
      <p className="mt-4 text-xs text-ink-4"><Gauge className="mr-1 inline size-3" />All metering and costs are illustrative seeds, not real API usage.</p>
    </>
  );
}
