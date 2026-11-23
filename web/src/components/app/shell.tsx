"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  Activity, BarChart3, Bell, BookOpen, Bot, Boxes, CalendarDays, ChevronsLeft, ChevronsRight, CreditCard, FileText, Gauge, LayoutDashboard,
  LifeBuoy, LogOut, Menu, MessageSquareText, MessagesSquare, Moon, Package, Plug, Search, Settings, ShieldCheck, Sun, Users, X, Cpu, Radio, Wallet, ClipboardList, ShoppingBag, Megaphone, Eye,
} from "lucide-react";
import { Brand, Glyph } from "@/components/site/brand";
import { Avatar, Badge } from "@/components/ui";
import { store, useStore } from "@/lib/store";
import { useUI } from "@/components/providers";
import type { AppNotification, Conversation, Product } from "@/lib/data";

type NavItem = { href: string; label: string; Icon: React.ComponentType<{ className?: string }>; badge?: "inbox" | "notifications" };
type NavGroup = { title: string; items: NavItem[] };

const clientNav: NavGroup[] = [
  { title: "Workspace", items: [
    { href: "/app/overview", label: "Overview", Icon: LayoutDashboard },
    { href: "/app/inbox", label: "Inbox", Icon: MessagesSquare, badge: "inbox" },
    { href: "/app/orders", label: "Orders & leads", Icon: ShoppingBag },
    { href: "/app/analytics", label: "Analytics", Icon: BarChart3 },
  ] },
  { title: "Your agent", items: [
    { href: "/app/agent", label: "Agent", Icon: Bot },
    { href: "/app/knowledge", label: "Knowledge", Icon: BookOpen },
    { href: "/app/products", label: "Products", Icon: Package },
    { href: "/app/comments", label: "Comment rules", Icon: MessageSquareText },
  ] },
  { title: "Grow", items: [
    { href: "/app/posts", label: "Posts", Icon: CalendarDays },
    { href: "/app/templates", label: "Templates", Icon: FileText },
    { href: "/app/channels", label: "Channels", Icon: Plug },
  ] },
  { title: "Account", items: [
    { href: "/app/billing", label: "Billing", Icon: CreditCard },
    { href: "/app/settings", label: "Settings", Icon: Settings },
    { href: "/app/notifications", label: "Notifications", Icon: Bell, badge: "notifications" },
  ] },
];

const adminNav: NavGroup[] = [
  { title: "Platform", items: [
    { href: "/admin/overview", label: "Overview", Icon: LayoutDashboard },
    { href: "/admin/clients", label: "Clients", Icon: Users },
    { href: "/admin/channels", label: "Channel health", Icon: Radio },
    { href: "/admin/meta-status", label: "Meta status", Icon: ShieldCheck },
  ] },
  { title: "Commercial", items: [
    { href: "/admin/plans", label: "Plans & coupons", Icon: Boxes },
    { href: "/admin/billing", label: "Billing", Icon: Wallet },
    { href: "/admin/usage", label: "Usage & margin", Icon: Gauge },
  ] },
  { title: "Operations", items: [
    { href: "/admin/ai-config", label: "AI configuration", Icon: Cpu },
    { href: "/admin/monitoring", label: "Monitoring", Icon: Activity },
    { href: "/admin/templates", label: "Template moderation", Icon: ClipboardList },
    { href: "/admin/support", label: "Support", Icon: LifeBuoy },
    { href: "/admin/compliance", label: "Compliance", Icon: Megaphone },
    { href: "/admin/settings", label: "Platform settings", Icon: Settings },
  ] },
];

export function AppShell({ role, children }: { role: "client" | "admin"; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, toast } = useUI();
  const session = useStore<any>("session", {});
  const client = useStore<any>("client", {});
  const notifications = useStore<AppNotification[]>("notifications", []);
  const conversations = useStore<Conversation[]>("conversations", []);
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [ready, setReady] = useState(false);
  const exiting = useRef(false);
  const nav = role === "admin" ? adminNav : clientNav;

  useEffect(() => {
    try { setCollapsed(localStorage.getItem("sp-collapsed") === "1"); } catch {}
    store.hydrate();
    setReady(true);
  }, []);
  useEffect(() => setMobile(false), [path]);

  // Route guard — the session is read from the store after hydration.
  useEffect(() => {
    if (!ready || exiting.current) return;
    const s = store.session();
    if (!s.role) { router.replace("/login"); return; }
    if (role === "admin" && s.role !== "admin") router.replace("/app/overview");
    if (role === "client" && s.role === "admin" && !s.impersonating) router.replace("/admin/overview");
    if (role === "client" && client?.status === "Suspended" && !s.impersonating) router.replace("/login?blocked=suspended");
  }, [ready, role, router, session.role, session.impersonating, client?.status]);

  const unread = notifications.filter((n) => !n.read).length;
  const inboxUnread = conversations.reduce((n, c) => n + (c.unread || 0), 0);
  const allowed = !!session.role && (role === "admin" ? session.role === "admin" : true);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { localStorage.setItem("sp-collapsed", c ? "0" : "1"); } catch {}
      return !c;
    });
  };

  const exitImpersonation = () => {
    const back = store.get<any>("impersonation");
    exiting.current = true;
    store.set("session", back?.original ?? { role: "admin", clientId: null, impersonating: false, name: "Platform Admin", email: "" });
    if (back?.originalClient) store.set("client", back.originalClient);
    store.set("impersonation", null);
    toast("Exited support session.", "info");
    router.push(back?.returnTo || "/admin/clients");
  };

  if (!ready || !allowed) {
    return <div className="grid min-h-screen place-items-center bg-bg"><Glyph className="size-10 animate-pulse" /></div>;
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className={clsx("flex h-[68px] shrink-0 items-center border-b border-line", collapsed ? "justify-center" : "px-5")}>
        {collapsed ? (
          <Glyph className="size-8" />
        ) : (
          <div className="flex flex-1 items-center justify-between">
            <Brand href={role === "admin" ? "/admin/overview" : "/app/overview"} showMak={false} />
            {role === "admin" && <Badge tone="brand">Admin</Badge>}
          </div>
        )}
      </div>
      <nav className="scroll-y flex-1 space-y-6 px-3 py-5" aria-label={role === "admin" ? "Admin navigation" : "Client navigation"}>
        {nav.map((g) => (
          <div key={g.title}>
            {!collapsed && <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">{g.title}</div>}
            <ul className="space-y-0.5">
              {g.items.map(({ href, label, Icon, badge }) => {
                const active = path === href || path.startsWith(href + "/");
                const count = badge === "inbox" ? inboxUnread : badge === "notifications" ? unread : 0;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      title={collapsed ? label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={clsx("group relative flex items-center gap-3 rounded-lg py-2.5 text-[14px] font-medium transition-colors", collapsed ? "justify-center px-0" : "px-3", active ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-line hover:text-ink")}
                    >
                      {active && <span className="absolute -left-3 bottom-2 top-2 w-[3px] rounded-r-full bg-brand" />}
                      <Icon className="size-[18px] shrink-0" />
                      {!collapsed && <span className="flex-1 truncate">{label}</span>}
                      {count > 0 && (collapsed ? <span className="absolute right-2 top-1.5 size-2 rounded-full bg-brand" /> : <span className="num rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">{count}</span>)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="hidden border-t border-line p-3 lg:block">
        <button onClick={toggleCollapsed} className={clsx("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-ink-3 hover:bg-line hover:text-ink", collapsed && "justify-center px-0")} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <ChevronsRight className="size-4" /> : <><ChevronsLeft className="size-4" /> Collapse</>}
        </button>
      </div>
    </div>
  );

  return (
    <div data-role={role} className="min-h-screen bg-bg">
      <a href="#app-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
      <aside className={clsx("fixed inset-y-0 left-0 z-40 hidden border-r border-line bg-surface transition-[width] duration-200 lg:block", collapsed ? "w-[76px]" : "w-[264px]")}>{sidebar}</aside>
      {mobile && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={() => setMobile(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] animate-fade-in border-r border-line bg-surface">
            <button aria-label="Close menu" onClick={() => setMobile(false)} className="absolute right-3 top-4 z-10 grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-line"><X className="size-4" /></button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className={clsx("transition-[padding] duration-200", collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]")}>
        {session.impersonating && (
          <div className="sticky top-0 z-30 flex flex-wrap items-center justify-center gap-4 bg-warning px-4 py-2 text-[13px] font-medium text-black">
            <Eye className="size-4" /> Support session: viewing {client?.name} as an admin. Changes are audited.
            <button onClick={exitImpersonation} className="rounded-full bg-black/85 px-3 py-1 text-xs font-semibold text-white hover:bg-black">Exit impersonation</button>
          </div>
        )}
        <Topbar role={role} onMenu={() => setMobile(true)} unread={unread} theme={theme} toggleTheme={toggleTheme} session={session} sticky={!session.impersonating} />
        <main id="app-content" className="mx-auto w-full max-w-[1380px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

function Topbar({ role, onMenu, unread, theme, toggleTheme, session, sticky }: { role: "client" | "admin"; onMenu: () => void; unread: number; theme: string; toggleTheme: () => void; session: any; sticky: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [bell, setBell] = useState(false);
  const [menu, setMenu] = useState(false);
  const products = useStore<Product[]>("products", []);
  const conversations = useStore<Conversation[]>("conversations", []);
  const notifications = useStore<AppNotification[]>("notifications", []);
  const clients = useStore<any[]>("admin.clients", []);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) { setBell(false); setMenu(false); } };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setBell(false); setMenu(false); setQ(""); } };
    document.addEventListener("mousedown", on);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", on); document.removeEventListener("keydown", key); };
  }, []);

  const nav = role === "admin" ? adminNav : clientNav;
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const pages = nav.flatMap((g) => g.items).filter((i) => i.label.toLowerCase().includes(s)).map((i) => ({ label: i.label, hint: "Page", href: i.href }));
    if (role === "admin") {
      const cs = clients.filter((c) => c.name.toLowerCase().includes(s)).slice(0, 4).map((c) => ({ label: c.name as string, hint: "Client", href: `/admin/clients/${c.id}` }));
      return [...pages, ...cs].slice(0, 7);
    }
    const ps = products.filter((p) => p.name.toLowerCase().includes(s)).slice(0, 3).map((p) => ({ label: p.name, hint: "Product", href: "/app/products" }));
    const cv = conversations.filter((c) => c.name.toLowerCase().includes(s)).slice(0, 3).map((c) => ({ label: c.name, hint: "Conversation", href: `/app/inbox?c=${c.id}` }));
    return [...pages, ...ps, ...cv].slice(0, 7);
  }, [q, nav, products, conversations, clients, role]);

  const logout = () => { store.logout(); router.push("/login"); };

  return (
    <header className={clsx("z-30 flex h-[68px] items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8", sticky ? "sticky top-0" : "sticky top-[37px]")}>
      <button className="grid size-10 place-items-center rounded-lg border border-line lg:hidden" aria-label="Open menu" onClick={onMenu}><Menu className="size-5" /></button>
      <div ref={wrap} className="relative flex flex-1 items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={role === "admin" ? "Search pages and clients…" : "Search pages, products, customers…"} aria-label="Search" className="h-10 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm placeholder:text-ink-4 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25" />
          {results.length > 0 && (
            <ul className="absolute left-0 top-12 z-50 w-full animate-pop overflow-hidden rounded-xl border border-line-strong bg-raised shadow-pop">
              {results.map((r, i) => (
                <li key={i}><button onClick={() => { setQ(""); router.push(r.href); }} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-line"><span>{r.label}</span><span className="text-xs text-ink-3">{r.hint}</span></button></li>
              ))}
            </ul>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {role === "admin" && <Badge tone="brand" className="mr-2 hidden sm:inline-flex"><ShieldCheck className="size-3" /> Admin</Badge>}
          <button onClick={toggleTheme} aria-label="Toggle theme" className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-line hover:text-ink">{theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}</button>
          {role === "client" && (
            <div className="relative">
              <button onClick={() => { setBell((b) => !b); setMenu(false); }} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={bell} className="relative grid size-10 place-items-center rounded-full text-ink-2 hover:bg-line hover:text-ink">
                <Bell className="size-[18px]" />
                {unread > 0 && <span className="num absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-white">{unread}</span>}
              </button>
              {bell && (
                <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] animate-pop overflow-hidden rounded-xl border border-line-strong bg-raised shadow-pop">
                  <div className="flex items-center justify-between border-b border-line px-4 py-3"><span className="text-sm font-semibold">Notifications</span><button className="text-xs text-brand hover:underline" onClick={() => store.update<AppNotification[]>("notifications", (n) => n.map((x) => ({ ...x, read: true })))}>Mark all read</button></div>
                  <ul className="scroll-y max-h-[360px]">
                    {notifications.slice(0, 6).map((n) => (
                      <li key={n.id} className={clsx("border-b border-line px-4 py-3 last:border-0", !n.read && "bg-brand-soft/50")}>
                        <div className="flex items-start gap-2">{!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" />}<div><div className="text-sm font-medium">{n.title}</div><div className="text-[13px] text-ink-3">{n.body}</div></div></div>
                      </li>
                    ))}
                    {!notifications.length && <li className="px-4 py-8 text-center text-sm text-ink-3">You’re all caught up.</li>}
                  </ul>
                  <Link href="/app/notifications" onClick={() => setBell(false)} className="block border-t border-line px-4 py-3 text-center text-sm font-medium text-brand hover:bg-line">View all</Link>
                </div>
              )}
            </div>
          )}
          <div className="relative">
            <button onClick={() => { setMenu((m) => !m); setBell(false); }} aria-expanded={menu} aria-label="Account menu" className="ml-1 flex items-center gap-2.5 rounded-full border border-line py-1 pl-1 pr-3 hover:border-line-strong">
              <Avatar name={session.name || "User"} colour="var(--brand)" size={30} />
              <span className="hidden text-left leading-tight sm:block"><span className="block text-[13px] font-semibold">{session.name || "User"}</span><span className="block text-[11px] text-ink-3">{role === "admin" ? "Super admin" : "Owner"}</span></span>
            </button>
            {menu && (
              <div className="absolute right-0 top-12 z-50 w-60 animate-pop overflow-hidden rounded-xl border border-line-strong bg-raised shadow-pop">
                <div className="border-b border-line px-4 py-3"><div className="text-sm font-semibold">{session.name}</div><div className="truncate text-xs text-ink-3">{session.email}</div></div>
                {role === "client" && <Link href="/app/settings" onClick={() => setMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-line"><Settings className="size-4 text-ink-3" /> Settings</Link>}
                <button onClick={logout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-line"><LogOut className="size-4" /> Log out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
