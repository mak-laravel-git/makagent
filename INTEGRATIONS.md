# Real connection service — release 2.0

## What changed

The user explicitly requested **real connections** and a **new backend**, with no existing provider apps. This is an authorized scope extension to the earlier frontend-only demo; the historical SPEC.md is preserved, not silently rewritten.

The modern black/yellow design remains. **Connections** in the client sidebar opens `app/connections.html`. The original `app/channels.html` remains an explicitly simulated three-channel flow, reachable through **Demo channels**. Every other product module remains a prototype.

### Implemented now

| Platform | Real adapter behavior after operator/provider setup |
|---|---|
| LinkedIn | OAuth authorization-code exchange, bearer userinfo lookup and explicit member-profile selection. |
| Facebook & Instagram | Facebook user-token authorization, long-lived exchange, paginated Page/linked Instagram professional-account discovery and explicit asset selection. Optional Facebook Login for Business configuration ID for user-token configurations. |
| YouTube | Google web-server OAuth with S256 PKCE, offline grant, read-only owned-channel discovery and selection. |
| Threads | Threads authorization, short-to-long-lived token exchange and profile lookup. |
| X | Confidential-client authorization-code flow with S256 PKCE, profile lookup and offline grant. |
| Telegram | Verify bot, group/channel and administrator/posting permission through getMe/getChat/getChatMember. |
| Discord | Verify an official Discord incoming webhook’s identity/type/channel without executing it. |
| WordPress | Verify the authenticated user on a self-hosted, allowlisted public HTTPS site using an Application Password. |
| WhatsApp Business | Check that a supplied Cloud API phone-number ID belongs to the accessible WABA using a system-user token. Not Embedded Signup. |

A provider response must pass the implemented identity/permission checks before an encrypted connection is saved. OAuth credentials are staged encrypted for ten minutes; the user chooses assets before saving. No fixture, sample account or simulated success is available in the runtime adapters.

**Not connected yet:** no developer credentials, real account grants, registered callback domain or provider approvals were supplied. The delivered app therefore starts with **no owner account and zero connected accounts**. It does not call providers until an authenticated user deliberately starts an action. Automated tests use mocked upstream responses and are not proof of a live authorization.

### Not implemented

Publishing/sending, media upload, inbox/comment synchronization, durable jobs, webhook subscriptions/receivers, delivery receipts, provider-side grant revocation, WhatsApp Embedded Signup, organization-page LinkedIn posting, direct Instagram Login, WordPress.com OAuth, team sharing/RBAC, MFA/SSO, self-service signup/password reset/email verification, payment integration and a production compliance program. Existing simulated Posts/Inbox/AI/Monitoring are **not** wired to the live tokens.

## Start locally

Requires Python **3.12 or 3.13**. No Node/npm or frontend build is needed. Unlike the demo, real connections cannot run by double-clicking HTML or with a Python static-only server. **Never run a generic static server over a configured tree containing `.env` or private credentials; use the whitelisted backend instead.**

```sh
cd MakAgent
python3 -m venv .venv
# macOS/Linux:
. .venv/bin/activate
# Windows PowerShell instead: .venv\Scripts\Activate.ps1
python3 -m pip install -r backend/requirements.txt
# Copy .env.example to .env (Windows: copy .env.example .env)
cp .env.example .env
python3 -m backend.manage init
python3 -m backend.manage create-owner --email you@example.com
# Enter a UNIQUE 14+ character passphrase at the hidden prompt.
python3 -m uvicorn backend.app:create_app --factory --host 0.0.0.0 --port 8082 --no-access-log
```

Open **http://localhost:8082** in its own browser tab, not an embedded preview iframe. Third-party login frames and cookie policies may block OAuth/session use in an embedded viewer. It opens the real Connections hub. Sign in with the owner you just created, not a demo login button. Multiple operator-created accounts have separate private connection workspaces; accounts do not share records or roles. There is no public signup or default admin password.

Development permits plain HTTP only on loopback. The local server also accepts the Arena preview host for inspecting the UI; third-party OAuth still uses `PUBLIC_BASE_URL`, not an automatically guessed preview URL. **For live credentials on a public host, configure production HTTPS first.** Do not send secrets through chat.

### Bangla quick start

১. প্রজেক্ট ফোল্ডারে ওপরের install কমান্ড চালান। ২. `create-owner` দিয়ে নিজের account/passphrase তৈরি করুন। ৩. backend চালিয়ে `http://localhost:8082` খুলুন। ৪. প্রতিটি platform-এর developer app নিজে তৈরি করে server-এর `.env`-এ client ID/secret বসান; chat-এ পাঠাবেন না। ৫. public HTTPS callback ঠিক করে provider-এর অনুমতি দিন। ৬. app-এ পাওয়া account নির্বাচন করে save করুন। Configure/verify না হলে “Connected” দেখাবে না।

## Credentials and configuration

Copy `.env.example` into the project root. The populated `.env` is **never served** or included in the deliverable. Environment variables override this local file. Do not put credentials in `data.js`, localStorage, URLs, screenshots, command history or frontend config.

- `APP_ENV=development` for localhost only; `production` for public use.
- `PUBLIC_BASE_URL`: exact external origin, no path/trailing query. It determines all callbacks. Production requires HTTPS.
- `TOKEN_ENCRYPTION_KEY`: stable Fernet key, required in production. Generate locally:

  ```sh
  python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
  ```

  Put the output directly in the protected server environment, not in chat. Back it up separately from the database. Changing/deleting the key makes old ciphertext unreadable; this release does not provide automatic key rotation/migration.
- `MAKAGENT_DATA_DIR`: private data directory. Default `~/.local/share/makagent-live`. SQLite/automatic development key are outside the served source tree. Directory/key permissions are restricted where supported.
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`.
- `META_CLIENT_ID`, `META_CLIENT_SECRET`, `META_GRAPH_VERSION`; optional `META_LOGIN_CONFIG_ID` if required by the app’s user-token Business Login configuration. Select a supported Graph version from the app dashboard; none is guessed.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for a Web application OAuth client with YouTube Data API enabled.
- `THREADS_CLIENT_ID`, `THREADS_CLIENT_SECRET`; optional `THREADS_API_VERSION` (default `v1.0`, operator must verify support).
- `X_CLIENT_ID`, `X_CLIENT_SECRET` for a confidential Web application, not an app-only bearer token.
- `WORDPRESS_ALLOWED_HOSTS`: comma-separated exact public hostnames. No wildcard or implicit allowlisting of whatever a user submits.

Telegram bot tokens, Discord webhook URLs, WordPress Application Passwords and WhatsApp system-user credentials are entered **only in the authenticated, same-origin secure form**, verified server-side and encrypted in the database. Password fields are masked, and submitted secrets are cleared when the dialog completes/closes. Browser password-manager behavior is user controlled.

Restart the backend after environment changes, then refresh the Connections page. Its authenticated setup guide shows exact missing variable names and callback, never secret values.

## Callback registration

For `PUBLIC_BASE_URL=https://your-domain.example`, register the relevant callback **exactly**:

```text
https://your-domain.example/api/oauth/linkedin/callback
https://your-domain.example/api/oauth/meta/callback
https://your-domain.example/api/oauth/youtube/callback
https://your-domain.example/api/oauth/threads/callback
https://your-domain.example/api/oauth/x/callback
```

Use localhost callbacks only where that provider explicitly allows the exact local redirect. Many providers require public HTTPS. A preview/tunnel is not automatically stable or acceptable to a provider. Do not alternate localhost/127.0.0.1, ports or preview domains during an OAuth session; cookies/origins must match.

## Deployment

A public domain, DNS and hosting were **not purchased or provisioned**. The supplied Docker files are optional and have not been run in this environment; local Python execution has been tested. Budget, credentials and provider reviews remain yours to authorize.

For a self-hosted deployment:

1. Provision a supported host you control; protect the server/operator account. Do not expose an unconfigured development server publicly.
2. Set `APP_ENV=production`, a real HTTPS `PUBLIC_BASE_URL` and a stable `TOKEN_ENCRYPTION_KEY`. Populate only the provider apps you want to enable.
3. Use a persistent private data volume and a single application worker. Put a trusted HTTPS reverse proxy in front of uvicorn; pass the original Host and trusted `X-Forwarded-Proto: https`.
4. Restrict trusted proxy addresses; do not blindly trust forwarded headers from public clients. A Docker proxy’s IP may need explicit uvicorn `--forwarded-allow-ips` / `FORWARDED_ALLOW_IPS` configuration; keep loopback `127.0.0.1` included for the container’s local health probe. Direct local reverse proxies use uvicorn’s default loopback trust.
5. Avoid logging OAuth query strings, Authorization headers, credentials or Telegram/Discord token-bearing paths. The supplied server command disables access logs; configure the proxy similarly.
6. Create the operator account in the deployed data volume, then register exact callbacks and verify with your own test assets before expanding access.
7. Validate backup/restore, TLS, dependency advisories, provider permissions, privacy notices and deletion policy before using real customer data. See SECURITY.md.

Optional Docker local workflow:

```sh
cp .env.example .env
# Fill .env, using development only for localhost.
docker compose up --build -d
docker compose exec web python -m backend.manage create-owner --email you@example.com
```

The compose service binds **127.0.0.1:8082**, not a public interface, and stores data in a named volume. For production, configure your reverse proxy and HTTPS first. The container runs as a non-root user. Losing the data volume/key loses access to stored connections.

## Connection lifecycle

- **Missing configuration:** “Setup required”; start action fails without saving anything.
- **Authorization:** random, single-use state is bound to the server user **and** session, with a ten-minute TTL. Google/X use S256 PKCE; confidential app secrets stay server-side.
- **Choose assets:** returned asset metadata only is shown; credentials stay encrypted. Cancel/expiry removes staged local credentials, but provider consent may still exist. Replays or unreturned asset IDs are rejected.
- **Verify again:** performs a real provider read. Google/X can renew an expired access token using a saved refresh grant; Threads can attempt long-lived refresh. LinkedIn/Meta expiration requires explicit reauthorization. There is no unattended refresh scheduler.
- **Verified:** a point-in-time identity/permission check succeeded. Unknown expiry remains “Not supplied by provider”, not “never expires”. Facebook Page expiry uses the parent grant conservatively. Provider revocation/rate limits may invalidate a later action.
- **Remove locally:** deletes this workspace’s encrypted record. It **does not** revoke a whole provider grant, delete a Discord webhook, revoke an Application Password or reset a bot token. Those operations could affect other linked assets and must be done explicitly at the provider.
- **Demo reset/logout/impersonation:** has no authority over server credentials. Use the real hub Sign out button. Neither demo Reset nor seed restore erases live accounts.

Discovery safety limits: Meta scans at most ten pages of 50 Page records per authorization, then asks for a narrower asset grant; YouTube returns up to 50 channels per grant; WhatsApp scans up to ten 50-number pages when locating the supplied phone. The UI supports multiple separately authorized accounts; there is no claim of unlimited upstream/API quota.

## Operations

- Reset a server password: `python3 -m backend.manage set-password --email you@example.com`. This revokes all server sessions and pending authorizations for that user; live connections remain encrypted. There is no email recovery workflow.
- Create another isolated owner account: repeat `create-owner`. There is no real admin-role switch or shared-team access.
- Back up the database **and** encryption key using encrypted, access-controlled backups; test restore offline. Local file deletion is not a processor/backup erasure policy.
- For a clean disposable development instance only, stop the server and remove its private data directory. This erases all users, credentials and activity; never do this to retained production data.
- SQLite and per-process verification locks target a small single-node/single-worker installation. Distributed jobs, HA/multiple workers and larger SaaS team/RBAC requirements need a redesigned persistence/coordination layer.

## Tests and verification limits

```sh
python3 tests/backend.test.py
# Optional browser QA also needs Playwright/Chromium; serve sources on 8082:
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/connections-ui.test.py
```

The original browser regression scripts target a temporary static service on port 8080. Run those only in a disposable source copy with **no populated `.env`, private data or live credentials**; stop that static service afterward. The production/backend source whitelist is not provided by `python -m http.server`.

The backend tests execute real HTTP routing, password/session/CSRF/state validation and real SQLite/Fernet/Argon2 behavior with **mocked provider HTTP responses**. Browser tests bridge Chromium requests through that ASGI app with the same controlled upstream fixtures. They cover adapters/selection, isolation, encryption, refresh/failure, local removal and truthful offline mode. No real Meta/Google/LinkedIn/Threads/X/Telegram/Discord/WordPress credentials were used, and live provider authorization was not verified. Never deploy a test fixture as the service; normal startup `backend.app:create_app` does not install mocks.

Provider setup instructions and official references are in **PROVIDER_SETUP.md**. This is implemented connection infrastructure, **not a production/security certification or a promise of provider approval**.
