"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Gauge, Server, Timer, TriangleAlert } from "lucide-react";
import { Badge, Button, Card, CardHeader, PageHeader, Select, Stat, StatusBadge, Switch } from "@/components/ui";
import { LineSeries, BarSeries } from "@/components/charts/charts";
import { useStore } from "@/lib/store";

type Evt = { id: number; at: string; level: "error" | "warn" | "info"; service: string; message: string };
const MSGS: [Evt["level"], string, string][] = [
  ["error", "webhook-worker", "Signature verification failed for POST /webhooks/meta (retrying)"],
  ["warn", "llm-gateway", "Latency above 2.5s for 3 consecutive requests"],
  ["info", "queue", "Drained 38 messages in 1.2s"],
  ["warn", "rate-limit", "Graph API rate limit at 82% for app"],
  ["error", "template-sync", "Template status poll timed out after 10s"],
  ["info", "scheduler", "Published 4 scheduled posts"],
  ["error", "llm-gateway", "Upstream 529 overloaded — fell back to small model"],
  ["info", "worker", "Worker w-3 restarted cleanly"],
];
const WORKERS = [["w-1", "webhooks", "Running", 41], ["w-2", "llm-replies", "Running", 68], ["w-3", "templates", "Running", 22], ["w-4", "scheduler", "Degraded", 91], ["w-5", "exports", "Idle", 3]] as const;

export default function Monitoring() {
  const metrics = useStore<any[]>("admin.systemMetrics", []);
  const [range, setRange] = useState("14");
  const [live, setLive] = useState(true);
  const [log, setLog] = useState<Evt[]>(() => MSGS.slice(0, 5).map((m, i) => ({ id: i, at: new Date(Date.now() - i * 41000).toISOString(), level: m[0], service: m[1], message: m[2] })));
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!live) return;
    let n = 100;
    const t = setInterval(() => { const m = MSGS[Math.floor(Math.random() * MSGS.length)]; setLog((l) => [{ id: n++, at: new Date().toISOString(), level: m[0], service: m[1], message: m[2] }, ...l].slice(0, 40)); }, 5000);
    return () => clearInterval(t);
  }, [live]);

  const days = useMemo(() => metrics.slice(-Number(range)), [metrics, range]);
  const last = days.at(-1);
  const avg = (k: string) => (days.length ? days.reduce((n, d) => n + d[k], 0) / days.length : 0);
  const shown = log.filter((e) => filter === "all" || e.level === filter);

  return (
    <>
      <PageHeader eyebrow="Operations · Admin" title="Everything running, at a glance." description="Queues, latency, failures and a live error stream." actions={<><Select aria-label="Time range" className="w-auto" value={range} onChange={(e) => setRange(e.target.value)}>{["7", "14", "30"].map((n) => <option key={n} value={n}>Last {n} days</option>)}</Select></>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Uptime" value={`${last?.uptime ?? 99.98}%`} icon={<Server className="size-4" />} accent />
        <Stat label="Queue depth" value={last?.queueDepth ?? 0} hint="messages waiting" icon={<Activity className="size-4" />} />
        <Stat label="Failure rate" value={`${avg("failureRate").toFixed(1)}%`} hint="period average" icon={<TriangleAlert className="size-4" />} />
        <Stat label="P50 latency" value={`${avg("latency").toFixed(1)}s`} hint="reply generation" icon={<Timer className="size-4" />} />
        <Stat label="Rate-limit hits" value={days.reduce((n, d) => n + d.rateLimitHits, 0)} hint="in period" icon={<Gauge className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><CardHeader title="Queue depth" /><div className="p-5"><BarSeries height={220} data={days.map((d) => ({ label: d.date.slice(5), Depth: d.queueDepth }))} series={[{ key: "Depth" }]} /></div></Card>
        <Card><CardHeader title="Latency" description="Seconds, simulated" /><div className="p-5"><LineSeries height={220} data={days.map((d) => ({ label: d.date.slice(5), Seconds: d.latency }))} series={[{ key: "Seconds", color: "#6ea0ff" }]} /></div></Card>
        <Card><CardHeader title="Failure rate" description="Percent of failed jobs" /><div className="p-5"><LineSeries height={220} data={days.map((d) => ({ label: d.date.slice(5), "Failures %": d.failureRate }))} series={[{ key: "Failures %", color: "#ff5c5c" }]} /></div></Card>
        <Card><CardHeader title="Workers" description="Simulated process health" />
          <ul className="divide-y divide-line">{WORKERS.map(([id, role, st, load]) => <li key={id} className="flex items-center justify-between gap-4 px-5 py-3.5"><div><div className="font-mono text-sm text-ink">{id}</div><div className="text-xs text-ink-3">{role}</div></div><div className="flex items-center gap-4"><div className="w-28"><div className="mb-1 text-right text-xs num text-ink-3">{load}% CPU</div><div className="h-1.5 overflow-hidden rounded-full bg-line"><div className={`h-full ${load > 85 ? "bg-warning" : "bg-brand"}`} style={{ width: `${load}%` }} /></div></div><StatusBadge status={st === "Running" ? "Connected" : st === "Degraded" ? "At risk" : "Draft"} /></div></li>)}</ul></Card>
      </div>

      <Card className="mt-6"><CardHeader title="Error log" description={live ? "Streaming — a new simulated event arrives about every 5 seconds." : "Paused."} action={<div className="flex items-center gap-3"><Select aria-label="Level" className="w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All levels</option><option value="error">Errors</option><option value="warn">Warnings</option><option value="info">Info</option></Select><label className="flex items-center gap-2 text-sm text-ink-3">Live <Switch checked={live} onChange={setLive} label="Live log" /></label></div>} />
        <ul className="scroll-y max-h-[420px] divide-y divide-line font-mono text-[13px]">{shown.map((e) => <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2.5"><span className="text-ink-4">{new Date(e.at).toLocaleTimeString("en-GB")}</span><Badge tone={e.level === "error" ? "danger" : e.level === "warn" ? "warning" : "neutral"}>{e.level}</Badge><span className="text-ink-3">{e.service}</span><span className="text-ink-2">{e.message}</span></li>)}{!shown.length && <li className="px-5 py-8 text-center text-ink-3">No events at this level.</li>}</ul>
        <div className="border-t border-line p-3"><Button size="sm" variant="ghost" onClick={() => setLog([])}>Clear log</Button></div></Card>
    </>
  );
}
