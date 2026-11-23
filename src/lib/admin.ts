import { store, uid } from "./store";
import type { Client, Plan } from "./data";

/* Admin-side derived data + helpers (replaces assets/js/admin.js helper layer). */

export type AdminChannel = { id: string; clientId: string; client: string; type: "Facebook" | "Instagram" | "WhatsApp"; name: string; health: "Active" | "Needs reconnect" | "Webhook failing"; tokenHealth: string; bot: boolean; webhook: boolean; lastEvent: string; oauthError?: number };
export type AdminInvoice = { id: string; clientId: string; client: string; date: string; amount: number; plan: string; status: "Paid" | "Due" | "Failed" | "Refunded" | "Partially refunded"; refundedAmount?: number; attempts: number; method: string };
export type AdminTemplate = { id: string; clientId: string; client: string; name: string; category: string; status: "Approved" | "Pending" | "Rejected"; text: string; reason: string };
export type Coupon = { id: string; code: string; percent: number; validUntil: string; redemptions: number; enabled: boolean };

const types = ["Facebook", "Instagram", "WhatsApp"] as const;

/** Create the admin collections the first time an admin visits. */
export function ensureAdminData() {
  const clients = store.get<Client[]>("admin.clients", []);
  if (!store.get("admin.channels")) {
    const ch: AdminChannel[] = [];
    clients.forEach((c, i) => {
      for (let k = 0; k < c.channelsConnected; k++) {
        const type = types[(i + k) % 3];
        const bad = c.health === "Needs reconnect" && k === 0;
        const hook = c.health === "At risk" && k === 0;
        ch.push({ id: `ach-${c.id}-${k}`, clientId: c.id, client: c.name, type, name: type === "WhatsApp" ? `+880 17${String(10000000 + i * 137 + k)}` : type === "Instagram" ? `@${c.name.toLowerCase().replace(/[^a-z]/g, "")}` : c.name, health: bad ? "Needs reconnect" : hook ? "Webhook failing" : "Active", tokenHealth: bad ? "Expired" : "Healthy", bot: !bad, webhook: !bad && !hook, lastEvent: bad ? "2 days ago" : `${1 + ((i + k) % 9)} minutes ago`, oauthError: bad ? 190 : undefined });
      }
    });
    store.set("admin.channels", ch);
  }
  if (!store.get("admin.invoices")) {
    const inv: AdminInvoice[] = [];
    const plans = store.get<Plan[]>("plans", []);
    clients.forEach((c, i) => {
      const p = plans.find((x) => x.name === c.plan);
      if (!p || !p.monthly) return;
      [0, 1, 2].forEach((m) => inv.push({ id: `AINV-${String(900 + i * 3 + m)}`, clientId: c.id, client: c.name, date: `2026-${String(10 - m).padStart(2, "0")}-01`, amount: p.monthly, plan: p.name, status: m === 0 && i % 5 === 2 ? "Failed" : m === 0 && i % 7 === 3 ? "Due" : "Paid", attempts: m === 0 && i % 5 === 2 ? 2 : 1, method: i % 2 ? "Visa ending 4242" : "bKash" }));
    });
    store.set("admin.invoices", inv);
  }
  if (!store.get("admin.coupons")) {
    store.set("admin.coupons", [
      { id: "cp1", code: "EID25", percent: 25, validUntil: "2026-12-31", redemptions: 14, enabled: true },
      { id: "cp2", code: "LAUNCH10", percent: 10, validUntil: "2026-11-30", redemptions: 41, enabled: true },
      { id: "cp3", code: "WINBACK", percent: 40, validUntil: "2026-10-01", redemptions: 6, enabled: false },
    ] as Coupon[]);
  }
  if (!store.get("admin.templates")) {
    const t: AdminTemplate[] = [];
    const names = [["order_confirmation", "Utility", "Approved", "Hi {{1}}, your order {{2}} is confirmed."], ["shipping_update", "Utility", "Approved", "Order {{1}} has shipped. Track: {{2}}."], ["eid_collection", "Marketing", "Pending", "Discover our Eid collection, {{1}}. Reply STOP to opt out."], ["flash_sale", "Marketing", "Rejected", "Exclusive offers for you! Shop now."], ["restock_alert", "Marketing", "Approved", "{{1}} is back in stock. Reply STOP to opt out."]] as const;
    clients.slice(0, 9).forEach((c, i) => { const n = names[i % 5]; t.push({ id: `atp-${i}`, clientId: c.id, client: c.name, name: n[0], category: n[1], status: n[2], text: n[3], reason: n[2] === "Rejected" ? "Missing opt-out instructions and unclear promotional context." : "" }); if (i % 3 === 0) { const m = names[(i + 2) % 5]; t.push({ id: `atp-${i}b`, clientId: c.id, client: c.name, name: m[0] + "_v2", category: m[1], status: m[2], text: m[3], reason: m[2] === "Rejected" ? "Template content was too vague for review." : "" }); } });
    store.set("admin.templates", t);
  }
}

export const planOf = (c: Client) => store.get<Plan[]>("plans", []).find((p) => p.name === c.plan);
export const mrrOf = (c: Client) => (["Suspended", "Churned", "Deleted", "Trial"].includes(c.status) ? 0 : planOf(c)?.monthly ?? c.mrr ?? 0);
export const usageOf = (c: Client) => {
  const p = planOf(c);
  const limit = p?.conversations ?? 1000;
  const used = Math.round((limit * c.usage) / 100);
  return { used, limit, percent: Math.round((used / Math.max(1, limit)) * 100), channels: c.channelsConnected, seats: 1 + (c.usage % 4) };
};

export function audit(action: string, clientId: string, details: string, who = store.get<any>("session")?.name || "Platform Admin") {
  const client = store.get<Client[]>("admin.clients", []).find((c) => c.id === clientId)?.name ?? "Platform";
  store.update<any[]>("admin.auditLog", (l) => { l.unshift({ id: "sp-" + uid(), who, action, client, clientId, date: new Date().toISOString(), details }); });
}

export const fmtDate = (s: string) => { const d = new Date(s.length === 10 ? s + "T12:00:00+06:00" : s); return isNaN(+d) ? s : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };
