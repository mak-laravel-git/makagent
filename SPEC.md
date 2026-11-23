# SalesPilot AI — prototype specification

Source: the user's master product brief and subsequent phase-by-phase build contract in this conversation. This file records the agreed scope for subsequent phases; build progress and implementation notes live separately in PHASES.md.

## 1. Role and goal

Build a complete, clickable, front-end-only prototype of a multi-tenant SaaS called **SalesPilot AI**, with branding configurable in one place. Businesses connect Facebook Pages, Instagram Business accounts and WhatsApp Business numbers. A simulated AI sales agent responds to messages and comments, answers product questions, collects orders, hands over to humans and can publish or schedule posts. The prototype is for investor/client demonstrations and as a UI specification for a real build. No backend, real Meta API, real AI or real billing.

## 2. Strict technical constraints

- Plain HTML, Tailwind CSS via CDN and vanilla JavaScript. No frameworks, build step or npm dependency. Must work by double-clicking HTML files.
- Permitted external libraries: Tailwind, Chart.js, Lucide and Google Fonts Inter only.
- localStorage state; reset actions in client Settings and admin Settings.
- Multiple static pages using one shared layout.js to inject navigation and topbar.
- Desktop-first, fully usable on mobile/tablet, collapsible sidebar and scrollable tables.
- Persisted light/dark mode.
- Generic coloured channel chips; never real Meta/Facebook/Instagram/WhatsApp logos.
- Clear empty, loading, error and success states; confirmations for destructive actions.
- Semantic markup, labelled inputs, focus rings, accessible modals with Escape, focus trapping and return.
- Bangladesh-first demo: BDT (৳), Dhaka Threads fashion store, Gadget Ghor, Ghorer Ranna, Bangla/Banglish/English messages.

## 3. Shared code contract — do not rename

### assets/js/store.js — window.Store

```
Store.get(key, fallback)
Store.set(key, value)
Store.update(key, fn)
Store.reset()
Store.session() // {role:'client'|'admin'|null, clientId, impersonating:bool}
```

Load store.js before data.js; seed initialisation must be lazy. Keyed update allows a mutating function or a returned replacement value. The seed data itself is not mutated.

### assets/js/data.js — window.SEED

Seed data only:

- client, channels, products, categories, offers
- conversations, messages, orders, leads
- faqs, documents, templates, posts
- plans, invoices, team, notifications
- admin.clients, admin.metaStatus, admin.tickets, admin.deletionRequests, admin.auditLog, admin.systemMetrics
- 30-day deterministic daily series for messages, orders, revenue and signups.

Foundation seed requirements: 1 Dhaka Threads business; 3 connected channels and a separate needs_reconnect example; 24 products across 5 categories with variants, prices, stock, discount prices, images and AI instructions; 30 multilingual conversations with handovers/expired windows; 15 orders across all 6 statuses; 10 leads; 12 FAQs; 4 indexed documents; 6 WhatsApp templates with review states and reasons; 8 posts; 4 plans; 6 invoices; 4 teammates; 10 notifications; 12 varied admin clients; approximately 14 Meta permissions; 8 support tickets; 5 deletion requests; 20 audit entries; 30-day system metrics. Use a seeded PRNG.

### assets/js/layout.js — window.UI

```
UI.renderShell({ role, active, title }) // inserts #app-content
UI.toast(message, type) // success|error|info|warning
UI.openModal({ title, body, actions })
UI.openDrawer({ title, body, actions })
UI.confirm({ title, message, danger }) // Promise<boolean>
UI.badge(text, tone)
UI.skeleton(type)
UI.emptyState({ icon, title, text, cta })
UI.theme.toggle()
```

Each action has label and optional primary, danger, disabled, close and onClick. Returning false from onClick keeps the overlay open for validation. Both role shells use distinct accent colours; admin has an explicit Admin badge. Shared topbar includes search, notification dropdown, theme control, account menu and impersonation banner/exit when applicable.

### assets/js/mockAgent.js — window.MockAgent

```
MockAgent.reply({ message, channel, conversationState })
// {text, cards:[], handover, orderDraft}
```

Rule-based intents: greeting, price, availability, delivery, order, handover, unknown. Fuzzy catalog/category matching, product cards and language-sensitive responses. Order collection: name, phone, address, product, quantity, size/colour. Trigger handover for "agent chai" and after 2 unknown questions. Catalog changes in Store must immediately change replies. Returned complete drafts are persisted by page controllers.

### assets/js/connect.js — window.Connect (Phase 2)

```
Connect.facebook(onDone)
Connect.whatsapp(onDone)
Connect.reconnect(channelId)
Connect.disconnect(channelId)
```

### assets/js/charts.js — window.Charts

```
Charts.line(canvasId, labels, datasets)
Charts.bar(canvasId, labels, datasets)
Charts.donut(canvasId, labels, datasets)
```

Chart.js wrappers respond to theme and token colours. Tailwind tokens are in assets/js/tailwind-config.js; semantic CSS variables are canonical. All page content goes in #app-content; never duplicate sidebar/topbar markup.

## 4. Roles and public entry points

A single login form accepts any demo credentials, with Enter as Client / Enter as Admin shortcuts. Save a role session and protect routes. Client login goes to onboarding if incomplete, otherwise app/overview.html; admin goes to admin/overview.html. Logout clears session. Public pages: index.html, pricing.html, signup.html, login.html, forgot-password.html, privacy.html, terms.html, data-deletion.html.

Landing: hero "Turn every message and comment into a sale", animated multilingual chat, supported channels, Connect/Teach/Sell steps, features, UI-built showcase, testimonials, pricing teaser, FAQ, final CTA and policy footer.

Pricing: Free Trial, Starter, Growth, Pro from seeds; monthly/yearly toggle, savings, comparison, limits for channels/conversations/team/scheduler/analytics, FAQ.

Signup: business name, email, phone, password, terms validation, then onboarding.

Legal pages: realistic placeholder policies describing collected data, AI processors, retention, deletion and contact; proper separate pages suitable as future Meta-review references, not production legal advice.

## 5. Onboarding — 7 saved, validated steps

Full-screen stepper, progress bar, Back/Next, save and continue later and resume.

1. Business profile: name/category, logo upload, website, phone, delivery areas, hours and language.
2. Channels: Facebook, Instagram, WhatsApp cards and all connection statuses. Simulated popup browser with fake URL, login, plain-language permissions, 3 selectable Pages and linked Instagram handles, success/webhook state. Instagram setup checklist warns when connected-tools message access is off and offers instructions/recheck. WhatsApp embedded-signup modal: login; select/create portfolio; select/create WABA; phone; six-digit OTP; display name; success with number, quality, tier and display-name review state. Error scenarios: permission denied, missing Page role, token expiry/reconnect and Instagram not linked, all with recovery actions.
3. Products: manual tab; CSV/Excel import with mapping and row validation; simulated URL scan with progress/approval; paste text and structure locally. Live product counter. Do not add an unapproved spreadsheet parsing library: explain supported formats honestly if full XLSX parsing is not feasible.
4. Teach AI: FAQs, delivery/returns/payment policies, offers, PDF/text documents with Indexing → Indexed statuses. bKash, Nagad, COD, card.
5. Agent personality/rules: name/avatar, tone, languages, greeting, handover keyword/anger/order amount/unknown question, business-hour behaviour, AI disclosure, all order-collection fields.
6. Phone-style playground: channel skins, catalog-aware replies, typing, product card, full order collection/persisted order and agent chai handover.
7. Go live: channel/catalog/knowledge/rules checklist, Turn on AI agent switch, success leading to app/overview.html.

Floating demo controls: live incoming messages, token expiry, expired WhatsApp window, connection-error options, reset data; final phase adds guided tour.

## 6. Client app — navigation and complete scope

1. **app/overview.html**: conversation/AI/order/revenue/response/handover KPIs; messages line, channel donut; recent conversations; channel health; token/stock/handover attention; incomplete onboarding checklist; real date filtering.
2. **app/inbox.html**: 3 panes; conversation filters All/AI handling/Needs human/Resolved, search, channel/unread; customer/AI/human messages, cards/timestamps; customer tags/history/notes; 24h live countdown; expired WhatsApp window replaces composer with approved-template picker; paused banner Take over / Return to AI; internal notes, quick replies, editable AI suggested reply; persisted send; ~20-second incoming messages in live mode with MockAgent reply.
3. **app/channels.html**: accounts/numbers with status/token/webhook time, per-channel bot switch, connect/reconnect/disconnect confirmation, add channel; WhatsApp quality/tier/name review/templates.
4. **app/products.html**: grid/table, search/category/stock/status filters/sort, bulk publish/unpublish/price/delete; add/edit drawer with name/SKU/category/description/price/discount/stock/threshold/variants and variant stock/multiple images/tags/delivery override/status/AI instructions; per-product question preview; CSV import mapping/validation/export; Synced/Pending/Error with retry; asked/out-of-stock/price insights; categories and validity-dated offers. Persist all CRUD and reflect it in agent replies.
5. **app/knowledge.html**: FAQs/policies/documents CRUD, indexing, test question with used-snippet source chips.
6. **app/agent.html**: onboarding agent fields plus channel overrides, hours, blocked words, escalation email/WhatsApp, custom instructions and live preview.
7. **app/comments.html**: Facebook/Instagram rule builder, any/keyword/question triggers, varied public replies, optional private reply (one per comment, within 7 days), hide/ignore/spam rules, toggles/activity log and comment simulation.
8. **app/orders.html**: list and draggable kanban New/Confirmed/Packed/Shipped/Delivered/Cancelled, keyboard Move to fallback; detail drawer items/customer/address/payment/source/conversation, AI-collected badge, confirm/edit/cancel/export; separate Leads tab. Playground/inbox orders appear immediately.
9. **app/posts.html**: text/image composer, channel selection, tone/hashtags/local caption generation, platform previews, date/time schedule, month calendar, drafts/published history.
10. **app/templates.html**: category/review state/rejection reasons, create form/live preview/variables, opt-in note, simulated Pending → Approved submission.
11. **app/analytics.html**: date filters change charts for conversations/response/AI share/funnel/products/questions/channels/sentiment; CSV.
12. **app/billing.html**: plan/usage, upgrade/downgrade with proration preview, payment method, invoices/downloads, failed-payment scenario.
13. **app/settings.html**: business profile, role-based invites/permission preview, notification preferences, request deletion with confirmation code, disconnect all, typed delete-account confirmation, reset.
14. **app/notifications.html**: all notifications, filters, mark read; bell dropdown includes expiry/handover/stock/order/payment alerts.

## 7. Admin app — distinct accent and Admin badge

1. **admin/overview.html**: MRR/active clients/signups/churn/messages/AI/LLM cost/template cost/gross margin; revenue/signup/messages/cost-v-revenue charts; linked alerts.
2. **admin/clients.html**: search/filter/sort/pagination/bulk; plan/status/channels/usage/last active/health.
3. **admin/client-detail.html?id=…**: profile/subscription/channel tokens/usage/read-only conversations with privacy notice/notes/timeline; impersonate with banner and exit round-trip; change plan/extend trial/suspend/reactivate/force reconnect/typed delete; audit sensitive actions.
4. **admin/channels.html**: cross-client channels Active/Needs reconnect/Webhook failing; OAuth 190 list; webhook success chart; last event; bulk reconnect notice email preview.
5. **admin/meta-status.html**: verification/mode/tech provider/API version/deprecation example; permissions with Standard/Advanced access and Not submitted/In review/Approved/Rejected reason; screencast checklist; overall review readiness including policy/deletion URLs, test account, screencasts/instructions.
6. **admin/plans.html**: plan CRUD, limits/monthly/yearly/features, coupons and pricing-card preview.
7. **admin/billing.html**: subscriptions/invoices/failures/dunning/retry/refunds/reports/export.
8. **admin/usage.html**: per-client tokens/LLM and WhatsApp costs/margin; unprofitable clients; small/large model mix; cost forecast; overages.
9. **admin/ai-config.html**: default prompt with {{business_name}}, {{products}}, {{rules}}, version diff/rollback, per-plan model, safety/blocked topics, business-specific WhatsApp policy guard, A/B, MockAgent evaluation pass/fail.
10. **admin/monitoring.html**: queues/failures/latency/autoupdating simulated error log/uptime/rate limits/workers/time range.
11. **admin/templates.html**: all clients' templates/rejection reasons/filter/bulk.
12. **admin/support.html**: tickets/status/priority/client, detail conversation/canned replies/assignment/internal notes.
13. **admin/compliance.html**: deletion queue/codes/dates/process/complete, consent logs, policy versions, searchable/filterable audit.
14. **admin/settings.html**: flags/maintenance and preview/email templates/admin role permission matrix/2FA/API-webhook config with masked verify token/signature check/reset.

## 8. Build order and stopping points

**1 → 2 → 3A → 3B → 4A → 4B → 5.** Stop after each phase, report checks and deviations, wait for the user. Never create unfinished product-page stubs.

- Phase 1: exact shared APIs, full data, tokens, layout for both roles, Chart.js wrappers, rule-based agent, and components.html only. Showcase buttons/forms/selects/toggles/tabs/tables/badges/cards/overlays/toasts/confirm/skeleton/empty/chat/stepper/KPI/charts in both themes.
- Phase 2: public site and detailed onboarding/connect flows.
- Phase 3A: overview, inbox, channels, products, knowledge, agent.
- Phase 3B: comments, orders, posts, templates, analytics, billing, settings, notifications.
- Phase 4A: admin overview, clients/detail, channels, Meta status, plans, billing.
- Phase 4B: admin usage, AI config, monitoring, templates, support, compliance, settings.
- Phase 5: no new product scope; fix all links, add tools/check-links.html, audit route protection/responsiveness at 360/768/1280/dark/accessibility/states/consistency/console/performance, add guided five-minute story, final README.md and DEMO_SCRIPT.md.

## 9. Final acceptance

Every listed page is complete and designed, every navigation link works, all key interactions persist, no console errors or broken links. Accessible controls and 44px mobile targets, no horizontal page overflow; tables scroll within their cards. Loading/empty/error/success states and confirmations where relevant. No lorem ipsum, dead actions or coming-soon product screens. Five-minute demo: signup → connect Facebook/WhatsApp → add product → agent order → order kanban → inbox handover → admin client/Meta status. Documentation distinguishes simulation from future production APIs, webhooks, tokens, AI, billing and template review.
