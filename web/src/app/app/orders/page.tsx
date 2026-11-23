"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Bot, Download, LayoutGrid, List, Search } from "lucide-react";
import { Badge, Button, Card, ChannelChip, Drawer, EmptyState, Input, PageHeader, Select, StatusBadge, Table, Td, Th, Tabs } from "@/components/ui";
import { store, useStore, money, download, toCsv } from "@/lib/store";
import { useUI } from "@/components/providers";
import type { Order } from "@/lib/data";

const COLS = ["New", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"];

export default function OrdersPage() {
  return <Suspense><Orders /></Suspense>;
}

function Orders() {
  const params = useSearchParams();
  const { toast, confirm } = useUI();
  const orders = useStore<Order[]>("orders", []);
  const leads = useStore<any[]>("leads", []);
  const [tab, setTab] = useState<"orders" | "leads">("orders");
  const [view, setView] = useState<"board" | "list">("board");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(params.get("id"));
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  useEffect(() => { const id = params.get("id"); if (id) setOpenId(id); }, [params]);

  const list = orders.filter((o) => (o.id + o.customer + o.phone).toLowerCase().includes(q.toLowerCase()));
  const open = orders.find((o) => o.id === openId);

  const move = (id: string, status: string) => {
    const o = orders.find((x) => x.id === id);
    if (!o || o.status === status) return;
    store.patch("orders", id, { status });
    toast(`${id} moved to ${status}.`, "success");
  };
  const exportCsv = () => {
    download("orders.csv", toCsv(orders.map((o) => ({ id: o.id, customer: o.customer, phone: o.phone, address: o.address, total: o.total, status: o.status, payment: o.payment, channel: o.channel, createdAt: o.createdAt }))));
    toast("Orders exported.", "success");
  };

  const OrderCard = ({ o }: { o: Order }) => (
    <div
      draggable
      onDragStart={(e) => { setDragId(o.id); e.dataTransfer.setData("text/plain", o.id); e.dataTransfer.effectAllowed = "move"; }}
      onDragEnd={() => { setDragId(null); setOver(null); }}
      className={clsx("cursor-grab rounded-lg border border-line bg-surface p-3.5 transition-all active:cursor-grabbing hover:border-line-strong", dragId === o.id && "opacity-40")}
    >
      <button onClick={() => setOpenId(o.id)} className="block w-full text-left">
        <div className="flex items-center justify-between"><span className="num text-[13px] font-semibold">{o.id}</span><span className="num text-[13px] font-semibold text-brand">{money(o.total)}</span></div>
        <div className="mt-1 text-sm text-ink-2">{o.customer}</div>
        <div className="mt-2.5 flex items-center justify-between"><ChannelChip type={o.channel} compact />{o.aiCollected && <span className="inline-flex items-center gap-1 text-[11px] text-ink-3"><Bot className="size-3 text-brand" /> AI-collected</span>}</div>
      </button>
      <label className="mt-3 block"><span className="sr-only">Move {o.id} to</span>
        <Select aria-label={`Move ${o.id} to`} value={o.status} onChange={(e) => move(o.id, e.target.value)} className="!h-8 !text-xs">{COLS.map((c) => <option key={c}>{c}</option>)}</Select>
      </label>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Orders & leads"
        description="Everything your agent collected, ready to confirm and ship."
        actions={<><Tabs value={tab} onChange={setTab} options={[{ value: "orders", label: "Orders", count: orders.length }, { value: "leads", label: "Leads", count: leads.length }]} /><Button onClick={exportCsv} icon={<Download className="size-4" />}>Export CSV</Button></>}
      />

      {tab === "orders" ? (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" /><Input aria-label="Search orders" placeholder="Search order, customer or phone…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" /></div>
            <div className="inline-flex rounded-lg border border-line bg-bg-deep/50 p-1">
              {([["board", LayoutGrid, "Board"], ["list", List, "List"]] as const).map(([v, Icon, l]) => <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={clsx("inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-medium", view === v ? "bg-raised text-ink" : "text-ink-3 hover:text-ink")}><Icon className="size-4" />{l}</button>)}
            </div>
          </div>

          {view === "board" ? (
            <div className="scroll-y grid auto-cols-[minmax(250px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-3">
              {COLS.map((col) => {
                const items = list.filter((o) => o.status === col);
                return (
                  <section key={col} aria-label={col} onDragOver={(e) => { e.preventDefault(); setOver(col); }} onDragLeave={() => setOver(null)} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain") || dragId; if (id) move(id, col); setOver(null); }} className={clsx("min-h-[320px] rounded-xl border bg-bg-deep/40 p-3 transition-colors", over === col ? "border-brand bg-brand-soft" : "border-line")}>
                    <header className="mb-3 flex items-center justify-between px-1"><h2 className="text-sm font-semibold">{col}</h2><Badge>{items.length}</Badge></header>
                    <div className="space-y-2.5">{items.map((o) => <OrderCard key={o.id} o={o} />)}{!items.length && <div className="rounded-lg border border-dashed border-line px-3 py-8 text-center text-xs text-ink-4">Drop an order here</div>}</div>
                  </section>
                );
              })}
            </div>
          ) : (
            <Card>
              {list.length === 0 ? <EmptyState title="No orders found" text="Orders collected by your agent appear here." /> : (
                <Table>
                  <thead><tr><Th>Order</Th><Th>Customer</Th><Th>Total</Th><Th>Payment</Th><Th>Channel</Th><Th>Status</Th></tr></thead>
                  <tbody>{list.map((o) => (
                    <tr key={o.id} className="cursor-pointer transition-colors hover:bg-line" onClick={() => setOpenId(o.id)}>
                      <Td className="num font-semibold text-ink">{o.id}</Td><Td>{o.customer}<div className="text-xs text-ink-3">{o.phone}</div></Td><Td className="num">{money(o.total)}</Td><Td>{o.payment}</Td><Td><ChannelChip type={o.channel} /></Td><Td><StatusBadge status={o.status} /></Td>
                    </tr>))}</tbody>
                </Table>
              )}
            </Card>
          )}
        </>
      ) : (
        <Card>
          {leads.length === 0 ? <EmptyState title="No leads yet" text="Interested customers who haven’t ordered appear here." /> : (
            <Table>
              <thead><tr><Th>Name</Th><Th>Interested in</Th><Th>Channel</Th><Th>Phone</Th><Th>Status</Th></tr></thead>
              <tbody>{leads.map((l) => <tr key={l.id}><Td className="font-medium text-ink">{l.name}</Td><Td>{l.interest}</Td><Td><ChannelChip type={l.channel} /></Td><Td className="num">{l.phone}</Td><Td><StatusBadge status={l.status} /></Td></tr>)}</tbody>
            </Table>
          )}
        </Card>
      )}

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open ? `Order ${open.id}` : "Order"} footer={open && (
        <>
          {open.status === "New" && <Button variant="primary" onClick={() => { move(open.id, "Confirmed"); }}>Confirm order</Button>}
          {open.status !== "Cancelled" && open.status !== "Delivered" && <Button variant="danger" onClick={async () => { if (await confirm({ title: "Cancel this order?", message: "The customer will not be notified automatically.", danger: true, confirmLabel: "Cancel order" })) move(open.id, "Cancelled"); }}>Cancel order</Button>}
        </>
      )}>
        {open && (
          <div className="space-y-6">
            <div className="flex items-center gap-2"><StatusBadge status={open.status} />{open.aiCollected && <Badge tone="brand"><Bot className="size-3" /> AI-collected</Badge>}<ChannelChip type={open.channel} /></div>
            <dl className="grid grid-cols-2 gap-5 text-sm">
              {[["Customer", open.customer], ["Phone", open.phone], ["Address", open.address], ["Payment", open.payment], ["Placed", String(open.createdAt).slice(0, 10)], ["Total", money(open.total)]].map(([k, v]) => <div key={k}><dt className="text-xs uppercase tracking-wider text-ink-4">{k}</dt><dd className="mt-1 font-medium">{v}</dd></div>)}
            </dl>
            <div><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-4">Items</h3>
              <div className="divide-y divide-line rounded-xl border border-line">{open.items.map((i, k) => <div key={k} className="flex items-center justify-between gap-4 p-4 text-sm"><div><div className="font-medium">{i.name}</div><div className="text-xs text-ink-3">{i.size} · {i.colour} · × {i.quantity}</div></div><div className="num font-semibold">{money(i.price * i.quantity)}</div></div>)}</div></div>
            <Select aria-label="Update status" value={open.status} onChange={(e) => move(open.id, e.target.value)}>{COLS.map((c) => <option key={c}>{c}</option>)}</Select>
            <Button href={`/app/inbox?id=${open.conversationId}`} variant="outline" className="w-full">Open conversation</Button>
          </div>
        )}
      </Drawer>
    </>
  );
}
