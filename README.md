# SalesPilot AI — real Connections + interactive prototype

**Release 2.0.0 · Modern black/yellow interface · Python backend added by request**

The client sidebar’s **Connections** entry now includes LinkedIn, Facebook & Instagram, YouTube, Threads, X, Telegram, Discord, WordPress and WhatsApp Business. This new hub uses server authentication, encrypted credential storage and real provider adapters. No real accounts are connected yet: you still need to create provider apps, configure credentials/callbacks and authorize your own accounts.

**Start with [INTEGRATIONS.md](INTEGRATIONS.md)** for backend installation, owner creation and deployment; **[PROVIDER_SETUP.md](PROVIDER_SETUP.md)** has all platform setup steps; **[SECURITY.md](SECURITY.md)** explains safeguards and limits.

```sh
python3 -m pip install -r backend/requirements.txt
python3 -m backend.manage create-owner --email you@example.com
# Enter a unique 14+ character passphrase when prompted.
python3 -m uvicorn backend.app:create_app --factory --host 0.0.0.0 --port 8082 --no-access-log
```

Open **http://localhost:8082**, then use the real owner login. Configure `.env` from `.env.example` as documented. Public real-credential use requires production HTTPS, a stable encryption key and your own registered callback domain. There is no default password, pre-authorized provider, paid hosting or supplied API secret.

### Two clearly separate modes

- **Real hub:** connect/discover/select/verify/remove account records. Server-owned data; no provider tokens in localStorage. The old demo roles do not authorize this API. Double-click opening shows an honest backend-required state and disables credential entry.
- **Original prototype:** landing, onboarding, Inbox, Posts, AI, Billing and Admin remain simulations. **Demo channels** opens their old connection flows. They do not use live tokens or publish/send anything. Backend `/` opens Connections; backend `/index.html` opens the demo marketing site.

Connecting is **not** live publishing, inbox synchronization, a webhook subscription or provider approval. Local removal is not remote grant revocation. Automated checks use controlled provider-response fixtures; no live provider authorization has been performed.

**Never serve a populated `.env` using a generic static server.** The real backend deliberately does not expose `.env`, backend source or database/key files. The old optional static/demo instructions below are only for a source tree without secrets, never for a configured live deployment.

41 HTML entries are shipped: the original 40 plus the real Connections hub. Required original frontend contracts and SPEC.md are preserved; the user-authorized backend extension and its tests are recorded in PHASES.md / QA_REPORT.md.

---

# Original browser-only prototype documentation

**Everything below applies to the original simulated modules only**, not the new real Connections service. The original frontend remains plain HTML/CDN/vanilla JS; only the new backend requires Python packages.

# SalesPilot AI

**Interactive front-end prototype · Bangladesh-first · BDT · version 1.7.0**

A browser-local sales-agent SaaS demonstration: connect fictional Facebook Pages, Instagram accounts and WhatsApp Business numbers; teach a catalog; collect an order; hand over to a person; inspect platform operations. **No backend, real AI, Meta API, messaging, email, payment or production authentication is connected. Use fictional data only.**

## Modern visual design — black & yellow

Version 1.7.0 extends the visual refresh with dark editorial dashboard headers, a highlighted yellow metric card, refined charcoal navigation, glass-style topbars, warm gradient primary actions, calmer card/table surfaces, and refreshed onboarding, inbox and public landing/auth styles. The landing includes a dark grid-textured hero and subtle gold glow; animations respect reduced-motion settings. `assets/css/modern.css` is the shared presentation layer loaded after the existing quality layer. Product state, flows and required APIs are unchanged.

### Readable typography

Version 1.6.0 applies the requested black/yellow visual refresh across public, onboarding, client and admin pages. Main copy is 16px, table/button copy 14px, compact metadata generally 12–13px and page headings 26–30px. Charcoal navigation, yellow highlights/CTAs with black lettering and contrast-safe warm link text work in both light and dark modes. Native status/channel colors remain distinguishable. Existing local records, routes and interactions are unchanged.

## Open it

1. Unzip the complete `salespilot` folder. Keep `assets`, `app`, `admin`, `tools` and the root HTML files together.
2. Double-click **`index.html`** in a current desktop Chrome or Edge. No npm, build step, package install or server is required for the prototype.
3. Internet access is needed for the permitted Tailwind CDN, Lucide, Chart.js and Inter font dependencies. This is **not an offline bundle**. Local CSS preserves useful layout if Tailwind fails; unavailable charts display recovery instructions. If icons/fonts are blocked, the text controls still work, but the intended visual experience needs the CDNs.
4. **Log in → Enter as Client** opens the saved onboarding journey if incomplete, otherwise the client Overview. **Enter as Admin** opens the platform Overview. Any syntactically valid demo credentials work; passwords are not stored. These are simulated roles, not accounts or security boundaries.
5. A browser may restrict `file://` storage, folder access or native APIs. For consistent shared persistence, optionally serve the folder:

   ```sh
   cd salespilot
   python3 -m http.server 8080
   ```

   Open `http://localhost:8080/`. This is a static server only, not a backend. Use a different port if 8080 is occupied. Keep the same browser/origin for a continuous story: file, HTTP, other ports and private windows can have separate storage.

**Start the story:** open **Demo controls → Start / resume guided demo → Start signup story**. The collapsible coach follows real wizard progress and never fills forms, connects accounts, creates fake success, or resets data. Signup replaces the primary demo workspace only when you submit it. Follow [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the five-minute presenter flow, sample messages and recovery steps.

## What is included

- **Public:** landing, pricing, signup, login, forgot-password, privacy, terms, data-deletion.
- **Onboarding:** seven saved/validated steps: business → channels → products → knowledge → agent → playground → go live.
- **Client (14):** Overview, Inbox, Channels, Products, Knowledge, Agent, Comments, Orders/Leads, Posts, Templates, Analytics, Billing, Team/Settings, Notifications.
- **Admin (14, including client detail):** Overview, Clients, Client Detail, Channel Health, Meta Status, Plans, Billing, Usage, AI Configuration, Monitoring, Template Moderation, Support, Compliance, Platform Settings.
- **Developer:** `components.html`, `tools/check-links.html`; `foundation.html` redirects to the component library.
- Persisted light/dark theme; shared navigation/topbar; mobile navigation; forms, accessible overlays, notifications, CSV/HTML downloads, explicit errors/empty states and confirmations.
- A single branding/theme configuration: **`assets/js/tailwind-config.js`** (`SP_CONFIG` and Tailwind tokens). Semantic CSS variables in `assets/css/custom.css` are canonical. Channel chips use generic icons, never real platform logos.

## State, roles and tenant switching

All data lives in `localStorage` under **`salespilot.demo.v2`**, schema version 2. Reads clone data; original deterministic seeds remain in `data.js`. Client state is active in the keyed Store. Additive admin workspace snapshots retain other fictional businesses. Reasoned, privacy-acknowledged impersonation saves the original workspace, opens the selected client and persists their edits; **Exit impersonation** restores the original context. Opening an admin page, logging out or logging in again also exits/restores a persisted support session.

Use **one active support workspace at a time**. This is not secure multi-tab or server-enforced tenant isolation. The role matrix and demo 2FA are UI specifications, not access enforcement. Anonymous/wrong-role product routes redirect to login; suspended/deleted client access has explicit recovery guards. Do not rely on these client-side guards for real data protection.

New signup intentionally starts an empty primary catalog/conversation/order workspace. The public landing still uses clearly illustrative product artwork even when the local catalog is empty. Other admin businesses have contextual fictional catalogs/threads. Uploaded images are stored locally and can exhaust quota; a storage warning explains memory-only behavior. If persistence is blocked/full, do not assume edits survived reload.

## Guided demo

The non-modal coach has 12 chapters and can be collapsed, paused or resumed from Demo controls on public, setup, client, admin and developer pages. Ordinary dialogs temporarily hide it. Wizard chapters advance only through the real validated wizard. Later chapters require setup completion, a Confirmed order and a human-handover state before continuing. An explicit confirmation changes the simulated session to Admin for the last two chapters; no real account elevation occurs.

The guide is a presenter aid, not automation or a stopwatch guarantee. Full simulated signup/connection dialogs can take longer than five minutes when explored in detail. `DEMO_SCRIPT.md` provides suggested timing and an existing-workspace continuation option. Theme and local records remain after the guide finishes. Reset clears the guide as well as edits.

## Error and recovery controls

| Demonstration | Trigger | Recovery / truth boundary |
|---|---|---|
| Facebook permission denied / missing Page role | Demo controls → Connection scenario | Follow the popup recovery action, choose an eligible fictional Page and re-authorise. No real permissions change. |
| Expired token / OAuth 190 | Simulate token expiry, or admin Force reconnect | Reconnect in client Channels; disable the global expiry scenario if it is still on. Webhook tests cannot mint a token. |
| Instagram not linked / message access off | Connection scenario or choose a Page without a linked account | Choose a linked fictional Page, then complete the message-access checklist/recheck. |
| Expired WhatsApp reply window | Demo controls → WhatsApp reply window expired | Composer is replaced by an approved-template flow with required variables/opt-in. A template does not reopen free-text messaging. |
| Failed payment | Demo controls → Simulate failed payment | Turn it off and retry the actual saved invoice. Failed plan changes preserve the old plan until success. No money moves. |
| Template rejection | Simulated review rejection, missing Marketing opt-out or admin review | Edit with clear purpose, samples and opt-out, resubmit/reapprove. Status is not real Meta approval. |
| Webhook or provider failure | Channel test failure or Monitoring incident scenario | Disable the test failure / return to Normal, test or restart the local sample worker. No remote worker is restarted. |
| Missing document knowledge | Indexed PDF/text demo | PDF content is not extracted. Put important answers into editable FAQs/policies; do not claim the PDF taught a real model. |
| Feature unavailable / maintenance | Admin Settings flags | Re-enable the feature and reload the client page. Maintenance is a non-blocking notice; scheduling flag also stops its page-local timer. |
| Missing CDN or storage access | Browser/network restrictions | Allow permitted CDNs, try the static HTTP option, or reset browser-local data. Charts and storage report recoverable errors. |

Live incoming messages run about every **20 seconds while Inbox is open**. Posts scheduling runs about every **15 seconds while Posts is open**; Monitoring ticks about every **5 seconds while Monitoring is open**. None is a background service or continues after leaving its page. Turn off live mode before a controlled presentation.

## Reset and deletion

- **Demo controls → Reset demo data:** confirmation restores exact seeds, clears session/theme/preferences/guide and reloads. Login again.
- **Client Settings → Data & safety → Reset demo:** confirmed full seed reset/sign-out.
- **Admin Settings → Data & reset:** type **`RESET`** and a reason, then confirm. This clears all additive workspaces, settings, invoices, audit additions and the session.
- If the UI cannot load because storage was manually corrupted, remove only `salespilot.demo.v2` in browser site storage and reload. Browser DevTools alternative: `localStorage.removeItem('salespilot.demo.v2'); location.reload()`.
- A **deletion request** is a local queue record, not immediate erasure. Linked admin completion requires both request code and exact business name; unrelated historical examples never guess a current client by name. Administrative deletion erases customer/support records but retains disclosed fictional invoices/audit/minimal metadata. Client self-delete also clears backing snapshots and erases its local invoice list. None processes real servers, backups, subprocessors or statutory retention.

## Simulation versus future production

| Area | This prototype | Required production work |
|---|---|---|
| Login/session/roles | Any demo credentials; editable local roles | Real identity, secure sessions, RBAC, CSRF protection, audit and authorization |
| Tenant data | One active browser workspace plus snapshots | Server-scoped tenant keys, authorization, migrations, concurrency and isolation tests |
| Facebook/Instagram/WhatsApp | Fictional permission/account/OTP flows | Real OAuth/embedded signup, verified assets, current scopes/review, business verification |
| Tokens | Masked demo markers; expiry/reconnect state | Encrypted secret storage, rotation, least privilege, secure token lifecycle |
| Webhooks | Saved connection states, simulated delivery | Verified subscriptions, raw-body signature verification, replay protection, deduplication, queues |
| Signature tool | Actual native HMAC-SHA256 **with fake secret** | Trusted server verification and secret management; no real endpoint is called here |
| AI replies | Deterministic intent/catalog rules | Real model orchestration, grounding, retrieval, evaluations, observability and cost controls |
| Prompt/model/A-B settings | Versioned specification + five rule checks | Actual deployment, routing, experiments, model evals and safety release process |
| Knowledge | FAQs/policies used by local rules; PDF metadata/indexing states | Secure extraction, storage, retrieval, provenance and lifecycle handling |
| Messages/comments | Local thread records; prototype policy guards | Real delivery, idempotency, current channel policies, consent and messaging-window enforcement |
| Orders | Local collection/kanban; no stock reservation | Transactional inventory, taxes, fulfillment/courier, payments and reconciliation |
| Posts | Page-local scheduler and fictional publish records | Durable jobs, API publishing, retries, media processing and monitoring |
| Templates | Local submission/moderation state | Provider template API, review outcomes, language/category compliance and delivery |
| Billing/refunds | Fictional invoices, proration, retries/refund records | Payment processor, secure checkout, ledger, tax documents, reconciliation and refund webhooks |
| Email/support | Editable copy, local tickets, notifications/preview audits | Delivery provider, verified contacts, access controls and communication records |
| Usage/monitoring | Labelled deterministic samples / what-if assumptions | Metered event ledger, current provider costs, real metrics, alerts, SLOs and workers |
| Compliance/policies | Sample legal pages, queue, consent/policy register, editable audit | Legal review, verified requests, processor/backup deletion, retention, immutable records |
| Admin permissions/2FA | Explicit capability/code previews | Actual authorization and genuine second-factor enrollment/recovery |

Pricing-plan/feature limits are descriptions and explicit demo gates, not full production entitlement/overage/trial-eligibility enforcement. Financial CSVs/printable HTML invoices are not tax documents. Sample legal contacts use `.example` and must be replaced before production. The prototype does not claim to implement all current provider policies or legal obligations.

## Link checking and QA

Open **`tools/check-links.html`**, or Demo controls → Check local links.

- Under HTTP, **Run HTTP check** reads the known local files and static HTML references, without executing product actions.
- Under `file://`, choose the unzipped project folder. The File API reads selected files locally; nothing uploads. Missing files are reported honestly rather than passed from a manifest.
- External/CDN URLs are **skipped**, not claimed available. JavaScript-rendered fragments are **Runtime fragment**, not false failures/passes. The utility does not execute all generated links or test authorization.
- Export a JSON check report. The final runtime/browser audit covers generated links, fragment targets, guards, themes and interactions separately.

See [QA_REPORT.md](QA_REPORT.md) for measured final checks, scope and caveats. `PHASES.md` records incremental implementation/check history; older sections describe earlier milestones and are superseded by the latest section. **`SPEC.md` is unchanged and remains the scope authority.**

### Optional automated QA — not runtime dependencies

From the project directory, serve HTTP at port 8080. The optional tests use Node and Python Playwright (plus `openpyxl` to construct a real XLSX fixture). These packages are for QA only; none is loaded by the website.

```sh
python3 -m pip install playwright openpyxl
python3 -m playwright install chromium
node tests/foundation.test.cjs
# Run the *.test.py files in tests while the static server is running.
python3 tests/phase5.test.py
python3 tests/final-audit.test.py
```

Tests create their own browser contexts/fictional records and reset local test state. Existing earlier-phase suites cover CRUD, messages, orders, imports, connection recovery, billing, privacy, tenant restoration, moderation, support, native signatures and exact resets. Cross-product scripts write screenshots/audit artifacts outside the source folder by default; see their output for details. No real service credentials are needed.

## Files and contracts

- `assets/js/store.js`, `data.js`, `layout.js`, `mockAgent.js`, `connect.js`, `charts.js` keep the required global contracts. `store.js` resolves seeds lazily and loads before `data.js`.
- `layout.js` alone owns both sidebars/topbars, mobile navigation, overlays, theme, notifications and Demo controls. Product wrappers do not copy shell HTML.
- Page controllers use `#app-content`; shared helpers are additive. `tenants.js`, `platform-policy.js`, `admin-ops.js`, `tour.js` and `routes.js` describe local simulation/state responsibilities without replacing the required APIs.
- Only permitted external libraries: Tailwind CDN, Chart.js, Lucide and Google Fonts Inter. No framework, npm runtime, bundler, analytics beacon, backend API or extra client library.

**Demonstration/UI specification only. Do not deploy this as a secure, production-ready SaaS.**
