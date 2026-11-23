"use client";

import { useMemo, useState } from "react";
import { Banknote, Download, MessagesSquare, ShoppingBag, Sparkles } from "lucide-react";
import { Button, Card, CardHeader, Field, Input, PageHeader, Select, Stat } from "@/components/ui";
import { BarSeries, Donut, LineSeries } from "@/components/charts/charts";
import { useStore, money, download, toCsv } from "@/lib/store";
import { useUI } from "@/components/providers";
import type { Conversation, Daily, Message, Order } from "@/lib/data";

const dhakaDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const shift = (s: string, n: number) => dhakaDay(new Date(new Date(s + "T12:00:00+06:00").getTime() + n * 86400000));
const key = (s?: string) => (s ? dhakaDay(new Date(s.length === 10 ? s + "T12:00:00+06:00" : s)) : "");

export default function AnalyticsPage() {
  const { toast } = useUI();
  const daily = useStore<Daily[]>("daily", []);
  const conversations = useStore<(Conversation & Record<string, any>)[]>("conversations", []);
  const orders = useStore<Order[]>("orders", []);
  const messages = useStore<Message[]>("messages", []);
  // Seed history ends 30 Oct 2026; anchor "today" so the sample window is populated.
  const latest = daily.at(-1)?.date ?? dhakaDay(new Date());
  const today = latest < dhakaDay(new Date()) ? latest : dhakaDay(new Date());
  const [period, setPeriod] = useState("30");
  const [start, setStart] = useState(() => shift(today, -29));
  const [end, setEnd] = useState(today);

  const pick = (v: string) => { setPeriod(v); if (v !== "custom") { setEnd(today); setStart(shift(today, 1 - +v)); } };
  const applyCustom = (a: string, b: string) => { if (a > b || b > today) return toast("Choose an ordered date range ending no later than the last sample day.", "warning"); setStart(a); setEnd(b); };
  const inRange = (s?: string) => { const d = key(s); return d >= start && d <= end; };

  const d = useMemo(() => {
    const series = daily.filter((x) => x.date >= start && x.date <= end);
    const cs = conversations.filter((c) => inRange(c.lastCustomerAt || c.createdAt || c.messages[0]?.createdAt));
    const ords = orders.filter((o) => inRange(o.createdAt));
    const valid = ords.filter((o) => o.status !== "Cancelled");
    const msgs = messages.filter((m) => m.role === "customer" && inRange(m.createdAt));
    const weights = series.reduce((n, x) => n + x.messages, 0);
    const ai = Math.round(series.reduce((n, x) => n + x.messages * x.aiShare, 0) / Math.max(1, weights));
    const response = series.reduce((n, x) => n + x.responseTime, 0) / Math.max(1, series.length);
    return { series, cs, ords, valid, msgs, ai, response };
  }, [daily, conversations, orders, messages, start, end]); // eslint-disable-line react-hooks/exhaustive-deps

  const labels = (x: Daily) => x.date.slice(5);
  const revenue = d.valid.reduce((s, o) => s + o.total, 0);
  const convIds = new Set(d.cs.map((c) => c.id));
  const ordered = new Set(d.valid.filter((o) => convIds.has(o.conversationId)).map((o) => o.conversationId));
  const confirmed = new Set(d.valid.filter((o) => convIds.has(o.conversationId) && ["Confirmed", "Packed", "Shipped", "Delivered"].includes(o.status)).map((o) => o.conversationId));
  const engaged = d.cs.filter((c) => ordered.has(c.id) || c.messages.some((m) => m.role === "customer" && /price|order|shirt|পাঞ্জাবি|অর্ডার|দাম|koto|available|tee/i.test(m.text))).length;
  const funnel = [{ label: "Conversations", v: d.cs.length }, { label: "Product enquiries", v: engaged }, { label: "Ordered", v: ordered.size }, { label: "Confirmed+", v: confirmed.size }];
  const sold = new Map<string, number>();
  d.valid.forEach((o) => o.items.forEach((i) => sold.set(i.name, (sold.get(i.name) || 0) + i.quantity)));
  const top = [...sold].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([n, v]) => ({ label: n.slice(0, 22), Units: v }));
  const groups: Record<string, number> = { Price: 0, Delivery: 0, Availability: 0, Payments: 0, Returns: 0, Other: 0 };
  d.msgs.forEach((m) => { const q = m.text.toLowerCase(); groups[/price|দাম|koto/.test(q) ? "Price" : /deliver|shipping|ডেলিভারি/.test(q) ? "Delivery" : /available|stock|size|সাইজ/.test(q) ? "Availability" : /pay|bkash|nagad|বিকাশ/.test(q) ? "Payments" : /return|exchange|রিটার্ন/.test(q) ? "Returns" : "Other"]++; });
  const byChannel = ["Facebook", "Instagram", "WhatsApp"].map((c, i) => ({ name: c, value: d.cs.filter((x) => x.channel === c).length, color: ["#6e93ff", "#f074c4", "#3ccf91"][i] }));

  const exportCsv = () => {
    download(`salespilot-analytics-${start}-${end}.csv`, toCsv(d.series.map((r) => { const o = d.ords.filter((x) => key(x.createdAt) === r.date); return { date: r.date, messages_demo: r.messages, ai_share_demo_pct: r.aiShare, response_time_demo_s: r.responseTime, orders_saved: o.length, revenue_non_cancelled_bdt: o.filter((x) => x.status !== "Cancelled").reduce((s, x) => s + x.total, 0) }; })));
    toast("Report exported.", "success");
  };

  const charts: [string, string, React.ReactNode][] = [
    ["Customer conversation activity", "Historical message volume + new local messages", <LineSeries key="a" data={d.series.map((r) => ({ label: labels(r), Messages: r.messages }))} series={[{ key: "Messages" }]} />],
    ["Response time", "Average simulated first response, in seconds", <LineSeries key="b" data={d.series.map((r) => ({ label: labels(r), Seconds: r.responseTime }))} series={[{ key: "Seconds", color: "#6ea0ff" }]} />],
    ["AI-handled share", "Daily percentage of messages handled by AI", <LineSeries key="c" data={d.series.map((r) => ({ label: labels(r), "AI share (%)": r.aiShare }))} series={[{ key: "AI share (%)", color: "#3ccf91" }]} />],
    ["From question to order", "Unique customer threads · not a cohort attribution model", <BarSeries key="d" data={funnel.map((f) => ({ label: f.label, Threads: f.v }))} series={[{ key: "Threads" }]} />],
    ["Products that move", "Units in non-cancelled saved orders", <BarSeries key="e" horizontal data={top} series={[{ key: "Units", color: "#f5b544" }]} />],
    ["Questions customers ask", "Categorised from saved customer messages", <BarSeries key="f" data={Object.entries(groups).map(([label, v]) => ({ label, Questions: v }))} series={[{ key: "Questions", color: "#b07cff" }]} />],
    ["Where conversations start", "Customer threads by channel in this period", <Donut key="g" data={byChannel} />],
    ["How conversations feel", "Illustrative daily sentiment percentages", <BarSeries key="h" stacked legend data={d.series.map((r) => ({ label: labels(r), Positive: r.sentiment, Neutral: Math.round((100 - r.sentiment) * 0.7), "Needs care": 100 - r.sentiment - Math.round((100 - r.sentiment) * 0.7) }))} series={[{ key: "Positive", color: "#3ccf91" }, { key: "Neutral", color: "#6ea0ff" }, { key: "Needs care", color: "#ff8fb1" }]} />],
  ];

  return (
    <>
      <PageHeader eyebrow="Insights, not guesswork" title="A clearer view of what’s working." description="Find the patterns behind your conversations, questions and next sale." actions={<Button icon={<Download className="size-4" />} onClick={exportCsv}>Export report</Button>} />
      <Card className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-5 p-5">
          <div><h2 className="font-semibold tracking-tight">Your reporting window</h2><p className="text-[13px] text-ink-3">{start} – {end} · {d.series.length} historical daily samples</p></div>
          <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); applyCustom(String(f.get("start")), String(f.get("end"))); }}>
            <Field label="Period"><Select value={period} onChange={(e) => pick(e.target.value)}>{[["7", "Last 7 days"], ["14", "Last 14 days"], ["30", "Last 30 days"], ["custom", "Custom dates"]].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</Select></Field>
            {period === "custom" && <><Field label="From"><Input type="date" name="start" defaultValue={start} max={today} required /></Field><Field label="Through"><Input type="date" name="end" defaultValue={end} max={today} required /></Field><Button type="submit" variant="primary">Apply</Button></>}
          </form>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Conversations" value={d.cs.length} hint="threads active in period" icon={<MessagesSquare className="size-4" />} />
        <Stat label="AI-handled share" value={`${d.ai}%`} hint="weighted daily share" icon={<Sparkles className="size-4" />} accent />
        <Stat label="Orders collected" value={d.ords.length} hint="playground + inbox" icon={<ShoppingBag className="size-4" />} />
        <Stat label="Revenue influenced" value={money(revenue)} hint="non-cancelled orders" icon={<Banknote className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {charts.map(([title, note, chart]) => <Card key={title}><CardHeader title={title} description={note} /><div className="p-5">{chart}</div></Card>)}
      </div>
      <p className="mt-6 rounded-xl border border-line bg-surface p-4 text-[13px] text-ink-3">Data note: message history, AI share, response times and sentiment include deterministic sample metrics. Orders, products sold, channel counts and question categories use saved local records. All filters use Bangladesh dates. No production tracking or AI sentiment analysis occurs.</p>
    </>
  );
}
