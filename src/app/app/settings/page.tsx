"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Plus, Trash2 } from "lucide-react";
import { Avatar, Badge, Button, Card, CardHeader, Field, Input, Modal, PageHeader, Select, StatusBadge, Switch, Tabs, Textarea } from "@/components/ui";
import { store, uid, useStore } from "@/lib/store";
import { useUI } from "@/components/providers";
import type { TeamMember } from "@/lib/data";

const ROLES: Record<string, string[]> = {
  Owner: ["Everything, including billing and account deletion"],
  Manager: ["Inbox, orders, products, knowledge, agent, posts, templates", "Cannot change billing or delete the account"],
  Agent: ["Inbox and orders only", "Cannot edit products, agent or billing"],
};
const NOTIF = [["handover", "Customer needs a human"], ["order", "New order collected"], ["stock", "Low-stock alerts"], ["channel", "Channel or token problems"], ["report", "Weekly performance report"], ["payment", "Billing and payment reminders"]] as const;

export default function SettingsPage() {
  const [tab, setTab] = useState<"profile" | "team" | "notifications" | "data">("profile");
  return (
    <>
      <PageHeader title="Settings" description="Your business profile, team, notifications and data controls." />
      <div className="mb-6"><Tabs value={tab} onChange={setTab} options={[{ value: "profile", label: "Business profile" }, { value: "team", label: "Team & roles" }, { value: "notifications", label: "Notifications" }, { value: "data", label: "Data & safety" }]} /></div>
      {tab === "profile" && <Profile />}
      {tab === "team" && <Team />}
      {tab === "notifications" && <Notifications />}
      {tab === "data" && <Data />}
    </>
  );
}

function Profile() {
  const { toast } = useUI();
  const c = useStore<any>("client", {});
  const [f, setF] = useState<any>({ ...c, deliveryAreas: (c.deliveryAreas || []).join(", ") });
  const set = (p: any) => setF((x: any) => ({ ...x, ...p }));
  const save = () => {
    if (f.name.trim().length < 2) return toast("Enter your business name.", "warning");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return toast("Enter a valid email.", "warning");
    store.set("client", { ...c, ...f, deliveryAreas: String(f.deliveryAreas).split(",").map((s: string) => s.trim()).filter(Boolean) });
    store.update<any[]>("admin.clients", (cs) => { const x = cs.find((k) => k.id === c.id); if (x) Object.assign(x, { name: f.name, email: f.email }); });
    toast("Business profile saved.", "success");
  };
  return (
    <Card><CardHeader title="Business profile" description="Shown to customers and used by your agent." />
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <Field label="Business name"><Input value={f.name || ""} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Owner"><Input value={f.owner || ""} onChange={(e) => set({ owner: e.target.value })} /></Field>
        <Field label="Email"><Input type="email" value={f.email || ""} onChange={(e) => set({ email: e.target.value })} /></Field>
        <Field label="Phone"><Input value={f.phone || ""} onChange={(e) => set({ phone: e.target.value })} /></Field>
        <Field label="Category"><Input value={f.category || ""} onChange={(e) => set({ category: e.target.value })} /></Field>
        <Field label="Website"><Input value={f.website || ""} onChange={(e) => set({ website: e.target.value })} /></Field>
        <Field label="Address" className="sm:col-span-2"><Input value={f.address || ""} onChange={(e) => set({ address: e.target.value })} /></Field>
        <Field label="Delivery areas" hint="Comma-separated"><Input value={f.deliveryAreas} onChange={(e) => set({ deliveryAreas: e.target.value })} /></Field>
        <Field label="Opening hours"><Input value={f.hours || ""} onChange={(e) => set({ hours: e.target.value })} /></Field>
        <Field label="Delivery charge · Dhaka (৳)"><Input type="number" min={0} value={f.deliveryCharges?.dhaka ?? 0} onChange={(e) => set({ deliveryCharges: { ...f.deliveryCharges, dhaka: +e.target.value } })} /></Field>
        <Field label="Delivery charge · outside Dhaka (৳)"><Input type="number" min={0} value={f.deliveryCharges?.outside ?? 0} onChange={(e) => set({ deliveryCharges: { ...f.deliveryCharges, outside: +e.target.value } })} /></Field>
        <div className="sm:col-span-2"><Button variant="primary" onClick={save}>Save profile</Button></div>
      </div>
    </Card>
  );
}

function Team() {
  const { toast, confirm } = useUI();
  const team = useStore<TeamMember[]>("team", []);
  const [open, setOpen] = useState(false);
  const [inv, setInv] = useState({ name: "", email: "", role: "Agent" });
  const send = () => {
    if (!/^\S+@\S+\.\S+$/.test(inv.email)) return toast("Enter a valid email.", "warning");
    if (team.some((t) => t.email.toLowerCase() === inv.email.toLowerCase())) return toast("That person is already on the team.", "warning");
    store.add("team", { name: inv.name || inv.email.split("@")[0], email: inv.email, role: inv.role, status: "Invited" });
    toast("Invitation created (no email is sent in this preview).", "success"); setOpen(false); setInv({ name: "", email: "", role: "Agent" });
  };
  return (
    <>
      <Card><CardHeader title="Team members" description="Invite teammates and control what they can do." action={<Button variant="primary" size="sm" icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>Invite</Button>} />
        {team.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-0">
            <div className="flex items-center gap-3"><Avatar name={t.name} colour="#e0e1ed" /><div className="leading-tight"><div className="text-sm font-medium">{t.name}</div><div className="text-xs text-ink-3">{t.email}</div></div></div>
            <div className="flex items-center gap-3">
              <StatusBadge status={t.status} />
              <Select aria-label={`Role for ${t.name}`} className="w-32" value={t.role} disabled={t.role === "Owner"} onChange={(e) => { store.patch("team", t.id, { role: e.target.value }); toast("Role updated.", "success"); }}>{Object.keys(ROLES).map((r) => <option key={r}>{r}</option>)}</Select>
              {t.role !== "Owner" && <button aria-label={`Remove ${t.name}`} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line hover:text-danger" onClick={async () => { if (await confirm({ title: `Remove ${t.name}?`, message: "They lose access immediately.", danger: true, confirmLabel: "Remove" })) { store.remove("team", t.id); toast("Team member removed.", "success"); } }}><Trash2 className="size-4" /></button>}
            </div>
          </div>
        ))}
      </Card>
      <Card className="mt-6"><CardHeader title="What each role can do" />
        <div className="grid gap-px bg-line md:grid-cols-3">{Object.entries(ROLES).map(([r, list]) => <div key={r} className="bg-surface p-5"><Badge tone={r === "Owner" ? "brand" : "neutral"}>{r}</Badge><ul className="mt-3 space-y-1.5 text-sm text-ink-2">{list.map((l) => <li key={l}>{l}</li>)}</ul></div>)}</div>
        <p className="border-t border-line px-5 py-3 text-xs text-ink-4">Role previews are a UI specification. This preview does not enforce permissions.</p></Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Invite a teammate" size="sm" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" icon={<Mail className="size-4" />} onClick={send}>Create invite</Button></>}>
        <div className="space-y-4"><Field label="Name"><Input value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} /></Field><Field label="Email"><Input type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} /></Field><Field label="Role"><Select value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value })}><option>Manager</option><option>Agent</option></Select></Field><div className="rounded-lg border border-line bg-bg-deep/50 p-3 text-[13px] text-ink-3">{ROLES[inv.role].join(" · ")}</div></div>
      </Modal>
    </>
  );
}

function Notifications() {
  const { toast } = useUI();
  const prefs = useStore<Record<string, { app: boolean; email: boolean }>>("notificationPreferences", Object.fromEntries(NOTIF.map(([k]) => [k, { app: true, email: k === "handover" || k === "payment" }])));
  const set = (k: string, ch: "app" | "email", v: boolean) => { store.set("notificationPreferences", { ...prefs, [k]: { ...prefs[k], [ch]: v } }); toast("Preference saved.", "success"); };
  return (
    <Card><CardHeader title="Notification preferences" description="Choose how you hear about what matters." />
      <div className="grid grid-cols-[1fr_80px_80px] items-center border-b border-line px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-3"><span>Event</span><span className="text-center">In-app</span><span className="text-center">Email</span></div>
      {NOTIF.map(([k, label]) => <div key={k} className="grid grid-cols-[1fr_80px_80px] items-center border-b border-line px-5 py-4 last:border-0"><span className="text-sm">{label}</span><span className="flex justify-center"><Switch checked={!!prefs[k]?.app} label={`${label} in-app`} onChange={(v) => set(k, "app", v)} /></span><span className="flex justify-center"><Switch checked={!!prefs[k]?.email} label={`${label} email`} onChange={(v) => set(k, "email", v)} /></span></div>)}
    </Card>
  );
}

function Data() {
  const router = useRouter();
  const { toast, confirm } = useUI();
  const client = useStore<any>("client", {});
  const [reqOpen, setReqOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState("");
  const [code, setCode] = useState<string | null>(null);

  const requestDeletion = () => {
    const c = "SP-DEL-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    store.add("admin.deletionRequests", { id: "DEL-" + (100 + Math.floor(Math.random() * 900)), client: client.name, status: "Pending", code: c, requested: new Date().toISOString().slice(0, 10), completed: null });
    setCode(c);
  };
  const disconnectAll = async () => { if (await confirm({ title: "Disconnect every channel?", message: "New messages stop syncing. Existing conversations and orders are kept.", danger: true, confirmLabel: "Disconnect all" })) { store.update<any[]>("channels", (cs) => cs.forEach((c) => Object.assign(c, { status: "Not connected", webhook: false, bot: false, tokenHealth: "Not authorised" }))); toast("All channels disconnected.", "success"); } };
  const reset = async () => { if (await confirm({ title: "Reset demo data?", message: "All local edits are replaced by fictional seeds and you will be signed out.", danger: true, confirmLabel: "Reset" })) { store.reset(); router.push("/login"); } };
  const deleteAccount = () => {
    store.set("accountDeleted", true);
    for (const k of ["products", "faqs", "documents", "knowledge", "orders", "leads", "conversations", "messages", "posts", "templates", "notifications"]) store.set(k, []);
    store.logout();
    router.push("/signup?deleted=1");
  };

  return (
    <div className="space-y-6">
      <Card><CardHeader title="Data & safety" description="You stay in control of your information." />
        {[
          { t: "Request data deletion", d: "Creates a deletion request with a confirmation code you can quote to support.", b: <Button onClick={() => { setCode(null); setReqOpen(true); }}>Request deletion</Button> },
          { t: "Disconnect all channels", d: "Stops syncing from Facebook, Instagram and WhatsApp.", b: <Button onClick={disconnectAll}>Disconnect all</Button> },
          { t: "Reset demo data", d: "Restores the fictional seed workspace.", b: <Button onClick={reset}>Reset demo</Button> },
        ].map((r) => <div key={r.t} className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-5 last:border-0"><div><div className="font-medium">{r.t}</div><div className="text-sm text-ink-3">{r.d}</div></div>{r.b}</div>)}
      </Card>
      <Card className="border-danger/30"><CardHeader title={<span className="text-danger">Delete account</span>} description="Erases this workspace’s local records and signs you out." />
        <div className="p-5"><Button variant="danger" onClick={() => { setTyped(""); setDelOpen(true); }}>Delete my account…</Button></div></Card>

      <Modal open={reqOpen} onClose={() => setReqOpen(false)} title="Request data deletion" footer={code ? <Button variant="primary" onClick={() => setReqOpen(false)}>Done</Button> : <><Button variant="ghost" onClick={() => setReqOpen(false)}>Cancel</Button><Button variant="primary" onClick={requestDeletion}>Submit request</Button></>}>
        {code ? <div className="text-center"><p className="text-sm text-ink-2">Your request was recorded. Save this confirmation code:</p><div className="num my-4 rounded-xl border border-brand-line bg-brand-soft py-4 text-2xl font-bold tracking-widest text-brand">{code}</div><p className="text-xs text-ink-3">A request is a queue record, not immediate erasure. See the Data Deletion page for timing.</p></div> : <div className="space-y-4"><p className="text-sm text-ink-2">Deletion covers conversations, customer profiles, orders, uploaded documents and your business profile, subject to lawful retention.</p><Field label="Reason (optional)"><Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field></div>}
      </Modal>
      <Modal open={delOpen} onClose={() => setDelOpen(false)} title="Delete your account" size="sm" footer={<><Button variant="ghost" onClick={() => setDelOpen(false)}>Cancel</Button><Button variant="danger" disabled={typed !== client.name} onClick={deleteAccount}>Permanently delete</Button></>}>
        <p className="mb-4 text-sm text-ink-2">This erases the local workspace and signs you out. Type <strong className="text-ink">{client.name}</strong> to confirm.</p>
        <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={client.name} aria-label="Type the business name to confirm" />
      </Modal>
    </div>
  );
}
