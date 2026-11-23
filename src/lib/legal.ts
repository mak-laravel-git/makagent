// Production legal copy for Meta App Review / platform compliance.
// Public URLs (HTTPS):
//   Production: https://makagent.maktechgroup.com
//   Staging:    https://staging-makagent.maktechgroup.com
// Policies: /privacy · /terms · /data-deletion

export const LEGAL_META = {
  operator: "MakTech Group",
  product: "MakAgent",
  productionUrl: "https://makagent.maktechgroup.com",
  stagingUrl: "https://staging-makagent.maktechgroup.com",
  supportEmail: "support@maktechgroup.com",
  privacyEmail: "privacy@maktechgroup.com",
  legalEmail: "legal@maktechgroup.com",
  effectiveDate: "23 November 2026",
  version: "2.0",
};

export const LEGAL: Record<string, { intro: string; sections: [string, string][] }> = {
  privacy: {
    intro:
      "This Privacy Policy explains how <strong>MakTech Group</strong> (“MakTech”, “we”, “us”) collects, uses, shares and retains information when you use <strong>MakAgent</strong> at <a href=\"https://makagent.maktechgroup.com\">https://makagent.maktechgroup.com</a> (production) and our staging environment at <a href=\"https://staging-makagent.maktechgroup.com\">https://staging-makagent.maktechgroup.com</a>. It covers account data, Meta (Facebook, Instagram, WhatsApp) and other channel connections, customer conversations processed for your business, and the limited use of AI processors. By creating an account or connecting a channel, you agree to this Policy and our <a href=\"/terms\">Terms of Service</a>.",
    sections: [
      [
        "1. Who we are and how to contact us",
        `<p><strong>Controller / operator:</strong> MakTech Group, operating MakAgent.</p>
<ul>
<li><strong>Production site:</strong> <a href="https://makagent.maktechgroup.com">https://makagent.maktechgroup.com</a></li>
<li><strong>Staging site:</strong> <a href="https://staging-makagent.maktechgroup.com">https://staging-makagent.maktechgroup.com</a></li>
<li><strong>Support:</strong> <a href="mailto:support@maktechgroup.com">support@maktechgroup.com</a></li>
<li><strong>Privacy / data requests:</strong> <a href="mailto:privacy@maktechgroup.com">privacy@maktechgroup.com</a></li>
<li><strong>Legal:</strong> <a href="mailto:legal@maktechgroup.com">legal@maktechgroup.com</a></li>
</ul>
<p>Business customers control the customer conversations and catalog content in their workspace. MakTech processes that content to provide the subscribed service and acts as controller for account, security, billing and platform administration data.</p>`,
      ],
      [
        "2. Information we collect",
        `<p>Depending on how you use MakAgent, we may process:</p>
<ul>
<li><strong>Account &amp; business profile:</strong> name, business name, email, phone, language preferences, team roles, and subscription/billing references.</li>
<li><strong>Authentication &amp; security:</strong> password hashes (never plaintext passwords), session identifiers, CSRF tokens, IP-related security events, and audit logs of sensitive actions.</li>
<li><strong>Connected Meta and other channels:</strong> Page / Instagram professional account / WhatsApp Business identifiers you select; OAuth tokens and permission scopes granted through Meta or other providers; webhook subscription metadata needed to receive events; connection health and verification results. Tokens are encrypted at rest.</li>
<li><strong>Customer interaction content:</strong> messages, comments, sender names/IDs supplied by the channel, order details customers share, and internal notes your team adds.</li>
<li><strong>Business knowledge:</strong> products, prices, stock, FAQs, policies and documents you upload so the agent can answer accurately.</li>
<li><strong>Service usage:</strong> feature usage, error diagnostics, and consent records (for example acceptance of Terms and AI processing disclosure).</li>
</ul>
<p>We do not ask for Meta login passwords inside MakAgent. Channel access is granted only through the provider’s official OAuth / permission flow.</p>`,
      ],
      [
        "3. How we use information (purposes)",
        `<p>We use information to:</p>
<ul>
<li>create and secure your workspace and team access;</li>
<li>connect, verify and maintain authorised Facebook Pages, Instagram accounts, WhatsApp Business numbers and other channels;</li>
<li>receive and display customer messages/comments for sales assistance;</li>
<li>generate suggested replies, product answers and handovers using your catalog and rules;</li>
<li>collect order/lead details your customers voluntarily provide;</li>
<li>operate billing, support, troubleshooting, abuse prevention and legal compliance;</li>
<li>honour deletion, export and access requests.</li>
</ul>
<p>We do <strong>not</strong> sell customer conversation data. We do not use Meta-sourced content to build advertising profiles for unrelated third parties.</p>`,
      ],
      [
        "4. Meta Platform data (Facebook, Instagram, WhatsApp)",
        `<p>When you connect Meta products, MakAgent may receive data permitted by the permissions you approve in Meta’s dialog, for example:</p>
<ul>
<li>identity of the authorised user and manageable Pages / Instagram professional accounts;</li>
<li>Page and Instagram messaging content and metadata needed to reply;</li>
<li>comments on your content where comment-management features are enabled;</li>
<li>WhatsApp Business Cloud API phone-number / WABA identifiers and message events you authorise.</li>
</ul>
<p>We request only the permissions required for the features you enable. You can disconnect a channel in <strong>Connections</strong> and revoke the app in Meta Business / Facebook settings. Disconnecting stops new access; previously stored workspace copies are removed under our retention and deletion rules (see below and <a href="/data-deletion">Data Deletion Instructions</a>).</p>
<p>Use of information received from Meta APIs complies with the Meta Platform Terms, Meta Developer Policies and applicable WhatsApp Business terms. Meta-sourced data is not transferred to another app or used for purposes outside providing MakAgent to your business, except where required by law.</p>`,
      ],
      [
        "5. AI processing — what is sent, why, and how long it is kept",
        `<p>MakAgent may use contracted AI language-model processors to draft replies, summarise conversations, match products, and assist with catalog Q&amp;A.</p>
<p><strong>What may be sent to an AI processor:</strong></p>
<ul>
<li>the customer message or comment text that needs a reply;</li>
<li>limited conversation context (recent turns) required for a coherent answer;</li>
<li>relevant catalog snippets, prices, FAQs and policy excerpts you configured;</li>
<li>agent instructions and language preferences you set.</li>
</ul>
<p><strong>What we do not intentionally send:</strong> your Meta access tokens, encryption keys, payment card numbers, or unrelated workspace data. We instruct processors not to use your content to train public foundation models where the contract allows that control.</p>
<p><strong>Why it is sent:</strong> solely to generate or improve the automated sales assistance response for your authorised workspace in near real time.</p>
<p><strong>How long AI processors keep it:</strong></p>
<ul>
<li><strong>Transient processing:</strong> content is processed to produce a reply and is not retained by the AI vendor beyond the vendor’s documented API retention for abuse monitoring (typically up to <strong>30 days</strong>, often shorter), after which it is deleted or de-identified according to the vendor contract.</li>
<li><strong>MakAgent storage:</strong> the resulting draft/reply and the original conversation remain in your workspace under our conversation retention period of <strong>90 days</strong> by default (you may configure a shorter period where the product allows). After that period, conversation content is deleted from active systems; encrypted backups expire within a further <strong>90 days</strong>.</li>
</ul>
<p>AI output can be wrong. Businesses should review critical replies, keep accurate catalog data, and provide a human escalation path. Enabling AI features constitutes your instruction to process the relevant content for that purpose.</p>`,
      ],
      [
        "6. Sharing and subprocessors",
        `<p>We share information only as needed with:</p>
<ul>
<li><strong>Hosting / infrastructure</strong> providers that store the application and encrypted databases;</li>
<li><strong>AI processors</strong> as described in section 5;</li>
<li><strong>Meta and other channel providers</strong> when you authorise a connection or when we send/receive messages through their APIs;</li>
<li><strong>Payment processors</strong> if you purchase a paid plan (card data is handled by the payment provider, not stored as full PAN by MakAgent);</li>
<li><strong>Professional advisers or authorities</strong> when required by law or to protect rights and safety.</li>
</ul>
<p>International transfers may occur where our processors operate outside Bangladesh. We use contracts and appropriate safeguards before enabling such transfers for production workloads.</p>`,
      ],
      [
        "7. Retention",
        `<ul>
<li><strong>Account &amp; billing records:</strong> while the subscription/account is active, and thereafter as required for tax, dispute or legal obligations.</li>
<li><strong>Conversation &amp; customer content:</strong> default <strong>90 days</strong> in active systems (shorter if you configure it); backups purged within a further <strong>90 days</strong>.</li>
<li><strong>Channel tokens:</strong> until you disconnect the channel, revoke access at the provider, or we delete the workspace; tokens are encrypted and removed on disconnect/deletion.</li>
<li><strong>Security / audit logs:</strong> typically up to <strong>12 months</strong>, longer if investigating abuse.</li>
<li><strong>Verified deletion requests:</strong> target completion within <strong>30 days</strong> of verification; residual backups expire within a further <strong>90 days</strong>. Minimal records may be kept to prove the request was handled.</li>
</ul>`,
      ],
      [
        "8. Your choices and rights",
        `<p>Subject to applicable law, you may request access, correction, export, restriction, objection or deletion of personal data we hold. Workspace owners can manage connections and submit deletion from Settings (API &amp; data). End customers should contact the business they messaged first; that business controls the sales relationship.</p>
<p>Contact <a href="mailto:privacy@maktechgroup.com">privacy@maktechgroup.com</a>. Do not send passwords, OTPs, PINs or access tokens. See <a href="/data-deletion">Data Deletion Instructions</a> for step-by-step guidance.</p>`,
      ],
      [
        "9. Security",
        `<p>We use HTTPS for transport, encrypted storage of provider tokens, session cookies with security attributes in production, CSRF protection on state-changing requests, least-privilege access to connection records, and rate limits on authentication. No method of transmission or storage is 100% secure; report suspected incidents to <a href="mailto:support@maktechgroup.com">support@maktechgroup.com</a> immediately.</p>`,
      ],
      [
        "10. Children",
        `<p>MakAgent is for adult business users. It is not directed at children. Do not upload children’s data without a lawful basis and appropriate safeguards.</p>`,
      ],
      [
        "11. Changes",
        `<p>We may update this Policy. The “Updated” date at the top of this page will change, and material updates will be highlighted in-product or by email where appropriate. Continued use after an update constitutes acceptance of the revised Policy.</p>
<p><strong>Version ${LEGAL_META.version} · Effective ${LEGAL_META.effectiveDate}</strong></p>`,
      ],
    ],
  },

  terms: {
    intro:
      "These Terms of Service (“Terms”) govern access to <strong>MakAgent</strong>, operated by <strong>MakTech Group</strong>, at <a href=\"https://makagent.maktechgroup.com\">https://makagent.maktechgroup.com</a>. By creating an account, connecting a channel, or using the service, you agree to these Terms and the <a href=\"/privacy\">Privacy Policy</a>.",
    sections: [
      [
        "1. Eligibility and accounts",
        `<p>You must be an adult and authorised to bind your business. Provide accurate account information, protect login credentials, and ensure teammates use only the roles you assign. Contact <a href="mailto:support@maktechgroup.com">support@maktechgroup.com</a> for account help.</p>`,
      ],
      [
        "2. The service",
        `<p>MakAgent helps businesses manage sales conversations across connected channels (including Meta products you authorise), maintain catalog knowledge, and use optional AI-assisted replies. Features may differ by plan. Staging at <a href="https://staging-makagent.maktechgroup.com">https://staging-makagent.maktechgroup.com</a> is for testing and may be reset without notice.</p>`,
      ],
      [
        "3. Channel and Meta responsibilities",
        `<p>You must have authority over every Facebook Page, Instagram account, WhatsApp Business asset or other channel you connect. You must comply with Meta Platform Terms, WhatsApp Business policies, Instagram/Facebook messaging rules (including reply windows, templates, consent and opt-outs), and all applicable laws. Disconnect channels you no longer control. Local removal in MakAgent does not by itself revoke provider-side grants—also revoke the app in Meta’s settings.</p>`,
      ],
      [
        "4. Acceptable use",
        `<p>You may not use the service for spam, fraud, illegal goods, harassment, discrimination, scraping others’ data without rights, or to evade platform restrictions. You are responsible for the lawfulness of customer data you process and for the accuracy of catalog, pricing and policy content.</p>`,
      ],
      [
        "5. AI assistance",
        `<p>AI-generated replies are assistance, not guaranteed truth or binding offers. Review important messages before sending where your workflow requires it. You remain responsible for fulfilment, refunds, customer claims and compliance. AI processing is described in the Privacy Policy (what is sent, why, and retention).</p>`,
      ],
      [
        "6. Fees",
        `<p>Paid plans, taxes, renewals and cancellations will be disclosed at checkout. Channel-provider fees (for example WhatsApp conversation charges) are billed by those providers separately unless we expressly state otherwise.</p>`,
      ],
      [
        "7. Suspension and termination",
        `<p>We may suspend or terminate access for security risk, unpaid fees, unlawful use or material breach, with notice where practicable. You may cancel and request export/deletion under the Privacy Policy and <a href="/data-deletion">Data Deletion Instructions</a>.</p>`,
      ],
      [
        "8. Intellectual property",
        `<p>MakTech and its licensors own the MakAgent software and branding. You retain rights to your business content and grant us a limited licence to host and process it solely to provide the service. Meta and other platform names are trademarks of their owners; connection does not imply endorsement.</p>`,
      ],
      [
        "9. Disclaimers and liability",
        `<p>The service is provided with commercially reasonable care. To the fullest extent permitted by law, MakTech is not liable for indirect or consequential losses, provider outages, or decisions made solely on AI output. Nothing in these Terms excludes liability that cannot be limited under applicable Bangladesh law.</p>`,
      ],
      [
        "10. Governing law",
        `<p>These Terms are governed by the laws of Bangladesh. Courts in Dhaka shall have non-exclusive jurisdiction, subject to mandatory consumer or data-protection rights.</p>`,
      ],
      [
        "11. Contact",
        `<p>Support: <a href="mailto:support@maktechgroup.com">support@maktechgroup.com</a> · Legal: <a href="mailto:legal@maktechgroup.com">legal@maktechgroup.com</a> · Privacy: <a href="mailto:privacy@maktechgroup.com">privacy@maktechgroup.com</a></p>
<p><strong>Version ${LEGAL_META.version} · Effective ${LEGAL_META.effectiveDate}</strong></p>`,
      ],
    ],
  },

  "data-deletion": {
    intro:
      "These Data Deletion Instructions explain how to remove data from <strong>MakAgent</strong> (MakTech Group). Use them for Meta App Review, user requests, and your own compliance programme. Production: <a href=\"https://makagent.maktechgroup.com\">https://makagent.maktechgroup.com</a> · Privacy contact: <a href=\"mailto:privacy@maktechgroup.com\">privacy@maktechgroup.com</a>.",
    sections: [
      [
        "1. Delete or reset data while signed in",
        `<ol>
<li>Sign in at <a href="https://makagent.maktechgroup.com/login">https://makagent.maktechgroup.com/login</a> as the workspace owner.</li>
<li>Open <strong>Settings → API &amp; data → Request data deletion</strong> (or use Demo controls / Settings reset for local demo workspaces).</li>
<li>Confirm the business and channels in scope and submit. Save the <strong>confirmation code</strong> shown on screen.</li>
<li>To stop new Meta access: open <strong>Connections</strong>, disconnect the channel, then revoke MakAgent / MakTech in Meta Business Suite or Facebook → Settings → Business integrations.</li>
</ol>
<p>You can also use the button below to clear <em>local browser demo data</em> only (does not delete server-side production records).</p><!--RESET-->`,
      ],
      [
        "2. Request deletion by email (no login)",
        `<p>Email <a href="mailto:privacy@maktechgroup.com">privacy@maktechgroup.com</a> from the account email on file with:</p>
<ul>
<li>subject line: <strong>Data deletion request — MakAgent</strong>;</li>
<li>business / workspace name;</li>
<li>account email;</li>
<li>Meta Page / Instagram / WhatsApp identifiers if known;</li>
<li>scope (entire workspace, specific channel, or specific conversation range).</li>
</ul>
<p><strong>Never</strong> include passwords, OTPs, PINs or access tokens. We may ask proportionate identity questions before acting.</p>`,
      ],
      [
        "3. Customer (end-user) requests",
        `<p>If you messaged a shop that uses MakAgent, contact that business first. They control the customer relationship. The business may instruct us to delete the SaaS copy of your conversation. Deleting our copy does not automatically erase copies held independently by Meta, payment providers, couriers or the merchant’s own systems.</p>`,
      ],
      [
        "4. What we delete",
        `<p>After verification, we delete or irreversibly anonymise, as requested and lawful:</p>
<ul>
<li>conversation content and customer profiles stored for the workspace;</li>
<li>notes, leads, orders and uploaded knowledge documents in scope;</li>
<li>channel connection records and encrypted tokens for disconnected assets;</li>
<li>account profile data when the whole workspace is closed.</li>
</ul>
<p>We may retain minimal security, billing or compliance records required by law, isolated from sales automation.</p>`,
      ],
      [
        "5. Timing and status",
        `<ul>
<li><strong>Target:</strong> complete verified deletion within <strong>30 days</strong>.</li>
<li><strong>Backups:</strong> purged within a further <strong>90 days</strong>.</li>
<li><strong>Status:</strong> email <a href="mailto:privacy@maktechgroup.com">privacy@maktechgroup.com</a> with your confirmation code. Status values: Pending, Processing, Completed.</li>
</ul>`,
      ],
      [
        "6. Meta / provider-triggered deletion callbacks",
        `<p>When Meta or another provider sends a signed data-deletion callback, our production backend verifies the signature, enqueues scoped deletion, returns a confirmation code, and exposes a status URL for that request. Configure the callback URL in the Meta app dashboard to your production HTTPS host, for example:</p>
<p><code>https://makagent.maktechgroup.com/api/meta/data-deletion</code> (exact path as registered in your deployment).</p>
<p>Staging callbacks, if used, must point only to <code>https://staging-makagent.maktechgroup.com</code>.</p>`,
      ],
      [
        "7. DNS and HTTPS notice for reviewers",
        `<p>Public policies and deletion instructions are served over HTTPS on:</p>
<ul>
<li><a href="https://makagent.maktechgroup.com/privacy">https://makagent.maktechgroup.com/privacy</a></li>
<li><a href="https://makagent.maktechgroup.com/terms">https://makagent.maktechgroup.com/terms</a></li>
<li><a href="https://makagent.maktechgroup.com/data-deletion">https://makagent.maktechgroup.com/data-deletion</a></li>
</ul>
<p>DNS for <code>makagent.maktechgroup.com</code> (and staging, when enabled) is controlled by MakTech Group. Support mailbox: <a href="mailto:support@maktechgroup.com">support@maktechgroup.com</a>.</p>
<p><strong>Version ${LEGAL_META.version} · Effective ${LEGAL_META.effectiveDate}</strong></p>`,
      ],
    ],
  },
};
