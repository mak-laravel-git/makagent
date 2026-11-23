"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { CalendarDays, ChevronLeft, ChevronRight, ImagePlus, Plus, Send, Sparkles, Trash2, X } from "lucide-react";
import { Badge, Button, Card, CardHeader, Checkbox, ChannelChip, Drawer, EmptyState, Field, Input, PageHeader, Select, StatusBadge, Tabs, Textarea } from "@/components/ui";
import { store, uid, useStore } from "@/lib/store";
import { useUI } from "@/components/providers";
import type { Post, Product } from "@/lib/data";

const TONES = ["Friendly", "Professional", "Playful", "Festive"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const today = () => new Date().toISOString().slice(0, 10);

function caption(product: Product | undefined, tone: string, tags: boolean) {
  const n = product?.name ?? "our latest piece";
  const p = product ? `৳${(product.discountPrice || product.price).toLocaleString("en-BD")}` : "";
  const open: Record<string, string> = { Friendly: `Meet ${n}.`, Professional: `Introducing ${n}.`, Playful: `Say hello to ${n} ✨`, Festive: `The season calls for ${n}.` };
  const body: Record<string, string> = { Friendly: "Comfortable, well made, and ready when you are.", Professional: "Crafted in Bangladesh with attention to every detail.", Playful: "Your wardrobe called — it wants this one.", Festive: "Celebrate in something you’ll love wearing again." };
  return `${open[tone]} ${body[tone]}${p ? ` From ${p}.` : ""} Message us to order.${tags ? " #DhakaThreads #MadeInBangladesh" : ""}`;
}

export default function PostsPage() {
  const { toast, confirm } = useUI();
  const posts = useStore<Post[]>("posts", []);
  const products = useStore<Product[]>("products", []);
  const [tab, setTab] = useState<"calendar" | "all" | "Draft" | "Scheduled" | "Published">("calendar");
  const [editing, setEditing] = useState<Post | null>(null);
  // Open on the current month, or — if it has no posts — on the month of the nearest post, so the calendar is never empty.
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [seeked, setSeeked] = useState(false);
  useEffect(() => {
    if (seeked || !posts.length) return;
    setSeeked(true);
    const key = `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}`;
    if (posts.some((p) => p.date.startsWith(key))) return;
    const now = new Date().toISOString().slice(0, 10);
    const nearest = [...posts].sort((a, b) => Math.abs(+new Date(a.date) - +new Date(now)) - Math.abs(+new Date(b.date) - +new Date(now)))[0];
    const d = new Date(nearest.date + "T12:00:00");
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  }, [posts, seeked, cursor]);

  const days = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const lead = (first.getDay() + 6) % 7;
    const count = new Date(cursor.y, cursor.m + 1, 0).getDate();
    return [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  }, [cursor]);
  const key = (d: number) => `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const list = tab === "calendar" || tab === "all" ? posts : posts.filter((p) => p.status === tab);
  const shift = (n: number) => setCursor((c) => { const d = new Date(c.y, c.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  const blank = (): Post => ({ id: uid(), text: "", channels: ["Facebook"], image: "", status: "Draft", date: today(), time: "18:00" });
  const save = (p: Post, status: Post["status"]) => {
    const post = { ...p, status };
    if (posts.some((x) => x.id === p.id)) store.patch("posts", p.id, post); else store.add("posts", post);
    toast(status === "Published" ? "Post published (simulated)." : status === "Scheduled" ? `Post scheduled for ${p.date} at ${p.time}.` : "Draft saved.", "success");
    setEditing(null);
  };

  return (
    <>
      <PageHeader title="Keep your business showing up." description="Compose, schedule and review every post in one calendar."
        actions={<Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing(blank())}>New post</Button>} />
      <div className="mb-5"><Tabs value={tab} onChange={setTab} options={[{ value: "calendar", label: "Calendar" }, { value: "all", label: "All posts", count: posts.length }, { value: "Draft", label: "Drafts" }, { value: "Scheduled", label: "Scheduled" }, { value: "Published", label: "Published" }]} /></div>

      {tab === "calendar" ? (
        <Card>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-lg font-semibold tracking-tight">{MONTHS[cursor.m]} {cursor.y}</h2>
            <div className="flex gap-1"><button aria-label="Previous month" onClick={() => shift(-1)} className="grid size-9 place-items-center rounded-lg hover:bg-line"><ChevronLeft className="size-4" /></button><button aria-label="Next month" onClick={() => shift(1)} className="grid size-9 place-items-center rounded-lg hover:bg-line"><ChevronRight className="size-4" /></button></div>
          </div>
          <div className="grid grid-cols-7 border-b border-line text-center text-xs font-medium uppercase tracking-wider text-ink-4">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="py-2.5">{d}</div>)}</div>
          <div className="grid grid-cols-7">
            {days.map((d, i) => {
              const items = d ? posts.filter((p) => p.date === key(d)) : [];
              return (
                <div key={i} className={clsx("min-h-[112px] border-b border-r border-line p-2 [&:nth-child(7n)]:border-r-0", !d && "bg-bg-deep/30")}>
                  {d && <><div className={clsx("num mb-1.5 text-xs", key(d) === today() ? "grid size-6 place-items-center rounded-full bg-brand font-bold text-white" : "text-ink-3")}>{d}</div>
                    <div className="space-y-1">{items.slice(0, 3).map((p) => <button key={p.id} onClick={() => setEditing(structuredClone(p))} className={clsx("block w-full truncate rounded px-1.5 py-1 text-left text-[11px] font-medium", p.status === "Published" ? "bg-success/15 text-success" : p.status === "Scheduled" ? "bg-info/15 text-info" : "bg-raised text-ink-2")}>{p.time} · {p.text || "Untitled"}</button>)}{items.length > 3 && <div className="text-[11px] text-ink-4">+{items.length - 3} more</div>}</div></>}
                </div>
              );
            })}
          </div>
        </Card>
      ) : list.length === 0 ? (
        <Card><EmptyState icon={<CalendarDays className="size-5" />} title="Nothing here yet" text="Compose a post to get started." action={<Button variant="primary" onClick={() => setEditing(blank())}>New post</Button>} /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...list].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map((p) => (
            <article key={p.id} className="group overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-line-strong">
              {p.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.image} alt="" className="aspect-[4/3] w-full object-cover" />}
              <div className="p-4">
                <div className="flex items-center justify-between"><StatusBadge status={p.status} /><span className="num text-xs text-ink-3">{p.date} · {p.time}</span></div>
                <p className="mt-3 line-clamp-3 text-sm text-ink-2">{p.text || "No caption"}</p>
                <div className="mt-3 flex flex-wrap gap-1">{p.channels.map((c) => <ChannelChip key={c} type={c} compact />)}</div>
                <div className="mt-4 flex gap-2"><Button size="sm" onClick={() => setEditing(structuredClone(p))}>{p.status === "Published" ? "View" : "Edit"}</Button><Button size="sm" variant="ghost" aria-label="Delete post" onClick={async () => { if (await confirm({ title: "Delete this post?", danger: true })) { store.remove("posts", p.id); toast("Post deleted.", "success"); } }}><Trash2 className="size-4" /></Button></div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && <Composer post={editing} products={products} onClose={() => setEditing(null)} onSave={save} />}
    </>
  );
}

function Composer({ post, products, onClose, onSave }: { post: Post; products: Product[]; onClose: () => void; onSave: (p: Post, status: Post["status"]) => void }) {
  const { toast } = useUI();
  const [p, setP] = useState<Post>(post);
  const [tone, setTone] = useState("Friendly");
  const [tags, setTags] = useState(true);
  const [prodId, setProdId] = useState(products[0]?.id ?? "");
  const [preview, setPreview] = useState<"Facebook" | "Instagram">("Facebook");
  const locked = post.status === "Published";
  const limit = p.channels.includes("Instagram") ? 2200 : 5000;
  const set = (x: Partial<Post>) => setP((v) => ({ ...v, ...x }));

  const addImage = async (f?: File) => {
    if (!f) return;
    if (f.size > 500000 || !/^image\/(png|jpeg|webp)$/.test(f.type)) return toast("Use a PNG/JPG/WebP image under 500 KB.", "error");
    const r = new FileReader(); r.onload = () => set({ image: String(r.result) }); r.readAsDataURL(f);
  };
  const validate = () => {
    if (!p.text.trim() && !p.image) return toast("Add a caption or an image.", "warning"), false;
    if (!p.channels.length) return toast("Choose at least one channel.", "warning"), false;
    if (p.channels.includes("Instagram") && !p.image) return toast("Instagram posts need an image.", "warning"), false;
    if (p.text.length > limit) return toast(`Caption is over the ${limit.toLocaleString()} character limit.`, "warning"), false;
    return true;
  };
  const schedule = () => { if (!validate()) return; if (`${p.date}T${p.time}` <= new Date().toISOString().slice(0, 16)) return toast("Choose a future date and time to schedule.", "warning"); onSave(p, "Scheduled"); };

  return (
    <Drawer open onClose={onClose} width="max-w-4xl" title={locked ? "Published post" : post.text ? "Edit post" : "Compose a post"}
      footer={locked ? <Button onClick={onClose}>Close</Button> : <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => { if (p.text.trim() || p.image) onSave(p, "Draft"); else toast("Nothing to save yet.", "warning"); }}>Save draft</Button><Button icon={<CalendarDays className="size-4" />} onClick={schedule}>Schedule</Button><Button variant="primary" icon={<Send className="size-4" />} onClick={() => validate() && onSave({ ...p, date: today() }, "Published")}>Publish now</Button></>}>
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-bg-deep/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-brand" /> Caption helper</div>
            <div className="grid gap-3 sm:grid-cols-2"><Field label="Product"><Select value={prodId} onChange={(e) => setProdId(e.target.value)}>{products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field><Field label="Tone"><Select value={tone} onChange={(e) => setTone(e.target.value)}>{TONES.map((t) => <option key={t}>{t}</option>)}</Select></Field></div>
            <div className="mt-3 flex items-center justify-between"><Checkbox checked={tags} onChange={setTags} label="Add hashtags" /><Button size="sm" disabled={locked} onClick={() => { set({ text: caption(products.find((x) => x.id === prodId), tone, tags) }); toast("Caption drafted locally. Edit freely.", "info"); }}>Generate caption</Button></div>
          </div>
          <Field label="Caption" hint={`${p.text.length.toLocaleString()} / ${limit.toLocaleString()} characters`}><Textarea rows={6} disabled={locked} value={p.text} onChange={(e) => set({ text: e.target.value })} placeholder="What do you want to say?" /></Field>
          <div>
            <span className="mb-2 block text-[13px] font-medium text-ink-2">Image</span>
            {p.image ? <div className="relative inline-block">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={p.image} alt="Post" className="h-32 rounded-lg object-cover" />{!locked && <button aria-label="Remove image" onClick={() => set({ image: "" })} className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-danger text-white"><X className="size-3" /></button>}</div> : (
              <div className="flex flex-wrap items-center gap-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line-strong px-4 py-3 text-sm text-ink-2 hover:border-brand"><ImagePlus className="size-4" /> Upload image<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => addImage(e.target.files?.[0])} /></label><Select aria-label="Use a product image" className="w-52" value="" onChange={(e) => { const pr = products.find((x) => x.id === e.target.value); if (pr) set({ image: pr.images[0] }); }}><option value="">…or use a product photo</option>{products.slice(0, 12).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></div>
            )}
          </div>
          <div><span className="mb-2 block text-[13px] font-medium text-ink-2">Channels</span><div className="flex gap-6">{["Facebook", "Instagram"].map((c) => <Checkbox key={c} checked={p.channels.includes(c)} onChange={(v) => set({ channels: v ? [...p.channels, c] : p.channels.filter((x) => x !== c) })} label={c} />)}</div></div>
          <div className="grid grid-cols-2 gap-4"><Field label="Date"><Input type="date" disabled={locked} value={p.date} onChange={(e) => set({ date: e.target.value })} /></Field><Field label="Time"><Input type="time" disabled={locked} value={p.time} onChange={(e) => set({ time: e.target.value })} /></Field></div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold">Preview</span><Tabs value={preview} onChange={setPreview} options={[{ value: "Facebook", label: "Facebook" }, { value: "Instagram", label: "Instagram" }]} /></div>
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex items-center gap-2.5 p-3.5"><span className="grid size-9 place-items-center rounded-full bg-brand text-xs font-bold text-white">Dt</span><div className="leading-tight"><div className="text-sm font-semibold">Dhaka Threads</div><div className="text-[11px] text-ink-3">{p.status === "Published" ? "Just now" : `${p.date} · ${p.time}`}</div></div></div>
            {preview === "Facebook" && <p className="whitespace-pre-wrap px-4 pb-3 text-sm">{p.text || <span className="text-ink-4">Your caption appears here.</span>}</p>}
            {p.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.image} alt="" className="aspect-square w-full object-cover" /> : <div className="grid aspect-square place-items-center bg-raised text-sm text-ink-4">No image</div>}
            {preview === "Instagram" && <p className="whitespace-pre-wrap p-4 text-sm"><strong>dhakathreads.bd</strong> {p.text || <span className="text-ink-4">Your caption appears here.</span>}</p>}
            <div className="flex gap-2 border-t border-line p-3 text-xs text-ink-3"><Badge>Like</Badge><Badge>Comment</Badge><Badge>Share</Badge></div>
          </div>
          <p className="mt-3 text-xs text-ink-4">Local preview only. Nothing is published to a real platform.</p>
        </div>
      </div>
    </Drawer>
  );
}
