import { SEED, type Product } from "./data";
import { store, money } from "./store";

/* Deterministic rule-based simulation (ported from assets/js/mockAgent.js + platform-policy.js).
   `conversationState` is mutated to retain a collection flow; persist it when saving a conversation. */

type Lang = "bn" | "bl" | "en";
export type AgentState = Record<string, any>;
export type AgentCard = Record<string, any>;
export type AgentReply = {
  text: string;
  cards: AgentCard[];
  handover: boolean;
  orderDraft: Record<string, any> | null;
  sources?: string[];
  guard?: string;
  paused?: boolean;
};

const bnDigits = "০১২৩৪৫৬৭৮৯";
const normalise = (v: unknown) =>
  String(v || "").toLowerCase().replace(/[০-৯]/g, (d) => String(bnDigits.indexOf(d))).trim();
const detect = (q: string): Lang =>
  /[অ-৿]/.test(q)
    ? "bn"
    : /\b(bhai|koto|chai|ache|lagbe|den|korbo|amar|naam|nam|hobe|din|ji|ta|nen|diben|er|ranna)\b/.test(q)
      ? "bl"
      : "en";

const words: Record<Lang, Record<string, string>> = {
  bn: { name: "আপনার নামটি বলবেন?", phone: "আপনার মোবাইল নম্বরটি দিন (১১ ডিজিট)।", address: "ডেলিভারির সম্পূর্ণ ঠিকানা দিন।", product: "কোন পণ্যটি অর্ডার করতে চান?", quantity: "কতটি নিতে চান?", size: "কোন সাইজটি চান? পাওয়া যাচ্ছে: ", colour: "কোন রংটি চান? পাওয়া যাচ্ছে: ", unknown: "দুঃখিত, নিশ্চিতভাবে বলতে পারছি না। পণ্যের নাম বা প্রশ্নটি একটু বিস্তারিত বলবেন?", handover: "অবশ্যই! একজন টিম মেম্বারকে যুক্ত করছি। AI এখন paused।", greeting: "হ্যালো! আমি Nila, Dhaka Threads-এর AI shopping assistant। কোন পণ্যটি দেখতে চান?" },
  bl: { name: "Apnar naam ta bolben?", phone: "Apnar mobile number din (11 digit).", address: "Full delivery address ta din.", product: "Kon product ta order korte chan?", quantity: "Koyta niben?", size: "Kon size? Available: ", colour: "Kon colour? Available: ", unknown: "Sorry, sure hoye bolte parchi na. Product er naam ba question ta ektu details bolben?", handover: "Obosshoi! Team er ekjon ke connect korchi. AI ekhon paused.", greeting: "Hello! Ami Nila, Dhaka Threads er AI shopping assistant. Kon product dekhte chan?" },
  en: { name: "What is your full name?", phone: "What is your 11-digit mobile number?", address: "What is your full delivery address?", product: "Which product would you like to order?", quantity: "How many would you like?", size: "Which size? Available: ", colour: "Which colour? Available: ", unknown: "I’m not sure about that. Could you share the product name or a little more detail?", handover: "Of course! I’m connecting you with our team. AI replies are now paused.", greeting: "Hello! I’m Nila, the Dhaka Threads AI shopping assistant. What would you like to explore?" },
};

function catalog(): Product[] {
  return store.get<Product[]>("products", SEED.products).filter((p) => p.status.toLowerCase() === "active");
}

function find(input: string): Product | null {
  let q = input;
  const aliases: [string, string][] = [["লাল", "red"], ["শার্ট", "shirt"], ["পাঞ্জাবি", "panjabi"], ["টিশার্ট", "tee"], ["ব্যাগ", "tote"], ["লিনেন", "linen"], ["প্যান্ট", "pants"]];
  for (const [a, b] of aliases) q = q.replaceAll(a, b);
  const stop = ["price", "stock", "available", "order", "please", "want", "have", "does", "this", "that", "shirt", "koto", "bhai", "chai"];
  const tokens = q.split(/[^a-z0-9]+/).filter((x) => x.length > 2 && !stop.includes(x));
  const ranked = catalog()
    .map((p) => {
      const name = p.name.toLowerCase();
      let score = tokens.reduce((n, t) => n + (name.includes(t) ? 3 : p.category.toLowerCase().includes(t) ? 1 : 0), 0);
      if (q.includes(name)) score += 100;
      if (/shirt/.test(q) && p.category === "Shirts") score += 1;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score > 0 ? ranked[0].p : null;
}

function platformGuard(message: string, channel: string, config: any): AgentReply | null {
  const q = String(message || "").toLowerCase();
  const topic = (config.blockedTopics || []).find((t: string) => t.trim() && q.includes(t.toLowerCase()));
  let text: string | undefined;
  let guard = "";
  if (topic) {
    text = "This topic is outside this business’s shopping support. I can connect you with the team.";
    guard = "Blocked topic: " + topic;
  } else if (config.policyGuard && channel === "WhatsApp" && /\b(general[- ]purpose|unrelated|homework|essay)\b/i.test(q)) {
    text = "I can help with this business’s products, orders and service policies only. A teammate can help with anything else.";
    guard = "Business-specific WhatsApp guard";
  } else if (config.safety?.noSecrets !== false && /\b(my|your|send|share|give)\b.*\b(pin|otp|password)\b/i.test(q)) {
    text = "Never share a payment PIN, OTP or password. I can hand this to a teammate.";
    guard = "Secret-safety rule";
  }
  return text ? { text, cards: [], handover: true, orderDraft: null, guard } : null;
}

export function reply(arg: { message: string; channel?: string; conversationState?: AgentState; platformConfig?: unknown } | string, legacyState?: AgentState): AgentReply {
  const isObj = typeof arg === "object";
  const message = isObj ? arg.message : arg;
  const state: AgentState = (isObj ? arg.conversationState : legacyState) || {};
  const q = normalise(message);
  const agent = store.get<any>("agent", SEED.agent);
  const policies = store.get<any>("onboarding.policies", {});
  const channel = isObj ? arg.channel || "Facebook" : "Facebook";
  const override = agent.channelOverrides?.[channel];

  let language: Lang = override?.enabled && override.language === "Bangla" ? "bn" : override?.enabled && override.language === "Banglish" ? "bl" : override?.enabled && override.language === "English" ? "en" : detect(q);
  const supported: Record<Lang, string> = { bn: "Bangla", bl: "Banglish", en: "English" };
  if (!override?.enabled && agent.languages?.length && !agent.languages.includes(supported[language])) {
    language = ((Object.keys(supported) as Lang[]).find((k) => supported[k] === agent.languages[0]) || "en") as Lang;
  }
  if (override?.enabled || !state.language || language !== "en" || !agent.languages?.includes(supported[state.language as Lang])) state.language = language;
  const l: Lang = state.language || language;
  const t = words[l];
  const say = (en: string, bl: string, bn: string) => (l === "bn" ? bn : l === "bl" ? bl : en);
  const tone = override?.enabled ? override.tone : agent.tone;
  const response = (text: string, extra: Partial<AgentReply> = {}): AgentReply => ({
    text:
      tone === "Casual" && l === "en" && !extra.handover
        ? text + " Happy to help!"
        : tone === "Professional"
          ? text.replace("Would you like to order?", "Would you like to place an order?").replace("Of course!", "Certainly.")
          : text,
    cards: [], handover: false, orderDraft: null, ...extra,
  });

  const guard = platformGuard(String(message || ""), channel, isObj && arg.platformConfig !== undefined ? arg.platformConfig : store.get("admin.aiConfig", {}));
  if (guard) {
    state.handover = true;
    state.collecting = false;
    return guard;
  }

  const blocked = (agent.blockedWords || []).find((w: string) => {
    const term = normalise(w);
    return term && (/^[a-z0-9 ]+$/.test(term) ? new RegExp("(?:^|[^a-z0-9])" + term + "(?=$|[^a-z0-9])").test(q) : q.includes(term));
  });
  if (blocked) {
    state.handover = true;
    return response(say("I can’t assist with that topic. I’m connecting you with our team.", "Ei topic e help korte parchi na. Team ke connect korchi.", "এই বিষয়ে সাহায্য করতে পারছি না। আমাদের টিমকে যুক্ত করছি।"), { handover: true });
  }

  if (agent.workingDays?.length && !state.previewProductId) {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const part = (type: string) => parts.find((p) => p.type === type)?.value;
    const clock = part("hour") + ":" + part("minute");
    const opens = agent.opens || "10:00", closes = agent.closes || "22:00";
    const inTime = opens <= closes ? clock >= opens && clock < closes : clock >= opens || clock < closes;
    const outside = !agent.workingDays.includes(part("weekday")) || !inTime;
    if (outside && agent.afterHours !== "Collect details and notify the team") {
      const pause = agent.afterHours === "Pause automated replies";
      return response(pause ? "AI paused outside business hours. Your team can follow up." : `Our business hours are ${opens}–${closes} (Asia/Dhaka). We’ll help when the team is back.`, { handover: pause, paused: pause });
    }
  }

  if ((agent.handover.keyword !== false && /agent chai|human|real person|manager|মানুষ|এজেন্ট/.test(q)) || (agent.handover.angry !== false && /angry|furious|রাগ/.test(q))) {
    state.collecting = false;
    state.handover = true;
    return response(t.handover, { handover: true });
  }
  if (state.handover) return response(t.handover, { handover: true });

  const fields: string[] = agent.orderFields || ["name", "phone", "address", "product", "quantity", "size", "colour"];
  const getSelected = () => catalog().find((p) => p.id === (state.order?.productId || state.productId));

  function next(): AgentReply {
    const p = getSelected();
    if (p) {
      state.order.productId = p.id;
      state.order.product = p.name;
      if (p.category === "Accessories") {
        state.order.size = "One size";
        state.order.colour = p.variants[0]?.colour || "Standard";
      }
    }
    if (!fields.includes("size")) state.order.size = p?.variants[0]?.size || "Standard";
    if (!fields.includes("colour")) state.order.colour = p?.variants[0]?.colour || "Standard";
    const field = fields.find((f) => !state.order[f]);
    state.field = field;
    if (field) {
      let prompt = t[field];
      if (field === "size") prompt += [...new Set(p?.variants.map((v) => v.size))].join(", ");
      if (field === "colour") prompt += [...new Set(p?.variants.map((v) => v.colour))].join(", ");
      return response(prompt, { orderDraft: { ...state.order } });
    }
    if (!p || p.stock < state.order.quantity) {
      state.order.quantity = null;
      state.field = "quantity";
      return response(say("That quantity isn’t available. Please choose a smaller amount.", "Eto stock nei. Kom quantity din.", "এত স্টক নেই। কম পরিমাণ দিন।"), { orderDraft: { ...state.order } });
    }
    const client = store.get<any>("client", SEED.client);
    const outside = !/dhaka|ঢাকা/i.test(state.order.address) || /gazipur|গাজীপুর/i.test(state.order.address);
    const delivery = p.deliveryOverride != null ? p.deliveryOverride : outside ? client.deliveryCharges.outside : client.deliveryCharges.dhaka;
    const today = new Date().toISOString().slice(0, 10);
    const offer = store.get<any[]>("offers", []).find((o) => o.id === state.offerId && o.enabled && o.category === p.category && o.validUntil >= today);
    const unitPrice = offer ? Math.min(p.discountPrice || p.price, Math.round(p.price * (1 - offer.percent / 100))) : p.discountPrice || p.price;
    const draft = {
      ...state.order, unitPrice, delivery, total: unitPrice * state.order.quantity + delivery,
      payment: policies.payments?.includes("Cash on Delivery") ? "Cash on Delivery" : policies.payments?.[0] || "Cash on Delivery", complete: true,
    };
    state.collecting = false;
    state.field = null;
    state.order = draft;
    return response(
      say(
        `Thanks, ${draft.name}! Your order details are collected: ${draft.quantity} × ${p.name}, ${draft.size}, ${draft.colour}. Total ${money(draft.total)} including delivery. Our team will confirm shortly.`,
        `Dhonnobad ${draft.name}! ${draft.quantity} ta ${p.name} order details collect hoyeche. Delivery shoho total ${money(draft.total)}. Team confirm korbe.`,
        `ধন্যবাদ ${draft.name}! ${p.name} ${draft.quantity}টি অর্ডারের তথ্য নেওয়া হয়েছে। ডেলিভারিসহ মোট ${money(draft.total)}। টিম শীঘ্রই কনফার্ম করবে।`,
      ),
      { orderDraft: draft, cards: [{ type: "order", ...draft }], handover: !!agent.handover.amount && draft.total > agent.handover.amount },
    );
  }

  if (state.collecting) {
    const f = state.field as string;
    if (f === "phone") {
      const number = q.replace(/[\s()+-]/g, "").replace(/^880/, "0");
      if (!/^01[3-9]\d{8}$/.test(number)) return response(say("Please enter a valid Bangladesh mobile number, e.g. 01712345678.", "Valid BD number din, jemon 01712345678.", "সঠিক বাংলাদেশি মোবাইল নম্বর দিন, যেমন 01712345678।"));
      state.order.phone = number;
    } else if (f === "product") {
      const p = find(q);
      if (!p) return response(t.product);
      if (!p.stock) return response(say("That product is out of stock. Please choose another.", "Eta stock e nei. Onno product choose korun.", "এটি স্টকে নেই। অন্য পণ্যটি বেছে নিন।"));
      state.order.productId = p.id;
      state.order.product = p.name;
    } else if (f === "quantity") {
      if (!/^\d+$/.test(q) || +q < 1) return response(t.quantity);
      const sel = getSelected()!;
      if (+q > sel.stock) return response(say(`Only ${sel.stock} available. Enter a smaller quantity.`, `Stock e ${sel.stock} ta ache. Kom quantity din.`, `স্টকে ${sel.stock}টি আছে। কম পরিমাণ দিন।`));
      state.order.quantity = +q;
    } else if (f === "size" || f === "colour") {
      const sel = getSelected()!;
      const allowed = [...new Set(sel.variants.map((v) => v[f as "size" | "colour"]))];
      const match = allowed.find((v) => v.toLowerCase() === q);
      if (!match) return response(t[f] + allowed.join(", "));
      if (f === "colour") {
        const variant = sel.variants.find((v) => v.size === state.order.size && v.colour === match);
        if (!variant || variant.stock < state.order.quantity) {
          state.order.size = null;
          state.field = "size";
          return response(say("That size/colour combination has insufficient stock. Please select another size.", "Ei size/colour e stock kom. Onno size din.", "এই সাইজ/রঙে পর্যাপ্ত স্টক নেই। অন্য সাইজ দিন।"));
        }
      }
      state.order[f] = match;
    } else {
      if (q.length < (f === "address" ? 8 : 2)) return response(t[f]);
      state.order[f] = String(message).trim();
    }
    return next();
  }

  const product: Product | null | undefined = state.previewProductId
    ? store.get<Product[]>("products", []).find((p) => p.id === state.previewProductId)
    : find(q) || catalog().find((p) => p.id === state.productId);
  if (product) state.productId = product.id;

  const faqTokens = q.split(/[^a-z0-9অ-৿]+/).filter((w) => w.length > 2 && !["the", "can", "you", "are", "your", "how", "what", "does", "have", "with"].includes(w));
  const faqMatch = store
    .get<any[]>("faqs", [])
    .filter((f) => f.status === "Indexed")
    .map((f) => ({ f, score: faqTokens.filter((w) => normalise(f.question || f.title).includes(w)).length, exact: normalise(f.question || f.title) === q }))
    .sort((a, b) => b.score - a.score)[0];
  if (faqMatch && (faqMatch.exact || faqMatch.score >= 2)) return response(faqMatch.f.answer || faqMatch.f.text, { sources: [faqMatch.f.title] });

  const documents = [...store.get<any[]>("documents", []), ...store.get<any[]>("knowledge", []).filter((k) => k.type === "Policy")].filter((d) => d.status === "Indexed" && !d.text?.startsWith("PDF indexing is simulated"));
  const docMatch = documents
    .map((d) => ({ d, score: faqTokens.filter((w) => normalise(d.title + " " + d.text).includes(w)).length }))
    .sort((a, b) => b.score - a.score)[0];
  if (docMatch?.score >= 2) return response(docMatch.d.text.slice(0, 600), { sources: [docMatch.d.title] });

  if (store.get("onboarding.knowledgeInitialized")) {
    const policyId = /delivery|shipping|koto din|ডেলিভারি|ডেলিভারী|কত দিন/.test(q) ? "policy-delivery" : /return|exchange|রিটার্ন|বদল/.test(q) ? "policy-return" : /bkash|nagad|payment|বিকাশ|নগদ|পেমেন্ট/.test(q) ? "policy-payment" : null;
    if (policyId) {
      const p = store.get<any[]>("knowledge", []).find((k) => k.id === policyId && k.type === "Policy" && k.status === "Indexed");
      return p ? response(p.text, { sources: [p.title] }) : response(t.unknown);
    }
  }

  if (/delivery|shipping|koto din|ডেলিভারি|ডেলিভারী|কত দিন/.test(q)) {
    state.unknownCount = 0;
    if (policies.delivery) return response(policies.delivery, { sources: ["Delivery policy"] });
    return response(say("Inside Dhaka: 1–2 days, ৳80. Outside Dhaka (including Gazipur): 2–4 days, ৳130. Cash on Delivery is available.", "Dhaka e 1–2 din, charge ৳80. Dhaka er baire/Gazipur e 2–4 din, charge ৳130. COD ache.", "ঢাকায় ১–২ দিন, চার্জ ৳৮০। ঢাকার বাইরে/গাজীপুরে ২–৪ দিন, চার্জ ৳১৩০। Cash on Delivery আছে।"), { sources: ["Delivery & service areas"] });
  }
  if (/return|exchange|রিটার্ন|বদল/.test(q) && policies.returns) return response(policies.returns, { sources: ["Returns & exchanges"] });
  if (/return|exchange|রিটার্ন|বদল/.test(q)) return response(say("You can exchange unused items with original tags within 7 days. Return courier fees apply.", "Unused product tags shoho 7 diner moddhe exchange kora jabe. Return courier charge lagbe.", "ট্যাগসহ অব্যবহৃত পণ্য ৭ দিনের মধ্যে বদলানো যাবে। রিটার্ন কুরিয়ার চার্জ প্রযোজ্য।"), { sources: ["Returns & exchange policy"] });
  if (/bkash|nagad|payment|বিকাশ|নগদ|পেমেন্ট/.test(q) && policies.payments?.length) return response(say("We accept: ", "Accept kori: ", "আমরা গ্রহণ করি: ") + policies.payments.join(", "), { sources: ["Payment methods"] });
  if (/bkash|nagad|payment|বিকাশ|নগদ|পেমেন্ট/.test(q)) return response(say("We accept bKash, Nagad, cards and Cash on Delivery. Never share your PIN or OTP.", "bKash, Nagad, card, COD shob ache. PIN ba OTP kokhono share korben na.", "bKash, Nagad, কার্ড ও Cash on Delivery আছে। PIN বা OTP কখনও শেয়ার করবেন না।"), { sources: ["Payments & order confirmation"] });

  if (/offer|discount|অফার|ছাড়/.test(q)) {
    const today = new Date().toISOString().slice(0, 10);
    const offers = store.get<any[]>("offers", []).filter((o) => o.enabled && o.validUntil >= today && (!product || o.category === product.category));
    if (offers.length) {
      const best = offers.sort((a, b) => b.percent - a.percent)[0];
      const cap = (product?.instructions || product?.aiInstructions || "").match(/never[^.]*?(\d+)%/i);
      if (cap && best.percent > +cap[1]) return response("This offer exceeds the product’s discount limit. Our team needs to review it.", { handover: true, sources: ["Product AI instructions"] });
      state.offerId = best.id;
      return response(`${best.name}: ${best.percent}% off ${best.category}, valid until ${best.validUntil}.` + (product ? ` Offer price ${money(Math.min(product.discountPrice || product.price, Math.round(product.price * (1 - best.percent / 100))))}.` : ""), { sources: [best.name] });
    }
  }
  if (/offer|discount|অফার|ছাড়/.test(q) && policies.offers) return response(policies.offers, { sources: ["Offers & promotions"] });

  if (/\border\b|kinbo|nibo|করবো|কিনতে|অর্ডার|নিব|নেব/.test(q)) {
    if (product && !product.stock) return response(say("That item is out of stock. Would you like a restock notification?", "Eta stock e nei. Restock hole janabo?", "এটি স্টকে নেই। আবার এলে জানাব?"));
    state.order = product ? { productId: product.id, product: product.name } : {};
    state.collecting = true;
    state.unknownCount = 0;
    return next();
  }

  if (product && (/price|koto|দাম|কত|stock|available|availability|ache|আছে|পাওয়া|size|colour|color/.test(q) || find(q))) {
    state.unknownCount = 0;
    return response(
      product.stock
        ? say(
            `${product.name} is ${money(product.discountPrice || product.price)}. ${product.stock} in stock. Available: ${product.variants.map((v) => v.size + " / " + v.colour).join(", ")}. Would you like to order?`,
            `${product.name} er dam ${money(product.discountPrice || product.price)}. Stock e ${product.stock} ta ache. Order korte chan?`,
            `${product.name} এর দাম ${money(product.discountPrice || product.price)}। স্টকে ${product.stock}টি আছে। অর্ডার করতে চান?`,
          )
        : say(`${product.name} is currently out of stock. I can help you find an alternative.`, `${product.name} ekhon stock e nei. Onno product dekhabo?`, `${product.name} এখন স্টকে নেই। বিকল্প পণ্য দেখাতে পারি।`),
      { productId: product.id, cards: [{ type: "product", id: product.id, name: product.name, price: product.discountPrice || product.price, stock: product.stock, image: product.images[0] }] } as Partial<AgentReply>,
    );
  }

  if (/^(hi|hello|hey|salam|assalamu|হাই|হ্যালো|সালাম)/.test(q)) {
    state.unknownCount = 0;
    const greeting = override?.enabled ? override.greeting || agent.greeting : agent.greeting || t.greeting;
    return response(agent.disclosure && !/\bAI\b|এআই|কৃত্রিম/.test(greeting) ? greeting + say(" (AI assistant)", " (AI assistant)", " (AI সহকারী)") : greeting);
  }

  state.unknownCount = (state.unknownCount || 0) + 1;
  if (state.unknownCount >= 2 && agent.handover.unknown !== false) {
    state.handover = true;
    return response(t.handover, { handover: true });
  }
  return response(t.unknown);
}

export const MockAgent = { reply, findProduct: (m: string) => find(normalise(m)) };
