# Five-minute demonstration — SalesPilot AI

## Presenter setup (before the clock)

1. Unzip/open the project as described in README.md. Prefer a current desktop Chromium browser at roughly 1280–1440px. Keep the same browser/origin throughout.
2. If earlier edits are not needed, use **Demo controls → Reset demo data → Confirm action**. This erases local changes; do not reset a workspace you need to retain. Reopen the landing page.
3. Keep live incoming messages, token expiry, failed payment and expired WhatsApp window **off**. Set Connection scenario to **No error**. A separate failure story is below.
4. Have fictional values ready:
   - Business: **Gazipur Styles**; email **owner@demo.example**; phone **01712345678**; demo password **demo12345**.
   - Product: **Premium Blue Linen Shirt**, price **1490**, stock **20**, colour **Blue**; keep default M/L sizes.
   - Customer: **Rakib Hasan**, phone **01712345678**, address **Tongi, Gazipur**, quantity **2**, size **M**, colour **Blue**.
5. Launch **Demo controls → Start / resume guided demo → Start signup story**. The coach is non-modal and resumable. Collapse it if it covers a control. It never changes product data for you. Signup replaces the primary workspace only on your form submission.

This timing assumes concise narration and familiarity with the simulated dialogs. Exploring every permission, import method or optional failure will take longer than five minutes. The main story uses actual local actions, not a recorded success screen.

## 0:00–0:25 — A business, not a blank chatbot

**Say:** “SalesPilot AI helps Bangladesh businesses turn messages and comments into sales. This prototype uses fictional accounts and local rules; no real customer or Meta account is contacted.”

On signup enter the prepared business/email/phone/password, accept the demo terms, and create the workspace. Confirm business profile, Dhaka/Gazipur delivery areas and language, then **Save & continue**.

**Show:** a fresh empty catalog, saved seven-step onboarding and Bangla/Banglish/English context. Never enter a real password, PIN or OTP.

## 0:25–1:25 — Meet customers where they already are

### Facebook

1. Select **Connect Facebook**.
2. Continue through simulated login and plain-language permissions.
3. Keep the appropriate fictional Page selected, inspect its linked Instagram account, and confirm the connection.
4. If Instagram access is flagged, open the checklist, enable the sample message-access check and recheck. This is optional for the core story.

### WhatsApp

1. Select **Connect WhatsApp**.
2. Continue through login, portfolio and WABA selection.
3. Enter **01712345678**, then sample OTP **123456**.
4. Review the display name, acknowledge the sample consent and continue to success.
5. Point out quality/tier and pending display-name review as illustrative states; continue the wizard.

**Say:** “A production build needs verified assets, real scopes, token lifecycle and webhooks. Here we make that setup and its failure states visible without handling actual credentials.”

## 1:25–1:55 — One saved product, useful knowledge

In the manual product form add **Premium Blue Linen Shirt**, **৳1,490**, stock **20**, colour **Blue**, default M/L sizes. Save the product and continue.

Choose **Add starter FAQs**, inspect policy examples and continue. Keep Nila, multilingual replies, AI disclosure, order fields and human-handover rules. Continue to the playground.

**Say:** “The agent reads this saved catalog and the business-authored policies. Changing a price changes its next catalog answer. A PDF indexing badge here is only a simulated processing state.”

## 1:55–2:55 — A question becomes an actual local order

Use Facebook/Messenger skin in the playground. Send each message separately and wait for the reply:

1. `Premium Blue Linen Shirt price`
2. `I want to order Premium Blue Linen Shirt`
3. `Rakib Hasan`
4. `01712345678`
5. `Tongi, Gazipur`
6. `2`
7. `M`
8. `Blue`

Follow the actual agent prompts rather than sending details after an order is already complete. Depending on saved product fields, it may not need every variant prompt. If it asks for a product explicitly, use the exact saved product name.

**Show:** product card, saved price, stock-aware answers, required customer fields and **Order collected · SP-…**. The total includes delivery according to saved local rules; do not promise a fixed total without reading the displayed calculation.

Continue to readiness. Turn on the demo agent, confirm, and open the dashboard. The coach’s next chapter opens Orders.

**Say:** “This is a rule-based simulation, not general-purpose AI. The order is a real local record, but no money, inventory reservation or courier action occurs.”

## 2:55–3:25 — Operations your team can use

Open **Orders & Leads**. Find the new playground order. Use **Move to → Confirmed** (the accessible alternative to dragging), or drag New → Confirmed in the kanban. Inspect customer/items/source in its detail drawer.

**Show:** the same order created in the playground, not a second example. Existing-workspace presentations may show earlier orders too; use the customer/source/ID to identify the new one.

## 3:25–4:00 — Human handover, on purpose

Open **Inbox** → **Simulate incoming**. Enter **`agent chai`** and choose **Deliver demo message**. A fresh signup creates its first thread through this action. Wait for the AI handover/Needs human state, then **Take over**. Show a human reply or internal-note composer. Do not claim a real reply was delivered externally.

**Say:** “The business stays in control. A customer can ask for a person; AI pauses, context remains, and the team takes over. Outside WhatsApp’s sample free-text window, the prototype enforces the template flow instead.”

If no handover appears, confirm the agent is live, Facebook is connected, its bot is on, the expiry scenario is off and the selected thread is AI handling. Returning a thread to AI resets its handover state. Avoid live-mode noise during this step.

## 4:00–4:30 — Accountable platform support

Choose the coach’s next chapter and explicitly confirm **Switch to demo admin**. This changes the local demo role, not a real account permission. The client-detail page opens for the same business.

Show profile/subscription/channels/usage and the audit trail. Explain the privacy gate on read-only messages. If there is time, enter a reason/reference, acknowledge support purpose, impersonate the business, then use **Exit impersonation**. That round trip saves target edits and restores the original workspace. Never imply a frontend banner constitutes secure server-side tenant isolation.

## 4:30–5:00 — Credible review readiness

Open **Meta App Status**. Show verification/mode/provider/version, Standard/Advanced access, rejection reason and screencast/evidence checklist. Open a policy/deletion preview if useful.

**Say:** “We distinguish a complete UI checklist from actual provider approval. Production still needs hosted policies, real test assets, verified consent, genuine review evidence, approved permissions and secure infrastructure.”

Finish the guide. The story’s local data stays saved. Invite a focused follow-up rather than promising production readiness.

## Optional follow-up demonstrations

- **Catalog truth:** edit a product price, ask again in Agent preview and show that Store-backed replies change.
- **Language:** ask `Bhai red shirt er price koto?`, `লাল শার্টের দাম কত?` or an English price question in a seeded catalog. The fresh-story product is blue, so use its exact name when testing it.
- **Token expiry:** Demo controls → Simulate token expiry. Show attention/banner and reconnect flow; switch the scenario off afterward. Admin webhook tests cannot repair an expired token.
- **WhatsApp window:** select a WhatsApp thread and enable the expired-window scenario. Show the approved-template picker, sample variables and opt-in guard. Templates do not reopen free text.
- **Failed invoice:** enable failed payment, attempt a paid upgrade, show old plan retained, turn failure off and retry that invoice. No actual charge/refund.
- **Template moderation:** filter by business, reject with actionable feedback and show the same client template state. Approval must pass basic content/Marketing opt-out checks and is not Meta approval.
- **AI release checks:** run evaluation, disable a required draft guard to show FAIL/publication block, restore it and publish a reasoned version; compare and restore a previous full snapshot as a new version. No real model deployment/A-B traffic split occurs.
- **Monitoring:** choose Provider failure, see real page-local ticks, pause and acknowledge; restart only changes the local worker example.
- **Deletion:** create a request in client Settings, retain its visible code, process in Compliance. Linked completion requires the code and exact business name; use disposable fictional data. Historical examples without a linked ID never erase another business.
- **Native signature check:** Admin Settings → API & webhook → Generate sample signature → Verify. Tamper payload and verify again for FAIL. HMAC is real browser cryptography with a fake secret, not a received Meta webhook.

## Resume, recover, repeat

- **Paused coach:** Demo controls → Start / resume guided demo → Resume guide. An incomplete wizard resumes its saved step. Completed workspaces can start at Orders without a new signup.
- **Wrong chapter/page:** use Open this chapter; wizard progress is followed automatically. The guide does not skip validation or auto-create an order/handover to unlock a chapter.
- **Interrupted chat:** reset the playground chat; previously completed orders remain saved. To avoid a second order in the pitch, show the earlier saved order instead of recollecting it.
- **Wrong session:** use the appropriate demo login role, or explicitly approve the coach’s role-switch prompt. Exit impersonation before treating the platform view as the original business.
- **Storage/CDN problems:** consult README.md, use the optional static HTTP server and retain one browser/origin. A storage warning means persistence may be unavailable.
- **Clean repeat:** confirmed Demo controls reset, or Admin Settings typed `RESET`, then start again. Never reset needed local work.

**Do not claim:** live Meta integration, actual AI/model quality, real delivery, secure authentication/2FA, immutable audit, durable workers, a valid tax invoice, actual payment/refund, lawful consent or completed production deletion. The purpose is a complete interactive investor/client demonstration and UI specification for a real build.
