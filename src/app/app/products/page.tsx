"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { BadgeHelp, ChevronLeft, ChevronRight, Download, Flame, FolderCog, ImagePlus, LayoutGrid, List, PackageSearch, PackageX, Pencil, Plus, Search, Tag, Trash2, Upload, X, Sparkles } from "lucide-react";
import { Badge, Button, Card, Checkbox, Drawer, EmptyState, Field, Input, Modal, PageHeader, Select, Switch, Table, Td, Textarea, Th, StatusBadge } from "@/components/ui";
import { AgentChat } from "@/components/app/agent-chat";
import { ImportModal } from "@/components/app/product-import";
import { store, uid, useStore, money, download, toCsv } from "@/lib/store";
import { useUI } from "@/components/providers";
import { SEED, type Product } from "@/lib/data";

const PER = 12;

export default function ProductsPage() {
  return <Suspense><Products /></Suspense>;
}

function SyncBadge({ p }: { p: Product }) {
  return <Badge tone={p.sync === "Error" ? "danger" : p.sync === "Pending" ? "warning" : "success"}>{p.sync === "Error" ? "! Sync error" : p.sync === "Pending" ? "◷ Pending" : "✓ Synced to AI"}</Badge>;
}

function Products() {
  const params = useSearchParams();
  const { toast, confirm } = useUI();
  const all = useStore<Product[]>("products", []);
  const cats = useStore<{ id: string; name: string }[]>("categories", []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [stock, setStock] = useState(params.get("stock") || "all");
  const [status, setStatus] = useState("All statuses");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [modal, setModal] = useState<null | "categories" | "offers" | "price" | "bulkprice" | "import">(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { try { const v = localStorage.getItem("sp-products-view"); if (v === "table") setView("table"); } catch {} }, []);

  const rows = useMemo(() => all
    .filter((p) => (p.name + " " + p.sku + " " + p.tags.join(" ")).toLowerCase().includes(query.toLowerCase()))
    .filter((p) => category === "All categories" || p.category === category)
    .filter((p) => stock === "all" || (stock === "low" ? p.stock > 0 && p.stock <= p.threshold : stock === "out" ? p.stock === 0 : p.stock > 0))
    .filter((p) => status === "All statuses" || p.status === status)
    .sort((a, b) => sort === "priceAsc" ? a.price - b.price : sort === "priceDesc" ? b.price - a.price : sort === "stock" ? a.stock - b.stock : sort === "asked" ? (b.askedCount || 0) - (a.askedCount || 0) : a.name.localeCompare(b.name)), [all, query, category, stock, status, sort]);
  const max = Math.max(1, Math.ceil(rows.length / PER));
  const pg = Math.min(page, max);
  const current = rows.slice((pg - 1) * PER, pg * PER);
  const popular = [...all].sort((a, b) => (b.askedCount || 0) - (a.askedCount || 0))[0];
  const out = all.filter((p) => p.stock === 0);
  const priceQs = all.reduce((n, p) => n + (p.priceQuestions || 0), 0);

  const setViewPersist = (v: "grid" | "table") => { setView(v); try { localStorage.setItem("sp-products-view", v); } catch {} };
  const toggle = (id: string, on: boolean) => setSelected((s) => { const n = new Set(s); on ? n.add(id) : n.delete(id); return n; });
  const retry = (id: string) => { store.patch("products", id, { sync: "Pending" }); setTimeout(() => { store.patch("products", id, { sync: "Synced to AI" }); toast("Product synced to your AI.", "success"); }, 700); };
  const bulk = (st: string) => { store.update<Product[]>("products", (ps) => ps.filter((p) => selected.has(p.id)).forEach((p) => { p.status = st; p.sync = "Synced to AI"; })); toast(`Selected products ${st === "Active" ? "published" : "unpublished"}.`, "success"); };
  const bulkDelete = async () => { if (await confirm({ title: `Delete ${selected.size} products?`, message: "These products will no longer be available to your AI. Existing orders keep their item details.", danger: true })) { store.update<Product[]>("products", (ps) => ps.filter((p) => !selected.has(p.id))); setSelected(new Set()); toast("Selected products deleted.", "success"); } };
  const exportCsv = () => { const list = selected.size ? all.filter((p) => selected.has(p.id)) : rows; download("makagent-products.csv", toCsv(list.map((p) => ({ name: p.name, sku: p.sku, category: p.category, price: p.price, discount_price: p.discountPrice, stock: p.stock, status: p.status, description: p.description, ai_instructions: p.instructions })))); };

  return (
    <>
      <PageHeader
        title="Your products. Your agent’s best answers."
        description="A thoughtful catalog makes every customer conversation more helpful."
        actions={<><Button icon={<FolderCog className="size-4" />} onClick={() => setModal("categories")}>Categories</Button><Button icon={<Tag className="size-4" />} onClick={() => setModal("offers")}>Offers</Button><Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>Add product</Button></>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { Icon: Flame, label: "Most asked about", title: popular?.name || "Your next bestseller", hint: `${popular?.askedCount || 0} catalog questions`, on: () => { setSort("asked"); setPage(1); } },
          { Icon: PackageX, label: "Out of stock, still in demand", title: `${out.length} products need a restock`, hint: `${out.reduce((n, p) => n + (p.askedCount || 0), 0)} questions about unavailable items`, on: () => { setStock("out"); setPage(1); } },
          { Icon: BadgeHelp, label: "Price questions", title: `${priceQs} moments of buying intent`, hint: "Clear prices help the conversation move forward.", on: () => setModal("price") },
        ].map(({ Icon, label, title, hint, on }) => (
          <button key={label} onClick={on} className="flex items-start gap-4 rounded-xl border border-line bg-surface p-5 text-left transition-colors hover:border-brand-line">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="size-5" /></span>
            <div><div className="text-xs uppercase tracking-wider text-ink-3">{label}</div><div className="mt-1 font-semibold">{title}</div><div className="mt-0.5 text-[13px] text-ink-3">{hint}</div></div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[240px] flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" /><Input aria-label="Search products" placeholder="Search products, SKU or tags…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} className="pl-10" /></div>
        <Select aria-label="Filter by category" className="w-auto" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>{["All categories", ...new Set(all.map((p) => p.category))].map((c) => <option key={c}>{c}</option>)}</Select>
        <Select aria-label="Filter by stock" className="w-auto" value={stock} onChange={(e) => { setStock(e.target.value); setPage(1); }}>{[["all", "All stock"], ["available", "In stock"], ["low", "Low stock"], ["out", "Out of stock"]].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</Select>
        <Select aria-label="Filter by status" className="w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>{["All statuses", "Active", "Draft"].map((s) => <option key={s}>{s}</option>)}</Select>
        <Select aria-label="Sort products" className="w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>{[["name", "Name A–Z"], ["priceAsc", "Price: low to high"], ["priceDesc", "Price: high to low"], ["stock", "Lowest stock"], ["asked", "Most asked"]].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</Select>
        <div role="group" aria-label="Catalog view" className="inline-flex rounded-lg border border-line bg-bg-deep/50 p-1">
          {([["grid", LayoutGrid], ["table", List]] as const).map(([v, Icon]) => <button key={v} aria-label={`${v} view`} aria-pressed={view === v} onClick={() => setViewPersist(v)} className={clsx("grid size-8 place-items-center rounded-md", view === v ? "bg-raised text-ink" : "text-ink-3 hover:text-ink")}><Icon className="size-4" /></button>)}
        </div>
      </div>

      <div className="my-4 flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <Checkbox checked={!!current.length && current.every((p) => selected.has(p.id))} onChange={(on) => setSelected((s) => { const n = new Set(s); current.forEach((p) => (on ? n.add(p.id) : n.delete(p.id))); return n; })} label={<>Select this page <span className="text-ink-3">({rows.length} products)</span></>} />
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" aria-label="Import catalog" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImportFile(f); setModal("import"); } e.target.value = ""; }} />
          <Button size="sm" icon={<Upload className="size-4" />} onClick={() => fileRef.current?.click()}>Import CSV</Button>
          <Button size="sm" icon={<Download className="size-4" />} onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-xl border border-brand-line bg-brand-soft px-4 py-3">
          <strong className="text-sm">{selected.size} selected</strong>
          <Button size="sm" onClick={() => bulk("Active")}>Publish</Button><Button size="sm" onClick={() => bulk("Draft")}>Unpublish</Button><Button size="sm" onClick={() => setModal("bulkprice")}>Change price</Button>
          <Button size="sm" variant="danger" onClick={bulkDelete}>Delete</Button><button className="ml-auto text-sm text-brand hover:underline" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {rows.length === 0 ? (
        <Card><EmptyState icon={<PackageSearch className="size-5" />} title="No products found" text="Try different filters, or add the first product to your catalog." action={<Button variant="primary" onClick={() => setEditing("new")}>Add a product</Button>} /></Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {current.map((p) => (
            <article key={p.id} className="group overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-line-strong">
              <div className="relative aspect-[6/5] overflow-hidden bg-raised">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images[0] || SEED.products[0].images[0]} alt={p.name} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute left-3 top-3"><input type="checkbox" aria-label={`Select ${p.name}`} checked={selected.has(p.id)} onChange={(e) => toggle(p.id, e.target.checked)} className="size-4 accent-[var(--brand)]" /></span>
                <span className="absolute right-3 top-3"><Badge tone={p.status === "Active" ? "success" : "neutral"}>{p.status}</Badge></span>
              </div>
              <div className="p-4">
                <div className="text-xs uppercase tracking-wider text-ink-3">{p.category}</div>
                <h3 className="mt-1 truncate font-semibold" title={p.name}>{p.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div className="num font-semibold">{money(p.discountPrice || p.price)}{p.discountPrice ? <del className="ml-2 text-[13px] font-normal text-ink-4">{money(p.price)}</del> : null}</div>
                  <span className={clsx("text-xs", p.stock === 0 ? "text-danger" : p.stock <= p.threshold ? "text-warning" : "text-ink-3")}>{p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2"><SyncBadge p={p} />{p.sync === "Error" ? <Button size="sm" onClick={() => retry(p.id)}>Retry sync</Button> : <Button size="sm" onClick={() => setEditing(p.id)}>Edit & preview</Button>}</div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <thead><tr><Th className="w-10" /><Th>Product</Th><Th>Price</Th><Th>Stock</Th><Th>Status</Th><Th>AI sync</Th><Th>Actions</Th></tr></thead>
            <tbody>{current.map((p) => (
              <tr key={p.id}>
                <Td><input type="checkbox" aria-label={`Select ${p.name}`} checked={selected.has(p.id)} onChange={(e) => toggle(p.id, e.target.checked)} className="accent-[var(--brand)]" /></Td>
                <Td><div className="flex items-center gap-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.images[0]} alt="" className="size-10 rounded-md object-cover" /><div><div className="font-medium text-ink">{p.name}</div><div className="text-xs text-ink-3">{p.sku} · {p.category}</div></div></div></Td>
                <Td className="num">{money(p.discountPrice || p.price)}</Td>
                <Td><Badge tone={p.stock <= p.threshold ? "warning" : "neutral"}>{p.stock === 0 ? "Out of stock" : p.stock <= p.threshold ? `${p.stock} · Low stock` : `${p.stock} available`}</Badge></Td>
                <Td><StatusBadge status={p.status} /></Td><Td><SyncBadge p={p} /></Td>
                <Td><div className="flex gap-2"><Button size="sm" onClick={() => setEditing(p.id)}>Edit</Button>{p.sync === "Error" && <Button size="sm" onClick={() => retry(p.id)}>Retry</Button>}</div></Td>
              </tr>))}</tbody>
          </Table>
        </Card>
      )}

      <div className="mt-5 flex items-center justify-between text-[13px] text-ink-3">
        <span>Showing {rows.length ? (pg - 1) * PER + 1 : 0}–{Math.min(pg * PER, rows.length)} of {rows.length}</span>
        <div className="flex items-center gap-3"><Button size="sm" disabled={pg <= 1} onClick={() => setPage(pg - 1)} icon={<ChevronLeft className="size-4" />}>Previous</Button><span className="num">{pg} / {max}</span><Button size="sm" disabled={pg >= max} onClick={() => setPage(pg + 1)}>Next <ChevronRight className="size-4" /></Button></div>
      </div>

      {editing && <ProductEditor key={editing} id={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} onDeleted={(id) => setSelected((s) => { const n = new Set(s); n.delete(id); return n; })} />}
      <CategoriesModal open={modal === "categories"} onClose={() => setModal(null)} />
      <OffersDrawer open={modal === "offers"} onClose={() => setModal(null)} cats={cats} />
      <Modal open={modal === "price"} onClose={() => setModal(null)} title="Where price questions happen" footer={<Button variant="primary" onClick={() => setModal(null)}>Done</Button>}>
        {[...all].sort((a, b) => (b.priceQuestions || 0) - (a.priceQuestions || 0)).slice(0, 5).map((p) => <div key={p.id} className="flex items-center justify-between border-b border-line py-3 last:border-0"><span>{p.name}</span><Badge tone="info">{p.priceQuestions || 0} questions</Badge></div>)}
      </Modal>
      <BulkPrice open={modal === "bulkprice"} onClose={() => setModal(null)} ids={selected} />
      <ImportModal open={modal === "import"} file={importFile} onClose={() => setModal(null)} />
    </>
  );
}

/* ───────── editor drawer ───────── */
function ProductEditor({ id, onClose, onDeleted }: { id?: string; onClose: () => void; onDeleted: (id: string) => void }) {
  const { toast, confirm } = useUI();
  const cats = useStore<{ id: string; name: string }[]>("categories", []);
  const original = id ? store.get<Product[]>("products", []).find((p) => p.id === id) : undefined;
  const [d, setD] = useState<Product>(() => original ? structuredClone(original) : { id: uid(), clientId: "cl-dhaka", name: "", sku: "", category: cats[0]?.name || "Shirts", description: "", price: 0, discountPrice: 0, stock: 0, threshold: 5, lowStockThreshold: 5, variants: [{ size: "M", colour: "Standard", stock: 0 }], images: [], tags: [], delivery: 80, deliveryOverride: null, status: "Draft", sync: "Pending", instructions: "", aiInstructions: "", askedCount: 0, priceQuestions: 0 });
  const [tab, setTab] = useState<"details" | "preview">("details");
  const [tags, setTags] = useState(d.tags.join(", "));
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setD((x) => ({ ...x, [k]: v }));
  const setVariant = (i: number, patch: Partial<Product["variants"][0]>) => setD((x) => { const variants = x.variants.map((v, k) => (k === i ? { ...v, ...patch } : v)); return { ...x, variants, stock: variants.reduce((n, v) => n + (Number(v.stock) || 0), 0) }; });
  const setTotal = (total: number) => setD((x) => ({ ...x, stock: total, variants: x.variants.map((v, i, a) => ({ ...v, stock: Math.floor(total / a.length) + (i < total % a.length ? 1 : 0) })) }));

  const addImages = async (files: FileList | null) => {
    if (!files) return;
    const list = [...files];
    if (list.length + d.images.length > 4 || list.some((f) => f.size > 500000 || !["image/png", "image/jpeg", "image/webp"].includes(f.type))) return toast("Use up to 4 PNG/JPG/WebP images, each under 500 KB.", "error");
    const imgs = await Promise.all(list.map((f) => new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(f); })));
    setD((x) => ({ ...x, images: [...x.images, ...imgs] }));
  };

  const save = () => {
    const draft = { ...d, tags: tags.split(",").map((s) => s.trim()).filter(Boolean) };
    if (!draft.name.trim() || draft.price <= 0 || !Number.isInteger(draft.stock) || draft.stock < 0) return toast("Add a name, valid price and whole-number stock.", "error");
    if (draft.discountPrice && draft.discountPrice >= draft.price) return toast("The discount price must be below the base price.", "warning");
    if (draft.sku && store.get<Product[]>("products", []).some((p) => p.id !== draft.id && p.sku === draft.sku)) return toast("This SKU already belongs to another product.", "error");
    if (new Set(draft.variants.map((v) => v.size.toLowerCase() + "|" + v.colour.toLowerCase())).size !== draft.variants.length) return toast("Each size / colour combination must be unique.", "warning");
    draft.sku = draft.sku || "DT-" + Date.now().toString().slice(-6);
    draft.images = draft.images.length ? draft.images : [SEED.products[1].images[0]];
    draft.lowStockThreshold = draft.threshold;
    draft.aiInstructions = draft.instructions;
    draft.sync = "Pending";
    if (id) store.patch("products", id, draft); else store.add("products", draft);
    toast("Product saved. Syncing to your AI…", "info");
    setTimeout(() => { store.patch("products", draft.id, { sync: "Synced to AI" }); toast("Product synced. Your AI uses the updated catalog.", "success"); }, 700);
    onClose();
  };

  return (
    <Drawer open onClose={onClose} width="max-w-2xl" title={id ? "A closer look at your product" : "Add something worth talking about"}
      footer={<>{id && <Button variant="danger" className="mr-auto" onClick={async () => { if (await confirm({ title: "Delete this product?", message: `${d.name} will be removed from the catalog. Existing order items are kept.`, danger: true })) { store.remove("products", id); onDeleted(id); toast("Product deleted.", "success"); onClose(); } }}>Delete</Button>}<Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save product</Button></>}>
      <div className="mb-6 inline-flex rounded-lg border border-line bg-bg-deep/50 p-1">
        <button onClick={() => setTab("details")} className={clsx("rounded-md px-4 py-1.5 text-sm font-medium", tab === "details" ? "bg-raised" : "text-ink-3")}>Product details</button>
        <button onClick={() => { if (!id) return toast("Save the new product before previewing it.", "info"); setTab("preview"); }} className={clsx("inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium", tab === "preview" ? "bg-raised" : "text-ink-3")}><Sparkles className="size-3.5" /> AI preview</button>
      </div>
      {tab === "preview" ? (
        <>
          <div className="mb-4 rounded-lg border border-line bg-bg-deep/40 p-3.5 text-[13px] text-ink-2">This preview uses your <strong>saved</strong> product data. Save edits first to test updated prices or stock. Draft products can be previewed here but are not sold in customer conversations.</div>
          <AgentChat productId={id} greeting={`Ask a question about ${d.name}.`} saveOrders={false} />
        </>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name *"><Input value={d.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="SKU"><Input value={d.sku} onChange={(e) => set("sku", e.target.value)} placeholder="DT-025" /></Field>
            <Field label="Category"><Select value={d.category} onChange={(e) => set("category", e.target.value)}>{[...new Set([...cats.map((c) => c.name), d.category])].map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Status"><Select value={d.status} onChange={(e) => set("status", e.target.value)}><option>Active</option><option>Draft</option></Select></Field>
            <Field label="Description" className="sm:col-span-2"><Textarea rows={3} value={d.description} onChange={(e) => set("description", e.target.value)} /></Field>
            <Field label="Price (৳) *"><Input type="number" min={1} value={d.price || ""} onChange={(e) => set("price", +e.target.value)} /></Field>
            <Field label="Discount price (৳)"><Input type="number" min={0} value={d.discountPrice || ""} onChange={(e) => set("discountPrice", +e.target.value)} placeholder="Optional" /></Field>
            <Field label="Total stock *"><Input type="number" min={0} value={d.stock} onChange={(e) => setTotal(Math.max(0, Math.floor(+e.target.value || 0)))} /></Field>
            <Field label="Low-stock threshold"><Input type="number" min={0} value={d.threshold} onChange={(e) => set("threshold", +e.target.value)} /></Field>
          </div>
          <div>
            <h3 className="font-semibold">Sizes, colours & variant stock</h3>
            <p className="mb-3 text-[13px] text-ink-3">Variant changes update total stock. Changing total stock redistributes it evenly.</p>
            <div className="space-y-2.5">{d.variants.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_100px_36px] items-end gap-2.5">
                <Field label={i === 0 ? "Size" : undefined}><Input value={v.size} onChange={(e) => setVariant(i, { size: e.target.value })} /></Field>
                <Field label={i === 0 ? "Colour" : undefined}><Input value={v.colour} onChange={(e) => setVariant(i, { colour: e.target.value })} /></Field>
                <Field label={i === 0 ? "Stock" : undefined}><Input type="number" min={0} value={v.stock} onChange={(e) => setVariant(i, { stock: Math.max(0, Math.floor(+e.target.value || 0)) })} /></Field>
                <button aria-label="Remove variant" disabled={d.variants.length <= 1} onClick={() => setD((x) => { const variants = x.variants.filter((_, k) => k !== i); return { ...x, variants, stock: variants.reduce((n, vv) => n + vv.stock, 0) }; })} className="grid size-10 place-items-center rounded-lg text-ink-3 hover:bg-line disabled:opacity-30"><X className="size-4" /></button>
              </div>))}</div>
            <Button size="sm" className="mt-3" icon={<Plus className="size-4" />} onClick={() => setD((x) => ({ ...x, variants: [...x.variants, { size: "L", colour: "Standard", stock: 0 }] }))}>Add variant</Button>
          </div>
          <div>
            <h3 className="mb-3 font-semibold">Product images</h3>
            <div className="mb-3 flex flex-wrap gap-3">{d.images.map((src, i) => <div key={i} className="relative">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={src} alt={`Product image ${i + 1}`} className="size-20 rounded-lg object-cover" /><button aria-label={`Remove image ${i + 1}`} onClick={() => setD((x) => ({ ...x, images: x.images.filter((_, k) => k !== i) }))} className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-danger text-white"><X className="size-3" /></button></div>)}</div>
            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-line-strong p-4 text-sm text-ink-3 hover:border-brand"><span className="inline-flex items-center gap-2 font-medium text-ink"><ImagePlus className="size-4" /> Upload images</span><span>Up to 4 images, 500 KB each. Saved locally, not uploaded.</span><input type="file" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" aria-label="Upload product images" onChange={(e) => addImages(e.target.files)} /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tags (comma-separated)"><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="linen, bestseller" /></Field>
            <Field label="Delivery charge override (৳)"><Input type="number" min={0} value={d.deliveryOverride ?? ""} onChange={(e) => set("deliveryOverride", e.target.value === "" ? null : +e.target.value)} placeholder="Use business default" /></Field>
            <Field label="AI instructions" className="sm:col-span-2" hint="The agent respects stock and stored prices; free-form instructions are stored as the future production prompt specification."><Textarea rows={3} value={d.instructions} onChange={(e) => set("instructions", e.target.value)} placeholder="e.g. Never offer more than 10% discount" /></Field>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function BulkPrice({ open, onClose, ids }: { open: boolean; onClose: () => void; ids: Set<string> }) {
  const { toast } = useUI();
  const [v, setV] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Change selected product prices" size="sm" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!(+v > 0)} onClick={() => { store.update<Product[]>("products", (ps) => ps.filter((p) => ids.has(p.id)).forEach((p) => { p.price = +v; p.discountPrice = 0; p.sync = "Synced to AI"; })); toast("Selected prices updated.", "success"); setV(""); onClose(); }}>Update prices</Button></>}>
      <Field label="New price for each selected product (৳)"><Input type="number" min={1} value={v} onChange={(e) => setV(e.target.value)} /></Field>
      <p className="mt-3 text-[13px] text-ink-3">Existing discount prices will be cleared. This changes each selected product to the same base price.</p>
    </Modal>
  );
}

function CategoriesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast, confirm } = useUI();
  const cats = useStore<{ id: string; name: string }[]>("categories", []);
  const products = useStore<Product[]>("products", []);
  const [name, setName] = useState("");
  const [rename, setRename] = useState<{ id: string; name: string } | null>(null);
  const exists = (n: string, except?: string) => cats.some((c) => c.id !== except && c.name.toLowerCase() === n.toLowerCase());
  return (
    <Modal open={open} onClose={onClose} title="Organise your categories" footer={<Button variant="primary" onClick={onClose}>Done</Button>}>
      <form className="mb-5 flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); const n = name.trim(); if (n.length < 2) return; if (exists(n)) return toast("That category already exists.", "warning"); store.add("categories", { name: n }); setName(""); toast("Category added.", "success"); }}>
        <Field label="New category" className="flex-1"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field><Button variant="primary" type="submit">Add</Button>
      </form>
      {cats.map((c) => (
        <div key={c.id} className="flex items-center justify-between border-b border-line py-3 last:border-0">
          {rename?.id === c.id ? (
            <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); const n = rename.name.trim(); if (n.length < 2) return; if (exists(n, c.id)) return toast("That category already exists.", "warning"); store.patch("categories", c.id, { name: n }); store.update<Product[]>("products", (ps) => ps.filter((p) => p.category === c.name).forEach((p) => (p.category = n))); store.update<any[]>("offers", (os) => os.filter((o) => o.category === c.name).forEach((o) => (o.category = n))); setRename(null); toast("Category renamed.", "success"); }}>
              <Input autoFocus value={rename.name} onChange={(e) => setRename({ ...rename, name: e.target.value })} /><Button type="submit" variant="primary">Save</Button><Button type="button" variant="ghost" onClick={() => setRename(null)}>Cancel</Button>
            </form>
          ) : (
            <>
              <div><div className="font-medium">{c.name}</div><div className="text-xs text-ink-3">{products.filter((p) => p.category === c.name).length} products</div></div>
              <div className="flex gap-1">
                <button aria-label={`Rename ${c.name}`} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line hover:text-ink" onClick={() => setRename({ id: c.id, name: c.name })}><Pencil className="size-4" /></button>
                <button aria-label={`Delete ${c.name}`} className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line hover:text-danger" onClick={async () => { if (await confirm({ title: "Delete category?", message: `Products in ${c.name} move to Uncategorized. Their prices and stock stay unchanged.`, danger: true })) { store.remove("categories", c.id); store.update<Product[]>("products", (ps) => ps.filter((p) => p.category === c.name).forEach((p) => (p.category = "Uncategorized"))); toast("Category removed.", "success"); } }}><Trash2 className="size-4" /></button>
              </div>
            </>
          )}
        </div>
      ))}
    </Modal>
  );
}

function OffersDrawer({ open, onClose, cats }: { open: boolean; onClose: () => void; cats: { id: string; name: string }[] }) {
  const { toast, confirm } = useUI();
  const offers = useStore<any[]>("offers", []);
  const blank = { name: "", category: cats[0]?.name || "", percent: 10, validUntil: "2026-12-31" };
  const [f, setF] = useState<any>(blank);
  const [editId, setEditId] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  useEffect(() => { if (open) setF({ ...blank, category: cats[0]?.name || "" }); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Drawer open={open} onClose={onClose} title="Offers with clear boundaries" footer={<Button variant="primary" onClick={onClose}>Done</Button>}>
      <p className="mb-5 text-sm text-ink-2">These rules are available to your AI. Only enabled, unexpired offers apply to their selected category.</p>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (f.name.trim().length < 2) return; const v = { ...f, percent: +f.percent, enabled: true }; editId ? store.patch("offers", editId, v) : store.add("offers", v); setF({ ...blank, category: cats[0]?.name || "" }); setEditId(null); toast("Offer saved.", "success"); }}>
        <Field label="Offer name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Category"><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{cats.map((c) => <option key={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Discount (%)"><Input type="number" min={1} max={90} value={f.percent} onChange={(e) => setF({ ...f, percent: e.target.value })} /></Field>
        <Field label="Valid until"><Input type="date" value={f.validUntil} onChange={(e) => setF({ ...f, validUntil: e.target.value })} /></Field>
        <div className="sm:col-span-2"><Button type="submit" variant="primary" icon={<Plus className="size-4" />}>{editId ? "Save offer" : "Create offer"}</Button></div>
      </form>
      <div className="my-6 h-px bg-line" />
      {offers.map((o) => (
        <div key={o.id} className="flex items-center justify-between gap-3 border-b border-line py-3.5 last:border-0">
          <div><div className="font-medium">{o.name}</div><div className="text-xs text-ink-3">{o.percent}% off {o.category} · until {o.validUntil}</div><div className="mt-1.5"><Badge tone={o.validUntil < today ? "danger" : o.enabled ? "success" : "neutral"}>{o.validUntil < today ? "Expired" : o.enabled ? "Active" : "Paused"}</Badge></div></div>
          <div className="flex items-center gap-1.5">
            <Switch checked={o.enabled} label={`Enable ${o.name}`} onChange={(v) => { store.patch("offers", o.id, { enabled: v }); toast("Offer rule updated.", "success"); }} />
            <button aria-label="Edit offer" className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line" onClick={() => { setF({ name: o.name, category: o.category, percent: o.percent, validUntil: o.validUntil }); setEditId(o.id); }}><Pencil className="size-4" /></button>
            <button aria-label="Delete offer" className="grid size-9 place-items-center rounded-lg text-ink-3 hover:bg-line hover:text-danger" onClick={async () => { if (await confirm({ title: "Delete offer?", message: "The agent will no longer use this discount rule.", danger: true })) { store.remove("offers", o.id); toast("Offer deleted.", "success"); } }}><Trash2 className="size-4" /></button>
          </div>
        </div>
      ))}
      {!offers.length && <p className="text-sm text-ink-3">No offers yet.</p>}
    </Drawer>
  );
}
