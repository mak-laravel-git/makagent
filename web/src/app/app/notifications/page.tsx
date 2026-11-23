"use client";

import { useState } from "react";
import { AlertTriangle, Bell, CheckCheck, CreditCard, FileBarChart, Handshake, Package, ShoppingBag, Plug } from "lucide-react";
import clsx from "clsx";
import { Button, Card, EmptyState, PageHeader, Tabs } from "@/components/ui";
import { store, useStore } from "@/lib/store";
import type { AppNotification } from "@/lib/data";

const icons: Record<string, React.ComponentType<{ className?: string }>> = { handover: Handshake, stock: Package, order: ShoppingBag, report: FileBarChart, channel: Plug, payment: CreditCard };
const TYPES = ["all", "unread", "handover", "order", "stock", "channel", "payment", "report"];

export default function NotificationsPage() {
  const list = useStore<AppNotification[]>("notifications", []);
  const [f, setF] = useState("all");
  const rows = list.filter((n) => f === "all" || (f === "unread" ? !n.read : n.type === f));
  const unread = list.filter((n) => !n.read).length;
  const when = (s: string) => { const m = Math.max(1, Math.round((Date.now() - new Date(s).getTime()) / 60000)); return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); };

  return (
    <>
      <PageHeader title="Notifications" description={unread ? `${unread} unread` : "You’re all caught up."} actions={<Button icon={<CheckCheck className="size-4" />} disabled={!unread} onClick={() => store.update<AppNotification[]>("notifications", (n) => n.map((x) => ({ ...x, read: true })))}>Mark all read</Button>} />
      <div className="mb-5 overflow-x-auto"><Tabs value={f} onChange={setF} options={TYPES.map((t) => ({ value: t, label: t === "all" ? "All" : t[0].toUpperCase() + t.slice(1), count: t === "unread" ? unread : undefined }))} /></div>
      <Card>
        {rows.length === 0 ? <EmptyState icon={<Bell className="size-5" />} title="Nothing here" text="New activity will appear as it happens." /> : rows.map((n) => {
          const Icon = icons[n.type] || AlertTriangle;
          return (
            <button key={n.id} onClick={() => store.patch("notifications", n.id, { read: !n.read })} className={clsx("flex w-full items-start gap-4 border-b border-line p-5 text-left transition-colors last:border-0 hover:bg-line", !n.read && "bg-brand-soft/50")}>
              <span className={clsx("grid size-10 shrink-0 place-items-center rounded-xl", n.read ? "bg-raised text-ink-3" : "bg-brand-soft text-brand")}><Icon className="size-[18px]" /></span>
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className={clsx("text-sm", !n.read && "font-semibold")}>{n.title}</span><span className="shrink-0 text-xs text-ink-4">{when(n.createdAt)}</span></div><p className="mt-0.5 text-sm text-ink-3">{n.body}</p></div>
              {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
            </button>
          );
        })}
      </Card>
    </>
  );
}
