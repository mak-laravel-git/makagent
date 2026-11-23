"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  ArrowLeft, ArrowRight, Building2, BookOpen, Check, CheckCircle2, Cloud, FileSpreadsheet, FlaskConical, Globe, ImagePlus, Lightbulb, LogOut, MessagesSquare, Package, Pencil, Plug, Plus, RotateCcw, Rocket, ScanSearch, Send, ShieldCheck, Sparkles, Trash2, TriangleAlert, Upload,
} from "lucide-react";
import { Brand } from "@/components/site/brand";
import { Badge, Button, Card, ChannelChip, Checkbox, EmptyState, Field, Input, Modal, Select, Switch, Textarea } from "@/components/ui";
import { ConnectProvider, useConnect } from "@/components/app/connect";
import { ImportModal } from "@/components/app/product-import";
import { DemoControls } from "@/components/app/demo-controls";
import { MockAgent } from "@/lib/mock-agent";
import { saveOrder, syncKnowledge } from "@/lib/actions";
import { store, uid, useStore, money } from "@/lib/store";
import { SEED, type Channel, type Product } from "@/lib/data";
import { useUI } from "@/components/providers";

const STEPS: [string, string, React.ComponentType<{ className?: string }>][] = [
  ["Business profile", "A little about your business", Building2], ["Connect channels", "Meet customers where they are", Plug], ["Add products", "Give your agent something to sell", Package],
  ["Teach your AI", "The details that make it yours", BookOpen], ["Personality & rules", "Your voice. Your boundaries.", Sparkles], ["Test your agent", "Try a conversation, risk-free", MessagesSquare], ["Go live", "Your next chapter starts here", Rocket],
];
const TITLES = ["First, let’s get to know your business.", "Every inbox. One helpful assistant.", "Your catalog is your agent’s superpower.", "Great answers start with your knowledge.", "Make your agent feel like one of the team.", "A little practice. A lot of confidence.", "You’re ready for your first conversation."];
const INTROS = ["A few details help your agent answer customers with confidence. You can change these later.", "Connect the channels your customers already use. Every authorisation here is safely simulated.", "Add a few products now. Your agent uses these exact names, prices and stock levels in its answers.", "Teach your agent the answers your team gives every day. No long training sessions needed.", "Choose a name, tone and clear rules. Keep your business in control of every reply.", "Ask about prices, collect an order, or ask for a human. Nothing here reaches a real customer.", "Review your setup, then switch on your agent. You can pause it whenever you need."];

export default function OnboardingPage() {
  return <ConnectProvider><Wizard /></ConnectProvider>;
}

function Wizard() {
  const router = useRouter();
  const { toast } = useUI();
  const session = useStore<any>("session", {});
  const ob = useStore<any>("onboarding", {});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [leave, setLeave] = useState(false);
  const commitRef = useRef<null | ((validate: boolean) => string | null)>(null);
  const step: number = ob.step || 1;

  useEffect(() => { store.hydrate(); setReady(true); }, []);
  useEffect(() => { if (ready && !store.session().role) router.replace("/login"); }, [ready, session.role, router]);

  const go = (next: number, validate: boolean) => {
    const err = commitRef.current?.(validate) ?? null;
    if (err) { setError(err); toast(err, "error"); return; }
    setError("");
    store.update<any>("onboarding", (o) => { o.step = next; o.maxStep = Math.max(o.maxStep || 1, next); });
    window.scrollTo({ top: 0 });
  };

  if (!ready) return <div className="min-h-screen bg-bg" />;
  if (ob.completed) return <Done />;
  const maxStep = ob.maxStep || step;

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-line bg-bg/85 px-5 backdrop-blur-xl sm:px-8">
        <Brand href="/" showMak={false} />
        <div className="flex items-center gap-3"><span className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4 md:block">Your workspace, taking shape</span><Button size="sm" icon={<LogOut className="size-4" />} onClick={() => { commitRef.current?.(false); setLeave(true); }}>Save & continue later</Button></div>
      </header>

      <div className="mx-auto grid max-w-[1380px] gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[300px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="eyebrow mb-5">Let’s build your sales agent</div>
          <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
            {STEPS.map(([name, desc, Icon], i) => {
              const n = i + 1, current = n === step, complete = n < step;
              return (
                <li key={name}>
                  <button disabled={n > maxStep} onClick={() => go(n, false)} aria-current={current ? "step" : undefined} className={clsx("flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left transition-colors disabled:opacity-40", current ? "bg-brand-soft" : "hover:bg-line")}>
                    <span className={clsx("grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold", complete ? "bg-brand text-white" : current ? "border-2 border-brand text-brand" : "border border-line-strong text-ink-3")}>{complete ? <Check className="size-4" /> : n}</span>
                    <span className="hidden leading-tight lg:block"><strong className={clsx("block text-sm", current ? "text-ink" : "text-ink-2")}>{name}</strong><span className="text-xs text-ink-3">{desc}</span></span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-8 hidden rounded-xl border border-line bg-surface p-5 text-[13px] text-ink-3 lg:block">
            <div className="flex items-center gap-2 font-medium text-ink"><ShieldCheck className="size-4 text-brand" /> Your business stays in control.</div>
            <p className="mt-2">All connections, messages and AI replies are simulated. Nothing is sent outside this browser.</p>
            <div className="mt-4 flex items-center gap-2 font-medium text-ink"><Cloud className="size-4 text-brand" /> Progress saves as you go.</div>
          </div>
        </aside>

        <main id="app-content" className="min-w-0">
          <div className="mb-8 flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4"><span>Step {step} of 7</span><div className="h-1 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={step} aria-valuemin={0} aria-valuemax={7}><div className="h-full bg-brand transition-all duration-500" style={{ width: `${(step / 7) * 100}%` }} /></div><span className="num">{Math.round((step / 7) * 100)}%</span></div>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-[-0.035em] md:text-5xl">{TITLES[step - 1]}</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-2">{INTROS[step - 1]}</p>
          {error && <div role="alert" className="mt-6 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

          <div className="mt-10">
            {step === 1 && <StepProfile reg={(f) => { commitRef.current = f; }} />}
            {step === 2 && <StepChannels reg={(f) => { commitRef.current = f; }} />}
            {step === 3 && <StepProducts reg={(f) => { commitRef.current = f; }} />}
            {step === 4 && <StepKnowledge reg={(f) => { commitRef.current = f; }} />}
            {step === 5 && <StepPersonality reg={(f) => { commitRef.current = f; }} />}
            {step === 6 && <StepPlayground reg={(f) => { commitRef.current = f; }} />}
            {step === 7 && <StepGoLive onJump={(n) => go(n, false)} />}
          </div>

          <div className="mt-12 flex items-center justify-between border-t border-line pt-6">
            <Button icon={<ArrowLeft className="size-4" />} disabled={step === 1} onClick={() => go(step - 1, false)}>Back</Button>
            <div className="flex items-center gap-5"><small className="hidden items-center gap-1.5 text-xs text-ink-3 sm:inline-flex"><Cloud className="size-4" /> Saved in your browser</small>
              {step < 7 ? <Button variant="primary" size="lg" pill onClick={() => go(step + 1, true)}>{step === 6 ? "Review setup" : "Save & continue"} <ArrowRight className="size-4" /></Button> : <Button href="/" variant="ghost">Back to website</Button>}</div>
          </div>
        </main>
      </div>

      <Modal open={leave} onClose={() => setLeave(false)} title="Your progress is safe" footer={<><Button variant="ghost" onClick={() => setLeave(false)}>Keep setting up</Button><Button variant="primary" onClick={() => router.push("/login")}>Save & leave</Button></>}>
        <p className="text-sm text-ink-2">{store.get("client.name")} is saved at step {step}: {STEPS[step - 1][0]}. Return through the demo client login on this same browser to pick up where you left off. No real account or email is created.</p>
      </Modal>
      <DemoControls />
    </div>
  );
}

function Done() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-brand-soft text-brand"><Rocket className="size-9" /></span>
        <h1 className="mt-8 text-4xl font-bold tracking-[-0.035em]">Your agent is live.</h1>
        <p className="mt-4 text-lg text-ink-2">Customers can now reach {store.get("agent.name")}. Watch conversations arrive in your inbox — and step in whenever you like.</p>
        <Button href="/app/overview" variant="primary" size="lg" pill className="mt-8">Open my dashboard <ArrowRight className="size-4" /></Button>
      </div>
    </div>
  );
}

type Reg = { reg: (f: (validate: boolean) => string | null) => void };

/* ───────── 1 · Profile ───────── */
function StepProfile({ reg }: Reg) {
  const { toast } = useUI();
  const client = useStore<any>("client", {});
  const profile = useStore<any>("onboarding.profile", {});
  const [f, setF] = useState<any>(() => { const c = { ...store.get("client"), ...store.get("onboarding.profile") }; return { ...c, deliveryAreas: Array.isArray(c.deliveryAreas) ? c.deliveryAreas.join(", ") : c.deliveryAreas || "", opens: c.opens || "10:00", closes: c.closes || "22:00", phone: (c.phone || "").replace(/\s/g, "") }; });
  const set = (p: any) => setF((x: any) => ({ ...x, ...p }));
  useEffect(() => { reg((validate) => {
    if (validate) {
      if (f.name.trim().length < 2) return "Please enter your business name.";
      if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(String(f.phone).replace(/\s/g, ""))) return "Enter an 11-digit Bangladesh business phone, e.g. 01712345678.";
      if (!String(f.deliveryAreas).trim()) return "Add at least one delivery area.";
    }
    const data = { ...f, deliveryAreas: String(f.deliveryAreas).split(",").map((x: string) => x.trim()).filter(Boolean) };
    store.set("onboarding.profile", { ...store.get("onboarding.profile"), ...data });
    store.update<any>("client", (c) => Object.assign(c, data, { hours: `${f.opens}–${f.closes}` }));
    return null;
  }); });
  const logo = async (file?: File) => { if (!file) return; if (file.size > 500000 || !/^image\/(png|jpeg|webp)$/.test(file.type)) return toast("Use a PNG/JPG/WebP logo under 500 KB.", "error"); const r = new FileReader(); r.onload = () => set({ logo: String(r.result) }); r.readAsDataURL(file); };
  void client; void profile;
  return (
    <div className="space-y-6">
      <Card className="p-7">
        <h2 className="text-xl font-semibold tracking-tight">Your business profile</h2>
        <div className="mt-6 flex items-center gap-5"><span className="grid size-20 place-items-center overflow-hidden rounded-2xl border border-line-strong bg-raised text-ink-3">{f.logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={f.logo} alt="Business logo" className="size-full object-cover" /> : <ImagePlus className="size-6" />}</span>
          <div><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line-strong px-4 py-2 text-sm font-medium hover:border-brand"><Upload className="size-4" /> Upload business logo<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Upload business logo" onChange={(e) => logo(e.target.files?.[0])} /></label><p className="mt-1.5 text-xs text-ink-3">PNG, JPG or WebP. Up to 500 KB. Stored only in this browser.</p></div></div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <Field label="Business name *"><Input value={f.name || ""} onChange={(e) => set({ name: e.target.value })} autoComplete="organization" /></Field>
          <Field label="Business category *"><Select value={f.category} onChange={(e) => set({ category: e.target.value })}>{["Fashion & accessories", "Electronics", "Home food", "Beauty & wellness", "Home & lifestyle", "Other"].map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Website (optional)"><Input type="url" value={f.website || ""} onChange={(e) => set({ website: e.target.value })} placeholder="https://yourstore.com" /></Field>
          <Field label="Business phone *"><Input type="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
          <Field label="Delivery areas *" hint="Separate areas with commas. Your agent uses this context." className="sm:col-span-2"><Input value={f.deliveryAreas} onChange={(e) => set({ deliveryAreas: e.target.value })} placeholder="Dhaka, Gazipur, nationwide" /></Field>
        </div>
        <div className="my-8 h-px bg-line" />
        <h2 className="text-xl font-semibold tracking-tight">Hours & language</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Opening time"><Input type="time" value={f.opens} onChange={(e) => set({ opens: e.target.value })} /></Field><Field label="Closing time"><Input type="time" value={f.closes} onChange={(e) => set({ closes: e.target.value })} /></Field>
          <Field label="Preferred customer language" className="sm:col-span-2"><Select value={f.language || "auto"} onChange={(e) => set({ language: e.target.value })}><option value="auto">Auto-detect · Bangla, Banglish & English</option><option value="bn">Bangla</option><option value="en">English</option></Select></Field></div>
      </Card>
      <Tip title="Start with what you know.">Your agent will use your products and policies, not make up answers. You can fine-tune everything after setup.</Tip>
    </div>
  );
}

function Tip({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="flex gap-4 rounded-xl border border-brand-line bg-brand-soft p-5"><Lightbulb className="mt-0.5 size-5 shrink-0 text-brand" /><div><strong className="text-sm">{title}</strong><p className="mt-1 text-sm text-ink-2">{children}</p></div></div>;
}

/* ───────── 2 · Channels ───────── */
function StepChannels({ reg }: Reg) {
  const connect = useConnect();
  const channels = useStore<Channel[]>("channels", []);
  const demo = useStore<any>("demo", {});
  useEffect(() => { reg((validate) => {
    if (!validate) return null;
    const cs = store.get<Channel[]>("channels", []);
    if (!cs.some((c) => c.status === "Connected")) return "Connect at least one business channel to continue.";
    if (store.get("demo.tokenExpired")) return "Resolve the simulated token expiry or reconnect before continuing.";
    if (cs.some((c) => c.type === "Instagram" && c.status === "Connected" && !c.messageAccess)) return "Complete the Instagram message-access checklist, or disconnect Instagram for now.";
    return null;
  }); });
  const list = (["Facebook", "Instagram", "WhatsApp"] as const).map((type) => { const l = channels.filter((c) => c.type === type); return l.find((c) => type === "Instagram" && c.status === "Connected" && !c.messageAccess) || l[0] || ({ id: "ch-" + type.toLowerCase(), type, status: "Not connected" } as Channel); });
  const blurb = { Facebook: ["Facebook Page", "Messages, comments and publishing"], Instagram: ["Instagram Business", "Direct messages, comments and posts"], WhatsApp: ["WhatsApp Business", "Business messages and approved templates"] };
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        {list.map((c) => {
          const expired = demo.tokenExpired && c.type === "Facebook";
          const status = expired ? "Needs reconnect" : c.status;
          const ok = status === "Connected";
          return (
            <Card key={c.type} className="flex flex-col p-6">
              <div className="flex items-start justify-between gap-3"><ChannelChip type={c.type} /><Badge tone={ok ? "success" : status === "Needs reconnect" ? "warning" : "neutral"} dot>{status}</Badge></div>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">{blurb[c.type][0]}</h2><p className="text-sm text-ink-3">{blurb[c.type][1]}</p>
              <div className="mt-4 min-h-14 text-sm text-ink-2">{ok ? <div><div className="font-medium">{c.name}</div><div className="text-xs text-success">✓ Webhook subscribed · Token healthy</div></div> : status === "Needs reconnect" ? "Demo token expired (OAuth 190). Reconnect to restore access." : "Connect an account you manage. You’ll review permissions before granting access."}</div>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Button size="sm" variant={ok ? "secondary" : "primary"} onClick={() => (c.type === "WhatsApp" ? connect.whatsapp() : c.type === "Instagram" ? (ok ? connect.reconnect(c.id) : connect.instagram()) : connect.facebook())}>{ok ? "Manage / reconnect" : `Connect ${c.type}`}</Button>
                {c.type === "Instagram" && ok && <Button size="sm" icon={c.messageAccess ? <CheckCircle2 className="size-3.5" /> : <TriangleAlert className="size-3.5" />} onClick={() => connect.instagram(undefined, c.id)}>{c.messageAccess ? "Setup verified" : "Complete message setup"}</Button>}
                {ok && <button className="text-sm text-ink-3 hover:text-danger" onClick={() => connect.disconnect(c.id)}>Disconnect</button>}
              </div>
            </Card>
          );
        })}
      </div>
      <Tip title="Only the access your business needs.">Permissions apply to your selected assets. You can disconnect at any time. Use Demo controls to try a permission error, missing role, token expiry or unlinked Instagram.</Tip>
    </div>
  );
}

/* ───────── 3 · Products ───────── */
function StepProducts({ reg }: Reg) {
  const { toast } = useUI();
  const products = useStore<Product[]>("products", []);
  const cats = useStore<{ id: string; name: string }[]>("categories", []);
  const [tab, setTab] = useState<"manual" | "upload" | "website" | "paste">("manual");
  const [file, setFile] = useState<File | null>(null);
  const [imp, setImp] = useState(false);
  const [m, setM] = useState({ name: "", sku: "", price: "", stock: "", category: cats[0]?.name || "Shirts", sizes: "M, L", colour: "Blue", instructions: "", description: "" });
  const [url, setUrl] = useState<string>(store.get<string>("client.website") || "https://dhakathreads.example");
  const [scan, setScan] = useState<null | "scanning" | Product[]>(null);
  const [paste, setPaste] = useState("");
  const [parsed, setParsed] = useState<{ name: string; price: number; stock: number; err?: string }[] | null>(null);
  useEffect(() => { reg((validate) => (validate && !store.get<Product[]>("products", []).some((p) => p.status === "Active") ? "Add at least one active product, or use the sample catalog." : null)); });

  const mk = (o: Partial<Product> & { name: string; price: number; stock: number }): Product => ({ id: uid(), clientId: "cl-dhaka", sku: o.sku || "DT-" + Date.now().toString().slice(-6), category: cats[0]?.name || "Shirts", description: "", discountPrice: 0, threshold: 5, lowStockThreshold: 5, variants: [{ size: "M", colour: "Standard", stock: o.stock }], images: [SEED.products[1].images[0]], tags: [], delivery: 80, deliveryOverride: null, status: "Active", sync: "Synced to AI", instructions: "", aiInstructions: "", askedCount: 0, priceQuestions: 0, ...o } as Product);
  const addManual = (e: React.FormEvent) => {
    e.preventDefault();
    const price = +m.price, stock = +m.stock;
    if (m.name.trim().length < 2 || !(price > 0) || !Number.isInteger(stock) || stock < 0) return toast("Add a name, a price above 0 and a whole-number stock.", "warning");
    const sizes = m.sizes.split(",").map((s) => s.trim()).filter(Boolean);
    const n = sizes.length || 1;
    store.add("products", mk({ name: m.name.trim(), sku: m.sku || undefined as any, price, stock, category: m.category, description: m.description, instructions: m.instructions, aiInstructions: m.instructions, variants: (sizes.length ? sizes : ["One size"]).map((s, i) => ({ size: s, colour: m.colour || "Standard", stock: Math.floor(stock / n) + (i < stock % n ? 1 : 0) })) }));
    toast("Product added. Your AI knows it now.", "success");
    setM({ ...m, name: "", sku: "", price: "", stock: "", instructions: "", description: "" });
  };
  const runScan = () => { setScan("scanning"); setTimeout(() => setScan(SEED.products.slice(0, 4).map((p) => ({ ...p, id: uid() }))), 1400); };
  const structure = () => {
    const rows = paste.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const [name, price, stock] = l.split("|").map((x) => x.trim()); const p = parseFloat((price || "").replace(/[৳,]/g, "")), s = parseInt((stock || "").replace(/,/g, ""), 10); return { name, price: p, stock: s, err: !name ? "name missing" : !(p > 0) ? "invalid price" : !(s >= 0) ? "invalid stock" : undefined }; });
    setParsed(rows);
  };
  const sample = () => { store.set("products", SEED.products); store.set("categories", SEED.categories); toast("Sample catalog loaded.", "success"); };
  const csv = "name,price,stock,category\nLinen Summer Shirt,1450,20,Shirts\nCanvas Tote,650,35,Accessories\n";

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Product import method" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
        {([["manual", Plus, "Add manually"], ["upload", FileSpreadsheet, "CSV / Excel"], ["website", Globe, "Website"], ["paste", Pencil, "Paste a list"]] as const).map(([id, Icon, t]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={clsx("inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium", tab === id ? "bg-brand text-white" : "text-ink-2 hover:text-ink")}><Icon className="size-4" />{t}</button>)}
      </div>
      <Card className="p-7">
        {tab === "manual" && (
          <form onSubmit={addManual} noValidate><h2 className="text-xl font-semibold tracking-tight">Add your first bestseller</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field label="Product name *"><Input value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} placeholder="e.g. Premium Blue Linen Shirt" /></Field><Field label="SKU (optional)"><Input value={m.sku} onChange={(e) => setM({ ...m, sku: e.target.value })} placeholder="DT-001" /></Field>
              <Field label="Price (৳) *"><Input type="number" min={1} value={m.price} onChange={(e) => setM({ ...m, price: e.target.value })} placeholder="1450" /></Field><Field label="Stock quantity *"><Input type="number" min={0} value={m.stock} onChange={(e) => setM({ ...m, stock: e.target.value })} placeholder="24" /></Field>
              <Field label="Category"><Select value={m.category} onChange={(e) => setM({ ...m, category: e.target.value })}>{cats.map((c) => <option key={c.id}>{c.name}</option>)}</Select></Field><Field label="Available sizes"><Input value={m.sizes} onChange={(e) => setM({ ...m, sizes: e.target.value })} placeholder="M, L, XL" /></Field>
              <Field label="Colour"><Input value={m.colour} onChange={(e) => setM({ ...m, colour: e.target.value })} /></Field><Field label="AI instructions (optional)"><Input value={m.instructions} onChange={(e) => setM({ ...m, instructions: e.target.value })} placeholder="e.g. Never offer more than 10% discount" /></Field>
              <Field label="Description" className="sm:col-span-2"><Textarea rows={2} value={m.description} onChange={(e) => setM({ ...m, description: e.target.value })} placeholder="Material, fit and anything worth knowing…" /></Field>
            </div>
            <Button type="submit" variant="primary" className="mt-6" icon={<Plus className="size-4" />}>Add product & teach AI</Button></form>
        )}
        {tab === "upload" && (
          <div><h2 className="text-xl font-semibold tracking-tight">A spreadsheet is a great start.</h2>
            <div className="mt-6 rounded-2xl border border-dashed border-line-strong p-10 text-center"><FileSpreadsheet className="mx-auto size-10 text-brand" /><h3 className="mt-3 font-semibold">Bring your catalog with you.</h3><p className="mx-auto mt-1 max-w-sm text-sm text-ink-3">CSV up to 2 MB. Next: map columns, validate rows, then approve valid products.</p>
              <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"><Upload className="size-4" /> Choose file<input type="file" accept=".csv" className="sr-only" aria-label="Upload product CSV" onChange={(e) => { const f = e.target.files?.[0]; if (f) { if (f.size > 2_000_000) toast("Choose a file under 2 MB.", "error"); else { setFile(f); setImp(true); } } e.target.value = ""; }} /></label></div>
            <div className="mt-4 flex items-center justify-between text-[13px]"><span className="text-ink-3">Required columns: name, price, stock.</span><button className="text-brand hover:underline" onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "sample-products.csv"; a.click(); }}>Download sample CSV</button></div>
            <p className="mt-3 text-xs text-ink-4">Excel (.xlsx) is not parsed in this preview — export your sheet as CSV first.</p></div>
        )}
        {tab === "website" && (
          <div><h2 className="text-xl font-semibold tracking-tight">Let’s explore your storefront.</h2><p className="mt-2 text-sm text-ink-3">A simulated scan previews products for you to approve. This preview does not fetch your website.</p>
            <form className="mt-5 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); runScan(); }}><Field label="Website URL" className="min-w-[260px] flex-1"><Input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} /></Field><Button type="submit" variant="primary" icon={<ScanSearch className="size-4" />}>Scan website</Button></form>
            <div aria-live="polite" className="mt-5">{scan === "scanning" && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-line" />)}<p className="text-sm text-ink-3">Scanning {url}…</p></div>}
              {Array.isArray(scan) && <div><p className="mb-3 text-sm text-ink-2">Found {scan.length} products. Approve the ones you want.</p>{scan.map((p) => <div key={p.id} className="mb-2 flex items-center gap-3 rounded-xl border border-line p-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.images[0]} alt="" className="size-12 rounded-lg object-cover" /><div className="flex-1 text-sm"><div className="font-medium">{p.name}</div><div className="text-xs text-ink-3">{money(p.price)} · {p.stock} in stock</div></div></div>)}<Button variant="primary" onClick={() => { store.update<Product[]>("products", (ps) => [...ps, ...scan.filter((s) => !ps.some((p) => p.name === s.name))]); setScan(null); toast("Approved products added.", "success"); }}>Approve all {scan.length}</Button></div>}</div></div>
        )}
        {tab === "paste" && (
          <div><h2 className="text-xl font-semibold tracking-tight">A product list is all you need.</h2><p className="mt-2 text-sm text-ink-3">Paste one product per line. The local parser structures the list for review — it’s not a real AI model.</p>
            <Field label="Your product list" hint="Use Name | price | stock. ৳ and commas in numbers are accepted." className="mt-5"><Textarea rows={5} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Linen Summer Shirt | 1450 | 20\nCanvas Tote | 650 | 35"} /></Field>
            <Button variant="primary" className="mt-4" icon={<Sparkles className="size-4" />} onClick={structure} disabled={!paste.trim()}>Structure my list</Button>
            {parsed && <div className="mt-5"><div className="divide-y divide-line rounded-xl border border-line">{parsed.map((r, i) => <div key={i} className="flex items-center justify-between p-3 text-sm"><span>{r.name || "—"}</span><span className="num text-ink-3">{Number.isFinite(r.price) ? money(r.price) : "—"} · {Number.isFinite(r.stock) ? r.stock : "—"}</span>{r.err ? <Badge tone="danger">{r.err}</Badge> : <Badge tone="success">OK</Badge>}</div>)}</div><Button className="mt-4" variant="primary" disabled={!parsed.some((r) => !r.err)} onClick={() => { const ok = parsed.filter((r) => !r.err); store.update<Product[]>("products", (ps) => [...ps, ...ok.map((r) => mk({ name: r.name, price: r.price, stock: r.stock }))]); setParsed(null); setPaste(""); toast(`${ok.length} products added.`, "success"); }}>Add {parsed.filter((r) => !r.err).length} valid products</Button></div>}</div>
        )}
      </Card>

      <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-5 py-3.5 text-sm"><span className="flex items-center gap-2"><Sparkles className="size-4 text-brand" /> AI can now answer about <strong className="num">{products.filter((p) => p.status === "Active").length}</strong> products</span><button className="text-brand hover:underline" onClick={sample}>Use sample catalog</button></div>
      {products.length ? <div className="grid gap-2.5 md:grid-cols-2">{products.slice(0, 12).map((p) => <div key={p.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.images[0]} alt="" className="size-12 rounded-lg object-cover" /><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{p.name}</div><div className="text-xs text-ink-3">{money(p.discountPrice || p.price)} · {p.stock} in stock · {p.category}</div></div><button aria-label={`Remove ${p.name}`} onClick={() => store.remove("products", p.id)} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line hover:text-danger"><Trash2 className="size-4" /></button></div>)}{products.length > 12 && <p className="px-2 py-3 text-sm text-ink-3">+ {products.length - 12} more products</p>}</div> : <Card><EmptyState icon={<Package className="size-5" />} title="Your first product starts here" text="Add one manually, import a file, or try the sample catalog." /></Card>}
      <ImportModal open={imp} file={file} onClose={() => setImp(false)} />
    </div>
  );
}

/* ───────── 4 · Knowledge ───────── */
function StepKnowledge({ reg }: Reg) {
  const { toast } = useUI();
  const faqs = useStore<any[]>("faqs", []);
  const docs = useStore<any[]>("documents", []);
  const saved = store.get<any>("onboarding.policies", { delivery: "Dhaka: 1–2 days, ৳80. Outside Dhaka including Gazipur: 2–4 days, ৳130.", returns: "Exchange unused products with original tags within 7 days. Return courier fees apply.", offers: "No unapproved discounts. Ask our team about bulk orders.", payments: ["bKash", "Nagad", "Cash on Delivery", "Card"] });
  const [k, setK] = useState<any>({ ...saved, dhakaCharge: store.get("client.deliveryCharges.dhaka", 80), outsideCharge: store.get("client.deliveryCharges.outside", 130) });
  const [faq, setFaq] = useState<null | { id?: string; question: string; answer: string }>(null);
  useEffect(() => { reg((validate) => {
    if (validate) { if (!k.delivery.trim() || !k.returns.trim()) return "Add delivery and return policies before continuing."; if (!k.payments.length) return "Choose at least one accepted payment method."; }
    const policies = { delivery: k.delivery, returns: k.returns, offers: k.offers, payments: k.payments };
    store.set("onboarding.policies", policies);
    store.set("client.deliveryCharges", { dhaka: +k.dhakaCharge, outside: +k.outsideCharge });
    store.set("knowledge", [...store.get<any[]>("faqs", []), ...store.get<any[]>("documents", []), { id: "policy-delivery", title: "Delivery policy", text: policies.delivery, type: "Policy", status: "Indexed" }, { id: "policy-return", title: "Returns & exchanges", text: policies.returns, type: "Policy", status: "Indexed" }, { id: "policy-payment", title: "Payment methods", text: policies.payments.join(", "), type: "Policy", status: "Indexed" }]);
    store.set("onboarding.knowledgeInitialized", true);
    return null;
  }); });
  const starters = [["How long does delivery take?", "Inside Dhaka: 1–2 days. Outside Dhaka: 2–4 days."], ["Can I exchange a product?", "Exchange unused items with original tags within 7 days."], ["Which payment methods are accepted?", "bKash, Nagad, Cash on Delivery and cards."]];
  const saveFaq = () => { if (!faq || faq.question.trim().length < 3 || !faq.answer.trim()) return toast("Add a question and an answer.", "warning"); const id = faq.id || uid(); const e = { id, title: faq.question, question: faq.question, answer: faq.answer, text: faq.answer, type: "FAQ", status: "Indexed" }; if (faq.id) store.patch("faqs", id, e); else store.add("faqs", e); syncKnowledge(); setFaq(null); toast("FAQ saved.", "success"); };
  const upload = async (file?: File) => { if (!file) return; if (file.size > 2e6 || !/\.(pdf|txt)$/i.test(file.name)) return toast("Choose a PDF or text file under 2 MB.", "error"); store.add("documents", { name: file.name, title: file.name, type: "Document", text: /\.txt$/i.test(file.name) ? (await file.text()).slice(0, 50000) : `PDF indexing is simulated for ${file.name}.`, size: file.size, status: "Indexing" }); setTimeout(() => { store.update<any[]>("documents", (ds) => ds.forEach((d) => { if (d.status === "Indexing") d.status = "Indexed"; })); syncKnowledge(); }, 800); };
  return (
    <div className="space-y-6">
      <Card className="p-7">
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold tracking-tight">Frequently asked questions</h2><Button size="sm" icon={<Plus className="size-4" />} onClick={() => setFaq({ question: "", answer: "" })}>Add FAQ</Button></div>
        <div className="mt-4">{faqs.length ? faqs.map((f) => <div key={f.id} className="flex items-start justify-between gap-4 border-b border-line py-3.5 last:border-0"><div><div className="text-sm font-medium">{f.question || f.title}</div><p className="text-[13px] text-ink-3">{f.answer || f.text}</p></div><div className="flex shrink-0"><button aria-label="Edit FAQ" onClick={() => setFaq({ id: f.id, question: f.question || f.title, answer: f.answer || f.text })} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line"><Pencil className="size-4" /></button><button aria-label="Delete FAQ" onClick={() => { store.remove("faqs", f.id); syncKnowledge(); }} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line hover:text-danger"><Trash2 className="size-4" /></button></div></div>) : <EmptyState title="What do customers ask you most?" text="Add an FAQ, or use our helpful starter questions." />}</div>
        <button className="mt-3 text-sm text-brand hover:underline" onClick={() => { starters.forEach(([q, a]) => store.add("faqs", { title: q, question: q, answer: a, text: a, type: "FAQ", status: "Indexed" })); syncKnowledge(); toast("Starter FAQs added.", "success"); }}>Add 3 starter FAQs →</button>
      </Card>
      <Card className="p-7">
        <h2 className="text-xl font-semibold tracking-tight">Your policies</h2>
        <div className="mt-5 space-y-5">
          <Field label="Delivery policy *"><Textarea rows={3} value={k.delivery} onChange={(e) => setK({ ...k, delivery: e.target.value })} /></Field>
          <div className="grid gap-5 sm:grid-cols-2"><Field label="Dhaka delivery charge (৳)"><Input type="number" min={0} value={k.dhakaCharge} onChange={(e) => setK({ ...k, dhakaCharge: e.target.value })} /></Field><Field label="Outside Dhaka charge (৳)"><Input type="number" min={0} value={k.outsideCharge} onChange={(e) => setK({ ...k, outsideCharge: e.target.value })} /></Field></div>
          <Field label="Returns & exchanges *"><Textarea rows={3} value={k.returns} onChange={(e) => setK({ ...k, returns: e.target.value })} /></Field>
          <div><span className="mb-2 block text-[13px] font-medium text-ink-2">Payment methods</span><div className="flex flex-wrap gap-6">{["bKash", "Nagad", "Cash on Delivery", "Card"].map((p) => <Checkbox key={p} checked={k.payments.includes(p)} onChange={(v) => setK({ ...k, payments: v ? [...k.payments, p] : k.payments.filter((x: string) => x !== p) })} label={p} />)}</div></div>
          <Field label="Offers & promotions"><Textarea rows={2} value={k.offers} onChange={(e) => setK({ ...k, offers: e.target.value })} /></Field>
        </div>
      </Card>
      <Card className="p-7">
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold tracking-tight">Business documents</h2><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line-strong px-4 py-2 text-sm font-medium hover:border-brand"><Upload className="size-4" /> Add document<input type="file" accept=".pdf,.txt" className="sr-only" aria-label="Upload PDF or text knowledge" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} /></label></div>
        <p className="mt-2 text-xs text-ink-3">PDF or text, up to 2 MB. Indexing is simulated; PDF text is not extracted by this preview.</p>
        {docs.map((d) => <div key={d.id} className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-line p-3.5 text-sm"><span className="font-medium">{d.name || d.title}</span><div className="flex items-center gap-2"><Badge tone={d.status === "Indexed" ? "success" : "info"}>{d.status}</Badge><button aria-label="Delete document" onClick={() => { store.remove("documents", d.id); syncKnowledge(); }} className="grid size-8 place-items-center rounded-lg text-ink-3 hover:text-danger"><Trash2 className="size-4" /></button></div></div>)}
      </Card>
      <Modal open={!!faq} onClose={() => setFaq(null)} title={faq?.id ? "Edit FAQ" : "Add an FAQ"} footer={<><Button variant="ghost" onClick={() => setFaq(null)}>Cancel</Button><Button variant="primary" onClick={saveFaq}>Save FAQ</Button></>}>
        {faq && <div className="space-y-4"><Field label="Customer question"><Input value={faq.question} onChange={(e) => setFaq({ ...faq, question: e.target.value })} /></Field><Field label="Answer"><Textarea rows={4} value={faq.answer} onChange={(e) => setFaq({ ...faq, answer: e.target.value })} /></Field></div>}
      </Modal>
    </div>
  );
}

/* ───────── 5 · Personality ───────── */
function StepPersonality({ reg }: Reg) {
  const { toast } = useUI();
  const [a, setA] = useState<any>(() => structuredClone(store.get("agent")));
  const set = (p: any) => setA((x: any) => ({ ...x, ...p }));
  const tog = (key: string, v: string) => set({ [key]: a[key].includes(v) ? a[key].filter((x: string) => x !== v) : [...a[key], v] });
  useEffect(() => { reg((validate) => {
    if (validate) { if (a.name.trim().length < 2) return "Give your agent a name."; if (!a.languages.length || !["name", "phone", "address", "product", "quantity"].every((x) => a.orderFields.includes(x))) return "Choose a language and include name, phone, address, product and quantity for orders."; if (!a.greeting.trim()) return "Add a greeting message."; }
    const prev = store.get<any>("agent");
    store.set("agent", { ...prev, ...a, greeting: String(a.greeting).replaceAll(prev.name, a.name) });
    store.set("onboarding.rulesSaved", true);
    return null;
  }); });
  const avatar = async (f?: File) => { if (!f) return; if (f.size > 500000) return toast("Use an image under 500 KB.", "error"); const r = new FileReader(); r.onload = () => set({ avatar: String(r.result) }); r.readAsDataURL(f); };
  const rules: [string, string, string][] = [["keyword", "Customer asks for an agent", "Includes “agent chai” and requests for a human."], ["angry", "Customer expresses frustration", "Escalate complaints instead of guessing."], ["unknown", "The agent doesn’t know the answer", "Hand over after two unknown questions."]];
  return (
    <Card className="p-7">
      <h2 className="text-xl font-semibold tracking-tight">Meet your newest teammate.</h2>
      <div className="mt-6 flex items-center gap-5"><span className="grid size-20 place-items-center overflow-hidden rounded-2xl border border-line-strong bg-raised text-brand">{a.avatar ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.avatar} alt="Agent avatar" className="size-full object-cover" /> : <Sparkles className="size-6" />}</span><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line-strong px-4 py-2 text-sm font-medium hover:border-brand"><ImagePlus className="size-4" /> Upload agent avatar<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Upload agent avatar" onChange={(e) => avatar(e.target.files?.[0])} /></label></div>
      <div className="mt-7 space-y-6">
        <Field label="Agent name *"><Input value={a.name} onChange={(e) => set({ name: e.target.value })} className="max-w-sm" /></Field>
        <div><span className="mb-2 block text-[13px] font-medium text-ink-2">Your agent’s tone</span><div className="flex flex-wrap gap-2">{["Friendly", "Professional", "Casual"].map((t) => <button key={t} type="button" onClick={() => set({ tone: t })} aria-pressed={a.tone === t} className={clsx("rounded-full border px-5 py-2 text-sm font-medium", a.tone === t ? "border-brand bg-brand text-white" : "border-line-strong text-ink-2 hover:border-brand")}>{t}</button>)}</div></div>
        <div><span className="mb-2 block text-[13px] font-medium text-ink-2">Customer languages</span><div className="flex flex-wrap gap-6">{["Bangla", "Banglish", "English"].map((l) => <Checkbox key={l} checked={a.languages.includes(l)} onChange={() => tog("languages", l)} label={l} />)}</div></div>
        <Field label="Greeting message *"><Textarea rows={3} value={a.greeting} onChange={(e) => set({ greeting: e.target.value })} /></Field>
        <label className="flex items-center justify-between gap-6 rounded-xl border border-line p-4"><span className="text-sm"><strong className="font-medium">Introduce the agent as an AI assistant</strong><span className="block text-[13px] text-ink-3">We recommend keeping this enabled for transparency.</span></span><Switch checked={a.disclosure} label="AI disclosure" onChange={(v) => set({ disclosure: v })} /></label>
      </div>
      <div className="my-8 h-px bg-line" />
      <h2 className="text-xl font-semibold tracking-tight">When should a human step in?</h2>
      <div className="mt-5 space-y-3">{rules.map(([id, t, d]) => <label key={id} className="flex items-center justify-between gap-6 rounded-xl border border-line p-4"><span className="text-sm"><strong className="font-medium">{t}</strong><span className="block text-[13px] text-ink-3">{d}</span></span><Switch checked={a.handover[id] !== false} label={t} onChange={(v) => set({ handover: { ...a.handover, [id]: v } })} /></label>)}</div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Escalate orders above (৳)"><Input type="number" min={0} value={a.handover.amount} onChange={(e) => set({ handover: { ...a.handover, amount: +e.target.value } })} /></Field><Field label="Outside business hours"><Select value={a.afterHours} onChange={(e) => set({ afterHours: e.target.value })}>{["Collect details and notify the team", "Reply with business hours", "Pause automated replies"].map((x) => <option key={x}>{x}</option>)}</Select></Field></div>
      <h2 className="mt-8 text-xl font-semibold tracking-tight">Collect these details for an order</h2>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">{["name", "phone", "address", "product", "quantity", "size", "colour"].map((f) => <Checkbox key={f} checked={a.orderFields.includes(f)} onChange={() => tog("orderFields", f)} label={f[0].toUpperCase() + f.slice(1)} />)}</div>
    </Card>
  );
}

/* ───────── 6 · Playground ───────── */
function StepPlayground({ reg }: Reg) {
  const agent = useStore<any>("agent", {});
  const clientName = useStore<string>("client.name", "");
  const products = useStore<Product[]>("products", []);
  const orders = useStore<any[]>("orders", []);
  const [channel, setChannel] = useState<"Facebook" | "Instagram" | "WhatsApp">("Facebook");
  type L = { role: "c" | "a" | "sys"; text: string; cards?: any[] };
  const [log, setLog] = useState<L[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const state = useRef<Record<string, any>>({});
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { reg(() => null); });
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [log, busy]);
  const reset = () => { state.current = {}; setLog([]); };
  const send = (msg: string) => {
    const q = msg.trim(); if (!q || busy) return;
    setLog((l) => [...l, { role: "c", text: q }]); setText(""); setBusy(true);
    setTimeout(() => {
      const r = MockAgent.reply({ message: q, channel, conversationState: state.current });
      const add: L[] = [{ role: "a", text: r.text, cards: r.cards.filter((c) => c.type === "product") }];
      if (r.orderDraft?.complete) { const o = saveOrder(r.orderDraft, channel, "playground"); store.patch("orders", o.id, { playground: true }); add.push({ role: "sys", text: `✓ ${o.id} saved · ${money(o.total)}` }); }
      if (r.handover) add.push({ role: "sys", text: "AI paused · A human is needed." });
      setLog((l) => [...l, ...add]); setBusy(false);
    }, 550);
  };
  const act = products.find((p) => p.status === "Active");
  const prompts = [`${act?.name || "A product"} price`, "Delivery koto din lage?", `I want to order ${products.find((p) => p.status === "Active" && p.stock > 0)?.name || "a shirt"}`, "agent chai"];
  const skin = { Facebook: "from-[#1d4ed8]/25", Instagram: "from-[#c026d3]/25", WhatsApp: "from-[#16a34a]/25" }[channel];
  return (
    <div className="space-y-6">
      <div className="inline-flex gap-1 rounded-xl border border-line bg-surface p-1">{(["Facebook", "Instagram", "WhatsApp"] as const).map((c) => <button key={c} aria-pressed={channel === c} onClick={() => setChannel(c)} className={clsx("rounded-lg px-4 py-2 text-sm font-medium", channel === c ? "bg-brand text-white" : "text-ink-2 hover:text-ink")}>{c === "Facebook" ? "Messenger" : c}</button>)}</div>
      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        <div className="mx-auto w-full max-w-[400px] overflow-hidden rounded-[2.5rem] border-[10px] border-[#0b0b0b] bg-surface shadow-pop">
          <div className="flex justify-between bg-[#0b0b0b] px-6 pb-1 text-[11px] text-white/80"><span>9:41</span><span>▮▮▮ 100%</span></div>
          <div className={clsx("flex items-center gap-3 border-b border-line bg-gradient-to-r to-transparent px-4 py-3", skin)}><span className="grid size-9 place-items-center rounded-full bg-brand text-white"><Sparkles className="size-4" /></span><div className="leading-tight"><div className="text-sm font-semibold">{agent.name} · {clientName}</div><div className="text-[11px] text-success">● AI assistant · Playground</div></div><button className="ml-auto grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-line" aria-label="Start a new conversation" onClick={reset}><RotateCcw className="size-4" /></button></div>
          <div role="log" aria-live="polite" aria-label="Agent playground conversation" className="scroll-y flex h-[420px] flex-col gap-2.5 p-4">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-brand px-3.5 py-2 text-sm text-white">{agent.greeting}</div>
            {log.map((m, i) => m.role === "c" ? <div key={i} className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-raised px-3.5 py-2 text-sm">{m.text}</div> : m.role === "sys" ? <div key={i} className="rounded-lg border border-brand-line bg-brand-soft px-3 py-2 text-xs text-brand">{m.text}</div> : <div key={i} className="max-w-[88%] rounded-2xl rounded-bl-md bg-brand px-3.5 py-2 text-sm text-white">{m.text}{m.cards?.map((c) => <div key={c.id} className="mt-2 flex items-center gap-2 rounded-lg bg-white p-2 text-[#111]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={c.image} alt="" className="size-10 rounded-md object-cover" /><div className="text-xs leading-tight"><div className="font-semibold">{c.name}</div><div className="text-[#555]">{money(c.price)}</div></div></div>)}</div>)}
            {busy && <div className="text-xs text-ink-3">Typing…</div>}<div ref={end} />
          </div>
          <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); send(text); }}><input aria-label="Message your agent" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask your agent anything…" autoComplete="off" className="h-10 flex-1 rounded-full border border-line-strong bg-bg-deep/60 px-4 text-sm focus:border-brand focus:outline-none" /><button aria-label="Send to agent" className="grid size-10 place-items-center rounded-full bg-brand text-white"><Send className="size-4" /></button></form>
        </div>
        <aside className="self-start rounded-2xl border border-line bg-surface p-7">
          <h3 className="text-xl font-semibold tracking-tight">Try a real customer question.</h3><p className="mt-2 text-sm text-ink-3">Your agent reads your saved catalog and policies. Every reply here is simulated.</p>
          <div className="mt-5 flex flex-wrap gap-2">{prompts.map((p) => <button key={p} onClick={() => send(p)} className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink-2 hover:border-brand hover:text-brand">{p}</button>)}</div>
          <div className="mt-6 rounded-xl border border-line bg-bg-deep/40 p-4 text-[13px] text-ink-3">Order flow: name → phone → address → product → quantity → size/colour. A completed draft is saved to Orders locally.</div>
          <p className="mt-4 text-sm text-ink-2">{orders.filter((o) => o.playground).length} playground orders saved.</p>
        </aside>
      </div>
      <Tip title="This is your safe space to experiment.">Try the customer’s language, an out-of-stock product, an unknown question, or a human handover. Reset the chat to try a different scenario.</Tip>
    </div>
  );
}

/* ───────── 7 · Go live ───────── */
function StepGoLive({ onJump }: { onJump: (n: number) => void }) {
  const { toast } = useUI();
  const channels = useStore<Channel[]>("channels", []);
  const products = useStore<Product[]>("products", []);
  const faqs = useStore<any[]>("faqs", []);
  const docs = useStore<any[]>("documents", []);
  const agent = useStore<any>("agent", {});
  const demo = useStore<any>("demo", {});
  const policies = useStore<any>("onboarding.policies", {});
  const rulesSaved = useStore<boolean>("onboarding.rulesSaved", false);
  const [on, setOn] = useState(false);
  const checks = useMemo(() => [
    { title: "Your business channels", detail: `${channels.filter((c) => c.status === "Connected").length} connected · Instagram message access checked separately`, ok: channels.some((c) => c.status === "Connected") && !demo.tokenExpired, step: 2 },
    { title: "Your product catalog", detail: `${products.filter((p) => p.status === "Active").length} active products ready for questions`, ok: products.some((p) => p.status === "Active"), step: 3 },
    { title: "Your business knowledge", detail: `${faqs.length} FAQs · ${docs.length} documents · delivery & returns policies`, ok: !!policies.delivery, step: 4 },
    { title: "Your personality & rules", detail: `${agent.name} · ${agent.tone} · AI disclosure ${agent.disclosure ? "on" : "off"}`, ok: !!rulesSaved, step: 5 },
    { title: "Instagram message access", detail: channels.some((c) => c.type === "Instagram" && c.status === "Connected") ? "Allow access to messages must be enabled." : "No connected Instagram account — not required.", ok: !channels.some((c) => c.type === "Instagram" && c.status === "Connected" && !c.messageAccess), step: 2 },
  ], [channels, products, faqs, docs, agent, demo, policies, rulesSaved]);
  const all = checks.every((c) => c.ok);
  const finish = (v: boolean) => { setOn(v); if (!v) return; store.set("client.agentLive", true); store.update<any>("onboarding", (o) => { o.completed = true; o.step = 7; }); toast("Your AI agent is live.", "success"); };
  return (
    <Card className="p-7">
      <h2 className="text-xl font-semibold tracking-tight">One last look at your setup.</h2>
      <div className="mt-4">{checks.map((c) => <div key={c.title} className="flex items-center gap-4 border-b border-line py-4 last:border-0"><span className={clsx("grid size-9 shrink-0 place-items-center rounded-full", c.ok ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{c.ok ? <Check className="size-4" /> : <TriangleAlert className="size-4" />}</span><div className="flex-1"><div className="text-sm font-medium">{c.title}</div><div className="text-[13px] text-ink-3">{c.detail}</div></div><button className="text-sm font-medium text-brand hover:underline" onClick={() => onJump(c.step)}>{c.ok ? "Review" : "Finish setup"} →</button></div>)}</div>
      <label className="mt-6 flex items-center justify-between gap-6 rounded-2xl border border-brand-line bg-brand-soft p-6"><span><strong className="text-lg">Turn on your AI sales agent</strong><span className="mt-1 block text-sm text-ink-2">{all ? "Ready when you are." : "Finish the setup items above to activate your agent."} Simulation only — no real messages will be sent.</span></span><Switch checked={on} disabled={!all} label="Turn on AI agent" onChange={finish} /></label>
      <p className="mt-5 text-[13px] text-ink-3">You’re always in control. Handover rules pause AI when a customer needs your team.</p>
    </Card>
  );
}
