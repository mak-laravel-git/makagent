# Provider app setup checklist

**22 October 2026 · connection/identity scope only.** Provider dashboards, policy, permissions, quotas and supported API versions change. Verify them in your own app dashboard before granting real access. No provider apps/accounts were created or authorized on your behalf.

Use **INTEGRATIONS.md** to start the backend and create its real owner. Do not send credentials in chat. Put developer client secrets in the server `.env`/secret manager only; enter resource credentials only through the authenticated HTTPS hub.

## 1. LinkedIn

1. Create your developer app and complete its requested Page/owner verification.
2. Add **Sign In with LinkedIn using OpenID Connect**.
3. Configure `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`.
4. Register `<PUBLIC_BASE_URL>/api/oauth/linkedin/callback` exactly.
5. This adapter requests `openid profile email`, exchanges the authorization code server-side and reads `/v2/userinfo`; the ID token is not used as a SalesPilot login token. The official OIDC documentation specifies those scopes/endpoints. [3](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)
6. **Authorize account**, select the returned member and save. LinkedIn posting is not implemented and `w_member_social` is intentionally not requested; sharing is a separate LinkedIn product/permission. [5](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin)

## 2. Facebook & Instagram

1. Create a Meta app with the appropriate Facebook Login/business use case; supply app domains, published policies and app-role/test accounts as required by its dashboard.
2. Set `META_CLIENT_ID`, `META_CLIENT_SECRET`, and a **currently supported** `META_GRAPH_VERSION`.
3. Register `<PUBLIC_BASE_URL>/api/oauth/meta/callback`.
4. The adapter uses **Facebook Login**, requesting `pages_show_list`, `pages_read_engagement`, `instagram_basic`, then reads managed Pages and linked professional Instagram assets. Meta distinguishes the Facebook-login permission family from Instagram Login’s `instagram_business_*` permissions. [1](https://developers.facebook.com/docs/instagram-platform/overview/)
5. If your dashboard requires a Facebook Login for Business configuration ID, create a configuration using **user access tokens** with those permissions, set `META_LOGIN_CONFIG_ID`, and ensure it includes the intended scopes. When a configuration ID is set, its dashboard configuration controls requested access. Business Integration System User configurations are not this adapter’s flow. Meta documents the supported user-token permissions. [9](https://developers.facebook.com/documentation/facebook-login/facebook-login-for-business)
6. Grant Page assets and select the returned Pages/Instagram profiles in SalesPilot. Having a Page name in demo seeds does not grant access to any real Page.
7. This implements linked professional Instagram accounts through Facebook Login, not independent/direct Instagram Login. Your Page/account roles and provider-granted permissions must satisfy the current IG User requirements; some Business Manager role cases require additional access beyond this minimal adapter. [5](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/)
8. If the provider rejects access, check actual granted scopes, asset roles and review/business requirements rather than toggling a local “approved” label. No publishing or messaging scopes are requested.

## 3. YouTube

1. Create a Google Cloud project; enable **YouTube Data API v3** and configure its OAuth consent screen/audience.
2. Create a **Web application** OAuth client. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
3. Register `<PUBLIC_BASE_URL>/api/oauth/youtube/callback`; add your test Google account when required by the consent app’s testing status.
4. This adapter requests `https://www.googleapis.com/auth/youtube.readonly`, offline consent and a code with S256 PKCE, then lists `channels?part=snippet&mine=true`. Google documents the web-server flow and read-only channel scope. [1](https://developers.google.com/youtube/data/guides/auth/server-side-web-apps)
5. Select a returned channel. If no channel is returned, choose an appropriate Google/channel identity. `mine=true` requires the authenticated owner’s authorization. [5](https://developers.google.com/youtube/v3/docs/channels/list)
6. Additional channels/Google accounts can be authorized separately. Token refresh is on demand, not a scheduler. Consent testing/production verification and quota remain provider-controlled. Upload scope and upload logic are not included.

## 4. Threads

1. Create a Threads use case/app and the requested app-role/test-profile access in Meta’s dashboard.
2. Use the **Threads app ID/secret**, not the ordinary Facebook app ID/secret: `THREADS_CLIENT_ID`, `THREADS_CLIENT_SECRET`.
3. Register `<PUBLIC_BASE_URL>/api/oauth/threads/callback`.
4. Current implementation authorizes at `https://www.threads.com/oauth/authorize`, requests `threads_basic`, exchanges the code at `https://graph.threads.net/oauth/access_token`, then performs the long-lived token exchange and profile lookup. `THREADS_API_VERSION` defaults to `v1.0`; confirm support for your app. Meta’s Threads collection documents authorization/code exchange and the Threads-specific app credentials. [6](https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api)
5. Select the profile before saving. Permission names and actual access should be checked in the provider dashboard; `threads_basic` is an identity/content-read permission, not a publishing grant. [10](https://developers.facebook.com/docs/permissions)
6. Publishing, replies and insights permissions/features are not requested or implemented. A long-lived refresh can still fail after revocation/expiry; reconnect explicitly.

## 5. X (Twitter)

1. Create a developer project/app and enable OAuth 2.0 user authentication for a confidential **Web application**.
2. Set `X_CLIENT_ID`, `X_CLIENT_SECRET`, and register `<PUBLIC_BASE_URL>/api/oauth/x/callback`.
3. The implementation uses `https://x.com/i/oauth2/authorize`, S256 PKCE and `tweet.read users.read offline.access`; it uses the client secret only server-side during token exchange. X documents code/state/PKCE and the relevant scope model. [1](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code)
4. Confirm your account’s API tier/usage billing before authorizing. The backend reads `/2/users/me`; no post or media upload is sent.
5. Refresh is attempted on demand with a stored refresh grant. `tweet.write` is not requested, because this release has no real publishing endpoint.

## 6. Telegram

1. Create your own bot with Telegram’s official **BotFather**.
2. Add it to the intended channel/group as an administrator. For a channel it must have permission to post messages.
3. Obtain the group/channel ID or public `@username`.
4. Sign in to SalesPilot’s real workspace, choose **Add channel / group**, and enter the bot token plus target ID in the masked secure form.
5. The server calls `getMe`, `getChat`, and `getChatMember`; it requires an actual bot, a supported group/channel, and the administrator/posting permission check. Telegram documents those methods and bot-token API authentication. [1](https://core.telegram.org/bots/api)
6. No bot webhook, polling process or message is created by connecting. Rotate/revoke at BotFather if needed; local remove does not invalidate the token.

## 7. Discord

1. In the intended Discord channel, create an **incoming webhook** under its integration settings using an account with the required management permission.
2. Copy the `https://discord.com/api/webhooks/<id>/<token>` URL privately.
3. Choose **Add channel webhook** and submit the URL to the real backend. This verifies the webhook ID/type/channel using **Get Webhook with Token**, without executing it. Discord documents token-based webhook lookup separately from execution/deletion. [1](https://docs.discord.com/developers/resources/webhook)
4. The adapter accepts only official `discord.com` incoming webhook URLs, not arbitrary relay URLs or a Discord user token.
5. Local remove is not a remote webhook deletion. Rotate/delete the remote webhook through Discord when required. No message is sent by verification.

## 8. WordPress (self-hosted)

1. Use an HTTPS self-hosted WordPress site with REST API and Application Passwords enabled.
2. The server operator adds its **exact public hostname** to `WORDPRESS_ALLOWED_HOSTS`, then restarts the backend. Do not use a wildcard or private/loopback address.
3. In WordPress’s user profile, create a dedicated **Application Password** for SalesPilot; avoid your main interactive password. WordPress documents these as revocable per-application credentials. [3](https://developer.wordpress.org/advanced-administration/security/application-passwords/)
4. Choose **Add WordPress site**, enter the HTTPS URL, username and Application Password. The server calls `/wp-json/wp/v2/users/me?context=edit` with Basic authentication over verified TLS; Application Password REST authentication is documented by WordPress. [1](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/)
5. The backend rejects redirects, non-443 ports, credentials/query/fragment in the URL, non-allowlisted hosts and private/reserved DNS results. It pins the validated public address while retaining the hostname for TLS SNI/certificate verification.
6. WordPress.com OAuth, multisite routing edge cases, `?rest_route=`-only sites and publishing are not implemented. A successful identity check does not certify that this user can publish posts.
7. Revoke the Application Password in WordPress separately when removing access.

## 9. WhatsApp Business (extra to the screenshot)

1. Prepare the relevant Meta app/business assets, WABA and Cloud API business phone number through Meta.
2. Set `META_GRAPH_VERSION` on the server.
3. Create a system user and assign only the required app/business assets. Obtain a suitably permissioned token, WABA ID and phone-number ID; Meta documents the system-user token/asset setup and permission family. [1](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started) [5](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens/)
4. Choose **Add business phone** and submit those credentials through the masked real form. The implementation lists accessible WABA phone numbers and requires an exact phone-number-ID match.
5. This is **not Embedded Signup**, OTP registration, display-name review or a send-message test. Identity/asset verification does not prove production sending readiness. Provider requirements for managing other businesses can include Advanced Access. [9](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/overview)
6. Real messaging consent, templates, webhook receiver/signatures and messaging-window handling remain additional work; the demo’s sample policy guards are not a live backend implementation.

## Before you call this live

- Register your real HTTPS domain and callbacks; do not treat sample `.example` links as published legal pages.
- Keep secrets out of source control/logs/browser storage and use the production cookie/encryption settings.
- Verify the correct provider account identity and selected assets using your own test accounts.
- Exercise denial, session expiry, revoked grant, invalid token, refresh failure and provider outage in your own app’s testing mode.
- Check current reviews, permitted use, rate limits, fees and privacy/deletion obligations directly with each provider.
- Treat automated fixtures as implementation checks only. No live provider authorization has been performed in this delivery.
