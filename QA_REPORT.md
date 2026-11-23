# SalesPilot AI — QA history

## Release 2.0.0 — real Connections extension · 22 October 2026

**Code and controlled tests complete; live provider setup/authorization and deployment are pending.** The new Python backend is an explicitly authorized extension. Original prototype modules remain simulations and SPEC.md is unchanged.

| Final check | Result / boundary |
|---|---|
| Backend | **14 tests PASS:** actual FastAPI routing, Argon2 login, encrypted SQLite credentials/pending choices, session/Origin/CSRF, workspace isolation, OAuth exchange/selection/replay/expiry, all adapter families, refresh/error behavior, local-only removal, source deny checks, production cookie/HTTPS gates, safe expired-grant mapping and failed-login throttling. Upstream provider responses are mocked. |
| New hub browser | **PASS:** actual Chromium + ASGI/session/CSRF/database with controlled upstream responses. Nine cards/guides, login, Telegram save/reload/reverify, explicit Meta selection, audit/removal/logout, demo-reset isolation, no provider token browser storage, and six light/dark × 360/768/1280 layouts. `file://` honestly disables credential entry. |
| Operator commands | **PASS:** actual `init`, `create-owner`, `set-password` commands against isolated disposable test data; stored hash verifies, no real/preview owner was created. |
| Original regression | **14 suites PASS:** foundation, browser, Phase 2/edges, 3A, 3B/edges, 4A workflows/edges/layout, 4B workflows/edges/layout, Phase 5. Combined wall time about 499 seconds under concurrent audit load; not a performance benchmark. |
| Original native audit | **PASS:** 40 original entries × two themes × three widths = **240 layouts**; 58 demo-guard redirects; 40 direct-file entries; 16 empty-state entries; CSV safeguards; 1,778 generated local links; zero captured page exceptions/console errors/local HTTP failures, broken generated targets, missing names or undersized default mobile targets. The real hub uses server API authorization, not the old demo-role guard, and is deliberately tested separately. |
| Source/package | First-party JS syntax and Python compile checks pass. Public file inventory includes 41 HTML entries and new public assets/guides, not private backend files. ZIP excludes populated `.env`, databases, encryption keys, caches and bytecode. SPEC SHA-256 remains `67ae6005dd3b8db86a8218b55439940d65bb5af22172c714440e5a70f336ac28`. |

**Not verified:** live account grants, provider app review/approval, real upstream scopes/quotas/costs, production DNS/TLS/proxy operation, Docker build/runtime, multi-worker/load behavior, security/compliance certification. Docker files are supplied but were not executed. No real publishing, messaging, billing or AI was implemented. A connection is only a point-in-time provider identity/permission check; removal is local, not remote revocation. Review INTEGRATIONS.md / PROVIDER_SETUP.md / SECURITY.md before using credentials.

The pinned Starlette TestClient currently emits a nonfatal httpx deprecation warning. The controlled tests pass; future dependency upgrades require retesting.

---

## Release 1.7.0 — modern visual presentation

- All 40 entries × light/dark × 360/768/1280px: **240 layouts checked; no horizontal page overflow or captured JavaScript page exceptions.**
- Re-ran foundation, browser, Phase 2 and Phase 5 suites: **all PASS**, including full signup/setup/imports, seven onboarding steps in both themes, native file opening, guided order/kanban/handover/admin story, overlay/focus behavior, and link checker HTTP/folder workflows.
- Shared modern.css adds dark editorial headers, yellow focal metric cards, redesigned surfaces/navigation/forms/tables, and public landing/auth styling. No product data or shared API contract changes. JavaScript syntax and shipped local reference checks pass.
- Visual review used desktop light/dark screenshots. Earlier complete functional/security-guard test results below remain historical; no claim that all 15 suites or a new performance benchmark were rerun for this presentation-only update.

---

## Release 1.6.0 — requested typography and black/yellow refresh

- Rechecked **240 layouts**: all 40 HTML entries, light/dark, 360/768/1280px. **No page overflow or captured JavaScript exceptions.**
- Re-ran **foundation, browser, Phase 2 and Phase 5** suites: all PASS. This includes all seven setup steps, product import, full guided journey, persistence, direct-file opening, focus/keyboard overlays and the HTTP/selected-folder link checker.
- All first-party JS syntax checks PASS. Product data/schema and required APIs are unchanged.
- Typography: 16px main copy, 14px table/button text, 12–13px metadata, 26–30px page headings. Enlarged chart labels, responsive header/component wrapping, charcoal navigation and black-on-yellow CTAs.
- Remaining semantic green/red/channel chips distinguish status and source; they are not primary brand colors.
- The 15-suite and detailed route/guard/performance results below belong to the preceding functional release, not a claim that all 15 were rerun after this visual-only update. No new performance benchmark is claimed.

---

## Prior functional release 1.5.0

**Release:** 1.5.0 · Phase 5 complete · **Tested:** 22 October 2026

This is a browser-local interactive prototype, not a security, legal, provider-policy or production-readiness certification. Final verification used Chromium/Playwright against a local Python static server and direct `file://` opening. Runtime dependencies remain only the permitted CDNs; Python/Node/Playwright/openpyxl are optional test tools, not application dependencies.

## Measured checks

| Check | Result and scope |
|---|---|
| Existing regression suite | **13/13 suites PASS:** Node foundation + Python browser, Phase 2/edges, 3A, 3B/edges, 4A/workflows/edges/layout, 4B/workflows/edges/layout. |
| Final workflow suite | **PASS:** actual guided signup → Facebook + WhatsApp dialogs → manual product → knowledge/rules → collected/saved order → go live → Confirmed kanban move → human handover → explicit Admin switch → same business detail → Meta status. No synthetic guide-created success. |
| Route/layout grid | **240/240 PASS:** 40 shipped HTML entries × light/dark × 360/768/1280px; 900px viewport height. `foundation.html` is a real redirect, not a second product. No horizontal page overflow. Tables/kanban remain internally scrollable. |
| Generated local links | **1,774 references checked** across the default rendered route/theme grid; each resolves to a shipped local file, and linked fragments to an ID on the rendered destination. **0 broken local targets/fragments.** This checks generated anchor targets, not every possible event-handler permutation. |
| Route protection | **58/58 PASS:** anonymous and wrong-role attempts against all 28 client/admin routes plus onboarding redirect to login. Additional existing edge tests cover suspension, deletion, feature gates and persisted support restoration. |
| Direct file opening | **40/40 entries PASS** in the supported Chromium file context, with explicit local demo roles for protected routes. Earlier suites also verify saved edits/reload and native signature checking under `file://`. |
| Empty primary workspace | **16/16 routes PASS:** all 14 client routes, landing and component library with catalog/conversations/orders/knowledge/templates/posts/channels/comments/notifications emptied. No page exception or literal `undefined` in the content. |
| Accessible names | **0 missing accessible names** in the default visible controls/canvases in the route/theme audit. Product forms have labels and charts include a textual data description. |
| Mobile touch targets | **0 targets below 44×44px** at 360 and 768px across both themes, counting a checkbox/radio/file input’s associated label as its hit area. Offscreen/inert/disabled controls are excluded; overflowing table controls remain available by internal scrolling. |
| Keyboard overlays/navigation | **PASS:** visible-only Tab/Shift+Tab trap, inert background, Escape close and focus return, replacement modal survives its predecessor’s action, mobile menu Escape/`aria-expanded`/focus exclusion, repeated account/notification dropdown toggle/replacement/keyboard handling. File-upload labels get a visible focus-within ring. |
| Guided coach | **PASS:** no automatic field filling, skipped validation, role change or reset; dialog coexistence; live chapter announcement; pause/resume; collapse; focus-controls auto-collapse; both themes/three widths; reset clears guide; story records remain saved. |
| Link-check utility | **PASS:** same-origin HTTP reading, native explicitly selected-folder reading under `file://`, JSON export/search/filter/clear, incomplete folder correctly reports missing files. External references are skipped, not called. JS-only fragments are labelled for runtime verification. |
| CSV safety | **PASS:** formula-leading strings (including whitespace prefixes) neutralized with a leading apostrophe; actual numeric totals stay numeric. This is an export safeguard, not a production security guarantee. |
| Browser failures | **0 captured page exceptions, console errors or local HTTP failures** in the final normal route/layout/guard/empty-state audit. CDN production-use warnings are not errors. Earlier negative-state suites deliberately exercise honest failure UI. |
| Source/packaging | JS syntax checks, local wrapper `src`/`href` checks, unchanged SPEC comparison, final route/file manifest and ZIP integrity verified. No added runtime library or build step. |

The 40 entries comprise 8 public pages, onboarding, 14 client routes, 14 admin routes, component library, foundation redirect and the link checker. Client detail is an admin child route, not a duplicated sidebar destination.

## What the existing suites exercise

- Deterministic seed counts, keyed Store API, cloning/isolation, persistence and exact reset.
- English/Banglish/Bangla catalog pricing, stock/unknown/handover, complete order collection.
- Permission/missing-role/token recovery, real Page selection, Instagram message checklist, WhatsApp OTP/consent, confirmed disconnect/cancellation rollback.
- Manual/CSV/real XLSX/website/paste catalog workflows; product variants/categories/offers and knowledge retry/indexing states.
- Inbox notes/suggestions/tags/profile, expired WhatsApp template guards, actual local order creation, saved agent overrides and blocked topics.
- Comment one-private-reply/seven-day rules, moderation; actual drag + keyboard kanban move/cancel/edit/export/lead conversion.
- Post autosave, platform/media validation, calendar/schedule, actual page-local scheduler publish/failure.
- Template variable/rejection/resubmission/review recovery; client/admin shared moderation records and bulk validation.
- Date-aware analytics, empty ranges, failed upgrade retains old plan, stale plan changes blocked, retry/proration/refunds/invoice download.
- Team/settings/preferences, read/history/notification deep links, low-stock alerts, typed self-delete and reset.
- Tenant-aware admin CRUD, reasoned sensitive actions, privacy-gated read-only support conversations, impersonation restore on exit/logout/login, suspension/deletion.
- Evidence-gated review readiness, shared pricing, usage/cost settings, draft guard evaluation, versioning/full snapshot rollback, monitoring scenarios.
- Tickets/macros/attachments, linked versus historical deletion requests, consent/policy/audit views, admin previews, fake-secret validation, actual native HMAC tamper test, typed `RESET` and backing-snapshot erasure.

## Performance smoke check

The measured final run reported a **169.5ms median DOM-content-loaded time** for the 80 local route/theme navigations (warm browser/CDN cache; machine/network dependent). The largest first-party JS source was **45,673 bytes**. Charts use reduced-motion-aware animation, fixed-height/min-width-safe containers and a responsive canvas cap; scheduled examples stop on page leave. The guide changes its DOM only when its chapter/readiness/collapse state changes.

These figures are **not Lighthouse, Core Web Vitals, mobile-network, load/concurrency, API throughput or production SLA results**. First-time CDN downloads and unavailable third-party hosts can dominate opening time. No external/provider uptime or backend performance was claimed or measured.

## Corrections made during Phase 5

1. Landing and the static component-chat illustration no longer index an empty live catalog. The component editor gives a real empty state instead of fabricating a product.
2. Overlay action cleanup only closes its own overlay; replacement dialogs survive. Background content is inert, hidden controls are excluded from the trap, scroll/focus restore is explicit and return focus can find a newly redrawn trigger.
3. Dropdown outside/key listeners and shared-shell media listeners are cleaned up; menus have labelled controls and arrow/Escape behavior.
4. Closed mobile sidebars are inert and marked hidden; Escape resets expansion state and returns focus without fighting a modal/dropdown.
5. Final touch sizing applies after page-specific styles, including compact tabs/account controls/table links, checkbox/radio labels and upload labels. Tables are not squeezed or hidden to meet the page-overflow rule.
6. Responsive chart backing stores cannot temporarily widen Analytics after a resize. Canvas descriptions expose series values, and reduced-motion preferences are respected.
7. Muted text contrast is strengthened at the canonical CSS token. Shared navigation is still defined only in `layout.js`.
8. CSV formula-leading strings are neutralized. Nested developer-tool navigation resolves through the same shared route helper; admin alert links stay in the admin directory.
9. The guided chapter after go-live follows the actual dashboard transition; “Show the controls” collapses the coach before focusing the real control.

## Limits and truthful interpretation

- Chromium was automated; Firefox, Safari, mobile hardware, assistive-technology combinations, zoom/forced colors and full WCAG conformance were **not** certified. Native-DOM checks and explicit keyboard tests are a useful audit, not a substitute for human accessibility testing.
- The automated grid covers default routes and the full onboarding/settings/compliance states exercised by the earlier suites. Arbitrary combinations of user edits, flags, all destructive states and parallel tabs are not exhaustively enumerated.
- External/CDN and `.example` contact URLs are not treated as local broken links. The checker never proves real provider approval, production signatures/endpoints, public policies or service availability.
- All roles, data isolation, passwords/2FA, consent/audit/deletion, payments, publishing, templates and AI remain simulations. Native HMAC is real math over fake data; it is not an integrated webhook server.
- localStorage is editable and not encrypted; use fictional data. Storage quotas/restrictions and file-origin policies vary. Use the documented static HTTP alternative for consistent cross-page persistence; concurrent support contexts are unsupported.
- The “five-minute” story is a suggested concise presentation, not a latency or completion-time guarantee. The optional connection details and extra recovery scenarios take longer.

See **README.md** for opening/reset/error/production boundaries and **DEMO_SCRIPT.md** for the presenter script. **SPEC.md remains byte-for-byte unchanged** from the Phase 4B delivery.
