"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Bot, Clock, Handshake, MessageSquare, PackageX, ShoppingBag, TrendingUp, Wallet, CheckCircle2, Circle } from "lucide-react";
import { Badge, Button, Card, CardHeader, ChannelChip, PageHeader, Progress, Stat, StatusBadge, Tabs, EmptyState } from "@/components/ui";
import { Donut, LineSeries } from "@/components/charts/charts";
import { useStore, money } from "@/lib/store";
import type { Channel, Conversation, Daily, Order, Product } from "@/lib/data";

export default function Overview() {
  const client = useStore<any>("client", {});
  const daily = useStore<Daily[]>("daily", []);
  const conversations = useStore<Conversation[]>("conversations", []);
  const orders = useStore<Order[]>("orders", []);
  const channels = useStore<Channel[]>("channels", []);
  const products = useStore<Product[]>("products", []);
  const onboarding = useStore<any>("onboarding", {});
  const faqs = useStore<any[]>("faqs", []);
  const [range, setRange] = useState<"7" | "14" | "30">("30");

  const days = daily.slice(-Number(range));
  const totals = useMemo(() => {
    const sum = (k: keyof Daily) => days.reduce((n, d) => n + (d[k] as number), 0);
    const avg = (k: keyof Daily) => (days.length ? days.reduce((n, d) => n + (d[k] as number), 0) / days.length : 0);
    return { messages: sum("messages"), orders: sum("orders"), revenue: sum("revenue"), ai: avg("aiShare"), response: avg("responseTime") };
  }, [days]);

  const byChannel = useMemo(() => {
    const m: Record<string, number> = { Facebook: 0, Instagram: 0, WhatsApp: 0 };
    conversations.forEach((c) => (m[c.channel] = (m[c.channel] || 0) + 1));
    return Object.entries(m).map(([name, value]) => ({ name, value, color: name === "Facebook" ? "#6e93ff" : name === "Instagram" ? "#f074c4" : "#3ccf91" }));
  }, [conversations]);

  const handovers = conversations.filter((c) => c.status === "Needs human").length;
  const lowStock = products.filter((p) => p.status === "Active" && p.stock <= p.threshold);
  const brokenChannels = channels.filter((c) => c.status !== "Connected" || c.tokenHealth !== "Healthy");

  const checklist = [
    { label: "Business profile", done: !!client.name && !!client.phone, href: "/onboarding" },
    { label: "Connect a channel", done: channels.some((c) => c.status === "Connected"), href: "/app/channels" },
    { label: "Add products", done: products.length > 0, href: "/app/products" },
    { label: "Teach your agent", done: faqs.length > 0, href: "/app/knowledge" },
    { label: "Turn the AI agent on", done: !!client.agentLive, href: "/app/agent" },
  ];
  const done = checklist.filter((c) => c.done).length;
  const incomplete = !onboarding.completed && done < checklist.length;

  return (
    <>
      <PageHeader
        eyebrow={client.name}
        title={`Good morning, ${String(client.owner || "there").split(" ")[0]}`}
        description="Here is what your sales agent handled while you were away."
        actions={<Tabs value={range} onChange={setRange} options={[{ value: "7", label: "7 days" }, { value: "14", label: "14 days" }, { value: "30", label: "30 days" }]} />}
      />

      {incomplete && (
        <Card className="mb-6 overflow-hidden border-brand-line">
          <div className="flex flex-wrap items-center justify-between gap-6 p-6">
            <div className="min-w-[260px] flex-1">
              <div className="flex items-center gap-3"><h2 className="text-lg font-semibold tracking-tight">Finish setting up your agent</h2><Badge tone="brand">{done}/{checklist.length}</Badge></div>
              <div className="mt-3 max-w-md"><Progress value={(done / checklist.length) * 100} /></div>
            </div>
            <ul className="grid flex-[2] gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {checklist.map((c) => (
                <li key={c.label}>
                  <Link href={c.href} className="flex items-center gap-2.5 text-sm text-ink-2 hover:text-ink">
                    {c.done ? <CheckCircle2 className="size-[18px] text-success" /> : <Circle className="size-[18px] text-ink-4" />}
                    <span className={c.done ? "line-through opacity-60" : ""}>{c.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Stat label="Conversations" value={totals.messages.toLocaleString()} delta="+12.4%" hint="vs previous" icon={<MessageSquare className="size-4" />} />
        <Stat label="Handled by AI" value={`${totals.ai.toFixed(1)}%`} delta="+2.1%" hint="no human needed" icon={<Bot className="size-4" />} accent />
        <Stat label="Orders collected" value={totals.orders} delta="+8.0%" hint="from chats" icon={<ShoppingBag className="size-4" />} />
        <Stat label="Revenue" value={money(totals.revenue)} delta="+15.2%" hint="attributed" icon={<Wallet className="size-4" />} />
        <Stat label="Avg response" value={`${totals.response.toFixed(1)}s`} delta="-0.3s" good hint="faster" icon={<Clock className="size-4" />} />
        <Stat label="Needs a human" value={handovers} hint="waiting in inbox" icon={<Handshake className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardHeader title="Messages over time" description={`Last ${range} days across all channels`} />
          <div className="p-5"><LineSeries data={days.map((d) => ({ label: d.date.slice(5), Messages: d.messages, Orders: d.orders * 6 }))} series={[{ key: "Messages", color: "var(--brand)" }, { key: "Orders", color: "#6ea0ff" }]} height={300} legend /></div>
        </Card>
        <Card>
          <CardHeader title="Conversations by channel" />
          <div className="p-6"><Donut data={byChannel} center={<div><div className="num text-3xl font-bold tracking-tight">{conversations.length}</div><div className="text-xs text-ink-3">threads</div></div>} /></div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Recent conversations" action={<Button href="/app/inbox" variant="ghost" size="sm">Open inbox <ArrowRight className="size-3.5" /></Button>} />
          {conversations.length === 0 ? (
            <EmptyState title="No conversations yet" text="Once a channel is connected, customer threads appear here." action={<Button href="/app/channels" variant="primary">Connect a channel</Button>} />
          ) : (
            <ul>
              {conversations.slice(0, 6).map((c) => (
                <li key={c.id} className="border-b border-line last:border-0">
                  <Link href={`/app/inbox?c=${c.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-line">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold text-black/70" style={{ background: c.colour }}>{c.initials}</span>
                      <div className="min-w-0"><div className="flex items-center gap-2 text-sm font-medium">{c.name}<ChannelChip type={c.channel} compact /></div><div className="truncate text-[13px] text-ink-3">{c.messages[c.messages.length - 1]?.text}</div></div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5"><StatusBadge status={c.status} /><span className="text-xs text-ink-4">{c.time} ago</span></div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Channel health" />
            <ul>
              {channels.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5 last:border-0">
                  <div className="flex items-center gap-3"><ChannelChip type={c.type} compact /><div><div className="text-sm font-medium">{c.name}</div><div className="text-xs text-ink-3">Token {c.tokenHealth.toLowerCase()} · {c.lastEvent}</div></div></div>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Needs your attention" />
            <ul className="divide-y divide-line text-sm">
              {handovers > 0 && <Attention icon={<Handshake className="size-4" />} tone="warning" text={`${handovers} customers are waiting for a human`} href="/app/inbox" />}
              {lowStock.slice(0, 3).map((p) => <Attention key={p.id} icon={<PackageX className="size-4" />} tone="danger" text={`${p.name}: ${p.stock === 0 ? "out of stock" : `only ${p.stock} left`}`} href="/app/products" />)}
              {brokenChannels.map((c) => <Attention key={c.id} icon={<AlertTriangle className="size-4" />} tone="danger" text={`${c.name}: ${c.status.toLowerCase()}`} href="/app/channels" />)}
              {handovers === 0 && !lowStock.length && !brokenChannels.length && <li className="px-5 py-8 text-center text-ink-3"><TrendingUp className="mx-auto mb-2 size-5" />Nothing needs attention.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

function Attention({ icon, text, href, tone }: { icon: React.ReactNode; text: string; href: string; tone: "warning" | "danger" }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-5 py-3.5 hover:bg-line">
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tone === "danger" ? "bg-danger/12 text-danger" : "bg-warning/12 text-warning"}`}>{icon}</span>
        <span className="flex-1 text-ink-2">{text}</span>
        <ArrowRight className="size-4 text-ink-4" />
      </Link>
    </li>
  );
}
