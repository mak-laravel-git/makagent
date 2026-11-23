"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Field, Modal, Select } from "@/components/ui";
import { store, uid } from "@/lib/store";
import { useUI } from "@/components/providers";
import { SEED, type Product } from "@/lib/data";

/* ───────── CSV import ───────── */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

export function ImportModal({ open, file, onClose }: { open: boolean; file: File | null; onClose: () => void }) {
  const { toast } = useUI();
  const [rows, setRows] = useState<string[][]>([]);
  const [map, setMap] = useState<Record<string, number>>({});
  const fields = ["name", "price", "stock", "category", "sku", "description", "status"];
  useEffect(() => {
    if (!open || !file) return;
    file.text().then((t) => {
      const r = parseCsv(t); setRows(r);
      const head = (r[0] || []).map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
      setMap(Object.fromEntries(fields.map((f) => [f, head.findIndex((h) => h === f || h.includes(f))])));
    });
  }, [open, file]); // eslint-disable-line react-hooks/exhaustive-deps
  const body = rows.slice(1);
  const validate = (r: string[]) => { const e: string[] = []; const g = (f: string) => (map[f] >= 0 ? (r[map[f]] || "").trim() : ""); if (!g("name")) e.push("name missing"); if (!(parseFloat(g("price")) > 0)) e.push("invalid price"); if (g("stock") && !/^\d+$/.test(g("stock"))) e.push("stock must be a whole number"); return e; };
  const checked = body.map((r) => ({ r, errs: validate(r) }));
  const good = checked.filter((c) => !c.errs.length);
  const run = () => {
    const g = (r: string[], f: string) => (map[f] >= 0 ? (r[map[f]] || "").trim() : "");
    const items: Product[] = good.map(({ r }, i) => ({ id: uid(), clientId: "cl-dhaka", name: g(r, "name"), sku: g(r, "sku") || "IMP-" + Date.now().toString().slice(-5) + i, category: g(r, "category") || "Uncategorized", description: g(r, "description"), price: parseFloat(g(r, "price")), discountPrice: 0, stock: parseInt(g(r, "stock") || "0"), threshold: 5, lowStockThreshold: 5, variants: [{ size: "One size", colour: "Standard", stock: parseInt(g(r, "stock") || "0") }], images: [SEED.products[1].images[0]], tags: ["imported"], delivery: 80, deliveryOverride: null, status: /draft/i.test(g(r, "status")) ? "Draft" : "Active", sync: "Pending", instructions: "", aiInstructions: "", askedCount: 0, priceQuestions: 0 }));
    store.update<Product[]>("products", (ps) => [...ps, ...items]);
    store.update<{ id: string; name: string }[]>("categories", (cs) => { items.forEach((p) => { if (!cs.some((c) => c.name === p.category)) cs.push({ id: uid(), name: p.category }); }); });
    toast(`${items.length} products imported.`, "success");
    setTimeout(() => store.update<Product[]>("products", (ps) => ps.forEach((p) => { if (p.sync === "Pending") p.sync = "Synced to AI"; })), 800);
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Import products" size="lg" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!good.length} onClick={run}>Import {good.length} valid rows</Button></>}>
      <p className="mb-4 text-sm text-ink-2">CSV files are parsed locally. Excel (.xlsx) is not parsed in this preview — export your sheet as CSV first.</p>
      <div className="mb-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">{fields.map((f) => <Field key={f} label={`${f}${f === "name" || f === "price" ? " *" : ""}`}><Select value={map[f] ?? -1} onChange={(e) => setMap((m) => ({ ...m, [f]: +e.target.value }))}><option value={-1}>— not mapped —</option>{(rows[0] || []).map((h, i) => <option key={i} value={i}>{h}</option>)}</Select></Field>)}</div>
      <div className="mb-3 flex gap-2"><Badge tone="success">{good.length} valid</Badge><Badge tone={checked.length - good.length ? "danger" : "neutral"}>{checked.length - good.length} with errors</Badge></div>
      <div className="max-h-64 overflow-auto rounded-lg border border-line"><table className="w-full text-sm"><tbody>{checked.slice(0, 30).map(({ r, errs }, i) => <tr key={i} className="border-b border-line last:border-0"><td className="px-3 py-2 text-ink-3">{i + 2}</td><td className="px-3 py-2">{r[map.name] ?? ""}</td><td className="px-3 py-2">{r[map.price] ?? ""}</td><td className="px-3 py-2">{errs.length ? <span className="text-danger">{errs.join(", ")}</span> : <span className="text-success">OK</span>}</td></tr>)}</tbody></table></div>
    </Modal>
  );
}
