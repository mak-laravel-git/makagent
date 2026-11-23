# Connection service security boundaries

## Real protections implemented

- Operator-created users; Argon2id password hashes, unique 14–256 character passphrases, no default password/public signup, account/IP login rate limits.
- Random server sessions with SHA-256-hashed session identifiers in SQLite, 12-hour expiry, HTTP-only SameSite=Lax cookies. Production uses Secure `__Host-` cookies with path `/` and no Domain attribute.
- Origin checking plus session-bound synchronizer CSRF token on mutations. No permissive CORS. Auth/session/config/token-bearing responses have `Cache-Control: no-store`.
- OAuth state is random, stored hashed, single-use, session/user/provider-bound and expires in ten minutes. Google/X use S256 PKCE. Authorization codes and secrets never enter the demo Store.
- Provider tokens, resource credentials, pending selections and PKCE material encrypted with Fernet. The database uses parameterized SQL and user-ID-scoped reads/mutations. One user cannot select, inspect, verify or remove another user’s connections.
- Explicit asset selection; an upstream error, unknown asset or failed permission/identity check never creates a connected record.
- Fixed HTTPS provider endpoints, no redirect following or arbitrary outbound provider URLs. Bounded timeouts/response sizes and request bodies.
- WordPress exact hostname allowlist, HTTPS/443 requirement, public-address validation of all DNS results, pinned outbound address, original Host and TLS SNI/certificate verification. Cloud metadata, private/reserved destinations, URL credentials and redirects are rejected.
- Submitted secret input is not echoed by validation/error responses. Normal startup disables access logs; application responses never serialize token ciphertext/plaintext. Frontend secrets are masked and never saved in localStorage/sessionStorage.
- Own-workspace activity events omit credentials. Local removal deletes the stored record; verification cannot resurrect a concurrently removed record. Verification locks serialize same-record checks in the supported single-worker process.
- `.env`, backend source, key/database files and deployment configs are not exposed by the HTTP static-file whitelist. Static prototype HTML/assets remain intentionally public.

## Important limits

This is **not** an independently reviewed, production-certified SaaS security system. No live provider credentials were supplied; automated provider calls use test transports, not live grants.

The real API is a small **single-node/single-worker** service with one private workspace per operator-created account. It has no team roles, cross-owner sharing, SSO, MFA, self-service recovery, account email verification, admin UI, billing, KMS/HSM, distributed rate limiter, distributed refresh locks, job queue, immutable audit, automated encrypted backups or disaster-recovery service. SQLite/local locks should not be scaled to multiple workers without new coordination/persistence.

Encryption protects stored credential contents, not an already compromised running host. A process with the key/database can decrypt credentials. Protect both; rotating the key requires a planned migration not supplied here. Database backups may retain old encrypted records. Logical local deletion is not a claim of physical/backup/provider erasure.

Provider refresh is on demand; some grants require explicit reconnection. “Verified” is a point-in-time result and can become stale. Permission review, token expiry/rotation, platform changes, costs and TLS/DNS/provider availability are controlled externally.

A local credential removal does not revoke consent or a shared provider token and does not delete remote bots/webhooks/Application Passwords. Revocation is deliberately not automated because it can affect other assets; follow the provider’s settings and your retention/privacy procedures.

Other frontend modules remain an **editable localStorage demo**. They have no production authentication/authorization, do not use these real tokens and must not handle real customer data. Demo roles/admin impersonation/reset cannot authorize live API actions. The new hub labels this distinction and uses a separate server login; a fake “Admin” role is never accepted as API authentication.

The UI uses the existing permitted Tailwind/Lucide/Google Fonts CDNs. These are external supply-chain/privacy dependencies, not an offline or strict CSP/SRI bundle. A production security/supply-chain review and an appropriately tested CSP are still required. Production adds frame-ancestors 'self', object-src 'none' and base-uri 'self'; development preview embedding is permitted. This is not a full script/content CSP or a security certification.

## Deployment checklist

1. Use a real HTTPS domain and `APP_ENV=production`; never expose development/plaintext credential forms publicly.
2. Put a trusted TLS reverse proxy in front; restrict forwarded-header trust and direct backend access. Do not log query strings, credentials, Authorization headers or token-containing paths.
3. Configure a stable production encryption key outside the database, with least-privilege file/secret access and encrypted backups.
4. Use unique owner credentials, patch dependencies, restrict operator/server access and monitor resource usage/errors.
5. Scope provider apps/grants narrowly, use testing assets first, register exact callbacks and publish/review real privacy/deletion policies before onboarding others.
6. Test backup/restore, user isolation, provider denial/revocation, TLS/proxy behavior and incident recovery in the actual hosting environment.
7. Conduct human security/accessibility/privacy review and a threat model before production. No public deployment, paid hosting, provider approval or payment was performed by this assistant.

## Suspected secret leak

Immediately revoke/rotate the credential at its provider; local removal alone is insufficient. Stop the affected service if needed, revoke sessions with the operator password-reset command, investigate logs/backups/operator access, and restore only after a verified repair. Do not paste the leaked secret into chat, a bug report or screenshots.
