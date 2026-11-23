"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Lock, RotateCw, ShieldAlert, ArrowRight } from "lucide-react";
import { Avatar, Badge, Button, Checkbox, Field, Input, Modal, Select } from "@/components/ui";
import { store, uid, useStore } from "@/lib/store";
import { useUI } from "@/components/providers";
import type { Channel } from "@/lib/data";

/* Simulated connection flows (ported from assets/js/connect.js). Nothing leaves the browser. */

type FlowOpts = { add?: boolean; instagram?: boolean; channelId?: string };
type Flow = { kind: "facebook" | "whatsapp" | "instagram"; onDone?: (r?: any) => void; opts: FlowOpts } | null;
type Api = {
  facebook: (onDone?: (r?: any) => void, opts?: FlowOpts) => void;
  whatsapp: (onDone?: (r?: any) => void, opts?: FlowOpts) => void;
  instagram: (onDone?: (r?: any) => void, channelId?: string) => void;
  reconnect: (id: string) => void;
  disconnect: (id: string) => Promise<void>;
};
const Ctx = createContext<Api | null>(null);
export const useConnect = () => { const c = useContext(Ctx); if (!c) throw new Error("useConnect outside provider"); return c; };

const errorText: Record<string, [string, string]> = {
  permission: ["Permission not granted", "The business declined message and comment access. Review the permission list and allow the required capabilities."],
  role: ["Required Page role missing", "This profile does not have full control or the required messaging task on the selected Page. Ask an owner to grant the required role."],
  expired: ["Your access token has expired", "The demo simulates OAuth error 190. Re-authorise the business connection to resume messages."],
  instagram: ["Instagram is not linked to a Page", "Link a professional Instagram account to the selected Facebook Page, then enable connected-tools access to messages."],
};
const scenario = () => { const d = store.get<any>("demo", {}); return d.tokenExpired ? "expired" : d.connectionError || "none"; };

export function ConnectProvider({ children }: { children: React.ReactNode }) {
  const { toast, confirm } = useUI();
  const [flow, setFlow] = useState<Flow>(null);
  const close = useCallback(() => setFlow(null), []);

  const api = useMemo<Api>(() => ({
    facebook: (onDone, opts = {}) => setFlow({ kind: "facebook", onDone, opts }),
    whatsapp: (onDone, opts = {}) => setFlow({ kind: "whatsapp", onDone, opts }),
    instagram: (onDone, channelId) => {
      const accounts = store.get<Channel[]>("channels", []).filter((c) => c.type === "Instagram" && c.status === "Connected");
      if (!accounts.length) return setFlow({ kind: "facebook", onDone: () => setFlow({ kind: "instagram", onDone, opts: {} }), opts: { instagram: true } });
      setFlow({ kind: "instagram", onDone, opts: { channelId } });
    },
    reconnect: (id) => {
      const c = store.get<Channel[]>("channels", []).find((x) => x.id === id);
      if (c?.type === "WhatsApp") setFlow({ kind: "whatsapp", opts: {} });
      else if (c?.type === "Instagram") api.instagram(undefined, id);
      else setFlow({ kind: "facebook", opts: {} });
    },
    disconnect: async (id) => {
      const c = store.get<Channel[]>("channels", []).find((x) => x.id === id);
      if (!c) return;
      if (await confirm({ title: `Disconnect ${c.type}?`, message: "New messages stop syncing in this demo. Existing conversations and orders are kept.", danger: true, confirmLabel: "Disconnect" })) {
        store.patch("channels", id, { status: "Not connected", webhook: false, bot: false, tokenHealth: "Not authorised" });
        if (c.type === "Facebook") store.update<Channel[]>("channels", (cs) => cs.filter((x) => x.type === "Instagram" && x.linkedPageId === id).forEach((x) => Object.assign(x, { status: "Not connected", webhook: false, bot: false, messageAccess: false })));
        toast(`${c.type} disconnected.`, "success");
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [confirm, toast]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {flow?.kind === "facebook" && <FacebookFlow onClose={close} onDone={flow.onDone} opts={flow.opts} />}
      {flow?.kind === "whatsapp" && <WhatsAppFlow onClose={close} onDone={flow.onDone} opts={flow.opts} />}
      {flow?.kind === "instagram" && <InstagramChecklist onClose={close} onDone={flow.onDone} channelId={flow.opts.channelId} />}
    </Ctx.Provider>
  );
}

function FakeBrowser({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line-strong">
      <div className="flex items-center gap-2 border-b border-line bg-bg-deep/70 px-4 py-2.5 text-xs text-ink-3"><Lock className="size-3" /> business.example.invalid / {label}<span className="ml-auto rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">DEMO</span></div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Failure({ code, retry }: { code: string; retry: () => void }) {
  const { toast } = useUI();
  const [title, text] = errorText[code] || errorText.permission;
  return (
    <div className="text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-danger/12 text-danger"><ShieldAlert className="size-6" /></span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">{text}</p>
      <div className="mx-auto mt-4 max-w-md rounded-lg border border-line bg-bg-deep/50 p-3 text-xs text-ink-3">This is a simulated failure. No real account or token has been accessed.</div>
      <Button variant="primary" className="mt-5" icon={<RotateCw className="size-4" />} onClick={() => { store.update<any>("demo", (d) => { d.connectionError = "none"; d.tokenExpired = false; }); toast("Demo error resolved. Continue to re-authorise.", "info"); retry(); }}>Resolve demo error & retry</Button>
    </div>
  );
}

const PAGES = (name: string) => [
  { id: "page-dhaka", name, instagram: "@dhakathreads.bd", role: "Full control" },
  { id: "page-gadget", name: "Gadget Ghor", instagram: "@gadgetghor.bd", role: "Full control" },
  { id: "page-food", name: "Ghorer Ranna", instagram: null as string | null, role: "Messaging access" },
];
const PERMS: [string, string, string][] = [
  ["messages", "Manage and reply to messages", "Receive and respond to customer Messenger conversations."],
  ["comments", "Read and reply to comments", "Answer product questions on Facebook and Instagram posts."],
  ["publish", "Publish and schedule posts", "Publish business content you approve."],
  ["instagram", "Access Instagram messages and comments", "Reply through a linked professional Instagram account."],
];

function Progress({ label, step, total, title }: { label: string; step: number; total: number; title: string }) {
  return (<><div className="mb-1 flex justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4"><span>{label}</span><span className="num">{step + 1} / {total}</span></div><div className="mb-5 h-1 overflow-hidden rounded-full bg-line"><div className="h-full bg-brand transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} /></div><h3 className="mb-4 text-xl font-semibold tracking-tight">{title}</h3></>);
}

function FacebookFlow({ onClose, onDone, opts }: { onClose: () => void; onDone?: (r?: any) => void; opts: FlowOpts }) {
  const { toast } = useUI();
  const clientName = useStore<string>("client.name", "Your business");
  const pages = PAGES(clientName);
  const [step, setStep] = useState(0);
  const [perm, setPerm] = useState<string[]>(PERMS.map((p) => p[0]));
  const [selected, setSelected] = useState<string[]>(["page-dhaka"]);
  const [error, setError] = useState<string | null>(null);
  const titles = ["Demo login", "Review permissions", "Choose Pages", "You’re connected"];

  const next = () => {
    if (step === 0) return setStep(1);
    if (step === 1) {
      if (perm.length < 4) return setError("permission");
      const code = scenario(); if (code === "permission" || code === "expired") return setError(code);
      return setStep(2);
    }
    if (step === 2) {
      if (!selected.length) return toast("Select at least one Page.", "warning");
      const code = scenario(); if (code !== "none") return setError(code);
      const chosen = pages.filter((p) => selected.includes(p.id));
      if (opts.instagram && !chosen.some((p) => p.instagram)) return setError("instagram");
      store.update<Channel[]>("channels", (cs) => {
        cs.splice(0, cs.length, ...cs.filter((c) => c.type !== "Facebook" && c.type !== "Instagram"));
        chosen.forEach((p, i) => {
          cs.push({ id: i === 0 ? "ch-fb" : "ch-fb-" + p.id, clientId: store.get("client.id"), type: "Facebook", name: p.name, status: "Connected", tokenHealth: "Healthy", webhook: true, bot: true, lastEvent: "Just now", lastWebhook: new Date().toISOString() } as Channel);
          if (p.instagram) cs.push({ id: i === 0 ? "ch-ig" : "ch-ig-" + p.id, clientId: store.get("client.id"), type: "Instagram", name: p.instagram, linkedPageId: i === 0 ? "ch-fb" : "ch-fb-" + p.id, status: "Connected", tokenHealth: "Healthy", webhook: true, bot: true, messageAccess: false, lastEvent: "Just now" } as Channel);
        });
      });
      toast("Facebook Page connection complete.", "success");
      return setStep(3);
    }
    onClose();
    onDone?.(pages.filter((p) => selected.includes(p.id)));
  };

  return (
    <Modal open onClose={onClose} title="Connect your business channels" size="lg"
      footer={error ? null : <>{step > 0 && step < 3 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}<Button variant="primary" onClick={next}>{step === 3 ? "Finish connection" : step === 0 ? "Continue as Nusrat" : step === 1 ? "Allow & continue" : "Connect selected Pages"} <ArrowRight className="size-4" /></Button></>}>
      <FakeBrowser label="simulated-signup">
        {error ? <Failure code={error} retry={() => setError(null)} /> : (
          <>
            <Progress label="Business connection" step={step} total={4} title={titles[step]} />
            {step === 0 && (<div className="space-y-4"><p className="text-sm text-ink-2">Use a fictional business profile to authorise MakAgent. No external window or real login will open.</p>
              <div className="flex items-center gap-3 rounded-xl border border-line p-3.5"><Avatar name="Nusrat Jahan" size={40} /><div className="flex-1 leading-tight"><div className="font-semibold">Nusrat Jahan</div><div className="text-xs text-ink-3">Demo business administrator</div></div><Badge tone="info">Demo profile</Badge></div>
              <Field label="Demo email"><Input type="email" defaultValue="nusrat@example.com" autoComplete="off" /></Field><Field label="Demo password"><Input type="password" defaultValue="not-a-real-password" autoComplete="off" /></Field>
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">Never enter a real Facebook password. This is a local simulation, not a Meta login.</div></div>)}
            {step === 1 && (<div className="space-y-3"><p className="text-sm text-ink-2">Choose the capabilities your sales assistant can use. Access is limited to Pages you select in the next step.</p>
              {PERMS.map(([id, t, d]) => <label key={id} className="flex cursor-pointer gap-3 rounded-xl border border-line p-3.5 hover:border-line-strong"><input type="checkbox" className="mt-1 accent-[var(--brand)]" checked={perm.includes(id)} onChange={(e) => setPerm((p) => e.target.checked ? [...p, id] : p.filter((x) => x !== id))} /><span><strong className="block text-sm">{t}</strong><span className="text-[13px] text-ink-3">{d}</span></span></label>)}
              <p className="text-xs text-ink-3">You can revoke access later from Channels or provider business settings.</p></div>)}
            {step === 2 && (<div className="space-y-3"><p className="text-sm text-ink-2">Select the Pages you manage. A linked Instagram business account can connect alongside its Page.</p>
              {pages.map((p) => <label key={p.id} className="flex cursor-pointer items-center gap-3.5 rounded-xl border border-line p-3.5 hover:border-line-strong"><input type="checkbox" className="accent-[var(--brand)]" checked={selected.includes(p.id)} onChange={(e) => setSelected((s) => e.target.checked ? [...s, p.id] : s.filter((x) => x !== p.id))} /><Avatar name={p.name} size={38} /><span className="leading-tight"><strong className="block text-sm">{p.name}</strong><span className="block text-xs text-ink-3">{p.instagram ? "Instagram: " + p.instagram : "No linked Instagram account"}</span><span className="block text-xs text-ink-4">{p.role}</span></span></label>)}</div>)}
            {step === 3 && (<div className="text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success/12 text-success"><CheckCircle2 className="size-7" /></span><p className="mt-4 text-sm text-ink-2">{selected.length} Page{selected.length > 1 ? "s" : ""} connected. Message and comment webhooks are subscribed in this demo.</p>
              <div className="mt-4 space-y-2 text-left">{selected.map((id) => <div key={id} className="flex items-center justify-between rounded-lg border border-line p-3"><strong className="text-sm">{pages.find((p) => p.id === id)?.name}</strong><Badge tone="success">✓ Subscribed</Badge></div>)}</div>
              <div className="mt-4 rounded-lg border border-line bg-bg-deep/50 p-3 text-xs text-ink-3">Instagram needs “Allow access to messages” enabled. The setup checklist will guide you.</div></div>)}
          </>
        )}
      </FakeBrowser>
    </Modal>
  );
}

function WhatsAppFlow({ onClose, onDone, opts }: { onClose: () => void; onDone?: (r?: any) => void; opts: FlowOpts }) {
  const { toast } = useUI();
  const clientName = useStore<string>("client.name", "");
  const clientPhone = useStore<string>("client.phone", "");
  const [targetId] = useState(() => (opts.add ? uid() : null));
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [d, setD] = useState({ portfolio: "Dhaka Threads Business", waba: "Dhaka Threads WABA", phone: opts.add ? "" : clientPhone.replace(/\s/g, ""), displayName: clientName, consent: false, otp: "", newP: "existing", newW: "existing", newName: "" });
  const labels = ["Sign in to your business", "Choose a business portfolio", "Choose your WhatsApp account", "Add your business phone number", "Verify your phone number", "Set a display name", "Your number is connected"];
  const isBd = (n: string) => /^(?:\+?88)?01[3-9]\d{8}$/.test(n);
  const canonical = (n: string) => String(n).replace(/\D/g, "").replace(/^88/, "");

  const apply = (values: Record<string, any>) => {
    if (!opts.add) { store.update<Channel[]>("channels", (cs) => { const c = cs.find((x) => x.type === "WhatsApp"); if (c) Object.assign(c, values); else cs.push({ id: uid(), clientId: store.get("client.id"), type: "WhatsApp", ...values } as Channel); }); return; }
    store.update<Channel[]>("channels", (cs) => { let c = cs.find((x) => x.id === targetId); if (!c) { c = { id: targetId!, clientId: store.get("client.id"), type: "WhatsApp", name: "New business number", bot: false, webhook: false } as Channel; cs.push(c); } Object.assign(c, values); });
  };

  const next = () => {
    if (step === 6) { onClose(); onDone?.({ ...d, quality: "High", tier: 1000, displayNameStatus: "Pending" }); return; }
    if (step === 0) { const code = scenario(); if (code === "permission" || code === "expired") return setError(code); }
    if (step === 3) {
      if (!isBd(d.phone)) return toast("Enter a valid Bangladesh number, e.g. 01712345678.", "warning");
      if (opts.add && store.get<Channel[]>("channels", []).some((c) => c.type === "WhatsApp" && c.id !== targetId && canonical(c.name) === canonical(d.phone))) return toast("That number is already connected. Choose a different demo number.", "warning");
    }
    if (step === 4 && !/^\d{6}$/.test(d.otp)) return toast("Enter any six digits (demo code: 123456).", "warning");
    if (step === 5) {
      if (d.displayName.trim().length < 2) return toast("Enter a display name.", "warning");
      if (!d.consent) return toast("Confirm you’re authorised to use this demo number.", "warning");
      apply({ name: d.phone, displayName: d.displayName, portfolio: d.portfolio, waba: d.waba, status: "Connected", tokenHealth: "Healthy", webhook: true, bot: true, lastEvent: "Just now", lastWebhook: new Date().toISOString(), quality: "High", tier: 1000, displayNameStatus: "Pending" });
      toast("WhatsApp number connected.", "success");
    }
    setStep(step + 1);
  };

  const acct = (portfolio: boolean) => (
    <div className="space-y-4"><p className="text-sm text-ink-2">{portfolio ? "A portfolio groups your Pages, numbers and business assets." : "Choose an account to manage your business messaging."}</p>
      <Field label={portfolio ? "Business portfolio" : "WhatsApp Business Account"}><Select value={portfolio ? d.newP : d.newW} onChange={(e) => setD({ ...d, [portfolio ? "newP" : "newW"]: e.target.value })}><option value="existing">{portfolio ? d.portfolio : d.waba}</option><option value="create">Create a new {portfolio ? "portfolio" : "account"}</option></Select></Field>
      {(portfolio ? d.newP : d.newW) === "create" && <Field label={`New ${portfolio ? "portfolio" : "account"} name`}><Input value={d.newName} onChange={(e) => setD({ ...d, newName: e.target.value, [portfolio ? "portfolio" : "waba"]: e.target.value || (portfolio ? d.portfolio : d.waba) })} placeholder={`${clientName} Business`} /></Field>}
      <div className="rounded-lg border border-line bg-bg-deep/50 p-3 text-xs text-ink-3">Fictional assets only. No actual business account is created.</div></div>
  );

  return (
    <Modal open onClose={onClose} title="WhatsApp · Embedded Signup demo" size="lg" footer={error ? null : <>{step > 0 && step < 6 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}<Button variant="primary" onClick={next}>{step === 6 ? "Finish signup" : step === 4 ? "Verify code" : step === 5 ? "Submit display name" : "Continue"} <ArrowRight className="size-4" /></Button></>}>
      <FakeBrowser label="simulated-signup">
        {error ? <Failure code={error} retry={() => setError(null)} /> : (
          <>
            <Progress label="Embedded signup · simulated" step={step} total={7} title={labels[step]} />
            {step === 0 && <div className="space-y-4"><p className="text-sm text-ink-2">Authorise a fictional business administrator. This is not an external login. Do not enter real credentials.</p><Field label="Demo email"><Input type="email" defaultValue="nusrat@example.com" /></Field><Field label="Demo password"><Input type="password" defaultValue="demo-password" /></Field></div>}
            {step === 1 && acct(true)}
            {step === 2 && acct(false)}
            {step === 3 && <div className="space-y-4"><p className="text-sm text-ink-2">Use a fictional Bangladesh business number. In production, this number must be eligible for the provider’s signup flow.</p><Field label="Phone number" hint="Use 01712345678 or +8801712345678 (no spaces)."><Input type="tel" value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value.replace(/\s/g, "") })} /></Field></div>}
            {step === 4 && <div className="space-y-4"><p className="text-sm text-ink-2">Enter the simulated verification code for <strong className="text-ink">{d.phone}</strong>. No SMS or call is sent.</p><Field label="6-digit verification code"><Input inputMode="numeric" maxLength={6} placeholder="123456" value={d.otp} onChange={(e) => setD({ ...d, otp: e.target.value.replace(/\D/g, "") })} /></Field><div className="rounded-lg border border-line bg-bg-deep/50 p-3 text-xs text-ink-3">Demo code: <strong className="text-ink">123456</strong>. Any six numeric digits work.</div><button className="text-sm text-brand hover:underline" onClick={() => toast("Demo code is still 123456. No SMS was sent.", "info")}>Resend demo code</button></div>}
            {step === 5 && <div className="space-y-4"><p className="text-sm text-ink-2">This name appears in your business profile. Production names are reviewed against provider display-name rules.</p><Field label="Business display name"><Input maxLength={60} value={d.displayName} onChange={(e) => setD({ ...d, displayName: e.target.value })} /></Field><Checkbox checked={d.consent} onChange={(v) => setD({ ...d, consent: v })} label="I’m authorised to use this demo business number." /></div>}
            {step === 6 && <div className="text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success/12 text-success"><CheckCircle2 className="size-7" /></span><p className="mt-3 font-semibold">{d.displayName}<br /><span className="font-normal text-ink-3">{d.phone}</span></p>
              <div className="mt-4 space-y-2 text-left text-sm">{[["Quality rating", <Badge key="q" tone="success">High</Badge>], ["Messaging limit", <strong key="l">1,000 / day</strong>], ["Display name", <Badge key="n" tone="warning">Pending review</Badge>]].map(([k, v], i) => <div key={i} className="flex items-center justify-between rounded-lg border border-line p-3">{k}{v}</div>)}</div>
              <p className="mt-3 text-xs text-ink-3">Provider approval is simulated. Quality and messaging limits are illustrative.</p></div>}
          </>
        )}
      </FakeBrowser>
    </Modal>
  );
}

function InstagramChecklist({ onClose, onDone, channelId }: { onClose: () => void; onDone?: (r?: any) => void; channelId?: string }) {
  const { toast } = useUI();
  const channels = useStore<Channel[]>("channels", []);
  const accounts = channels.filter((c) => c.type === "Instagram" && c.status === "Connected");
  const c = accounts.find((x) => x.id === channelId) || accounts.find((x) => !x.messageAccess) || accounts[0];
  const [on, setOn] = useState(!!c?.messageAccess);
  const [result, setResult] = useState<boolean | null>(null);
  useEffect(() => setOn(!!c?.messageAccess), [c?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!c) return null;
  return (
    <Modal open onClose={onClose} title="Instagram setup checklist" footer={<><Button variant="ghost" onClick={onClose}>Later</Button><Button variant="primary" onClick={() => { setResult(on); if (on) { store.patch("channels", c.id, { messageAccess: true }); toast("Instagram message access verified.", "success"); onDone?.(); } else toast("Enable the checkbox after completing the demo steps.", "warning"); }}>Re-check access</Button></>}>
      <p className="mb-4 text-sm text-ink-2">A professional Instagram account must be linked to an authorised Page.</p>
      <div className="space-y-2 text-sm">{[["Linked Facebook Page", true], ["Professional account", true], ["Access to messages", !!c.messageAccess]].map(([l, ok]) => <div key={String(l)} className="flex items-center justify-between rounded-lg border border-line p-3">{l}<Badge tone={ok ? "success" : "warning"}>{ok ? "✓ Done" : "! Action needed"}</Badge></div>)}</div>
      <div className="my-5 rounded-xl border border-brand-line bg-brand-soft p-4 text-sm"><strong>Enable “Allow access to messages”</strong><ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-2"><li>Open Instagram → Settings and activity.</li><li>Go to Messages and story replies → Message controls.</li><li>Open Connected tools.</li><li>Turn on “Allow access to messages”.</li></ol><p className="mt-2 text-xs text-ink-3">Settings names can vary by app version. This demo never opens Instagram.</p></div>
      <Checkbox checked={on} onChange={setOn} label="I enabled access in connected tools (demo)" />
      {result !== null && <div className="mt-4" aria-live="polite"><Badge tone={result ? "success" : "warning"}>{result ? "✓ Message access verified" : "! Still disabled — follow the steps above"}</Badge></div>}
    </Modal>
  );
}
