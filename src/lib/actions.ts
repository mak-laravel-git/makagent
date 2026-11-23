import { store, uid, money } from "./store";
import type { Conversation, Message, Order } from "./data";

/* Shared conversation / order helpers (ported from assets/js/app.js) */

export function updateConversation(id: string, fn: (c: Conversation & Record<string, any>) => void) {
  let current: (Conversation & Record<string, any>) | undefined;
  store.update<Conversation[]>("conversations", (cs) => {
    const c = cs.find((x) => x.id === id);
    if (c) {
      fn(c);
      current = c;
    }
  });
  if (current) {
    const c = current;
    store.update<Message[]>("messages", (ms) => [...ms.filter((m) => m.conversationId !== id), ...c.messages.map((m) => ({ ...m, conversationId: id }))]);
  }
  return current;
}

export function addMessage(id: string, role: Message["role"], text: string, extra: Record<string, any> = {}) {
  const result = updateConversation(id, (c) => {
    c.messages.push({
      id: uid(), conversationId: id, role, text,
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(), ...extra,
    } as Message);
    c.time = "Just now";
    if (role === "customer") {
      c.unread = (c.unread || 0) + 1;
      c.lastCustomerAt = new Date().toISOString();
      c.replyWindowEnds = Date.now() + 86400000;
      c.windowHours = 24;
    }
  });
  store.update<Conversation[]>("conversations", (cs) => {
    const i = cs.findIndex((c) => c.id === id);
    if (i > 0) cs.unshift(cs.splice(i, 1)[0]);
  });
  return result;
}

export function saveOrder(draft: Record<string, any>, channel: string, conversationId: string): Order {
  const key = JSON.stringify(draft);
  const existing = store.get<any[]>("orders", []).find((o) => o.draftSignature === key && o.conversationId === conversationId);
  if (existing) return existing;
  const order: Record<string, any> = {
    ...draft,
    id: "SP-" + Date.now().toString().slice(-7),
    clientId: store.get("client.id"),
    customer: draft.name,
    status: "New",
    channel,
    conversationId,
    aiCollected: true,
    createdAt: new Date().toISOString(),
    draftSignature: key,
    items: [{ productId: draft.productId, name: draft.product, price: draft.unitPrice, quantity: draft.quantity, size: draft.size, colour: draft.colour }],
  };
  store.add("orders", order);
  store.add("notifications", { title: "Order received · " + order.id, body: order.customer + " · " + money(order.total), type: "order", read: false, createdAt: new Date().toISOString() });
  return order as unknown as Order;
}

export function addNotification(title: string, body: string, type = "channel") {
  store.add("notifications", { title, body, type, read: false, createdAt: new Date().toISOString() });
}

export function syncKnowledge() {
  const policies = store.get<any[]>("knowledge", []).filter((k) => k.type === "Policy");
  store.set("knowledge", [...store.get<any[]>("faqs", []), ...store.get<any[]>("documents", []), ...policies]);
}

/** WhatsApp 24h free reply window helpers */
export function windowExpired(c: Conversation & Record<string, any>) {
  return c.channel === "WhatsApp" && (store.get("demo.windowExpired") || (c.replyWindowEnds ?? 1) <= Date.now());
}
export function windowRemaining(c: Conversation & Record<string, any>) {
  const ms = Math.max(0, (c.replyWindowEnds ?? 0) - Date.now());
  return ms ? `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m ${Math.floor((ms % 60000) / 1000)}s left` : "Expired";
}
