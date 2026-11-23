# SalesPilot AI — Next.js app (by MakTech)

The original HTML prototype in the parent folder, rebuilt with **Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4**,
styled to match [maktechgroup.com](https://maktechgroup.com).

## Run it

```sh
cd web
npm install
npm run dev        # http://localhost:3100
npm run build && npm start
```

Log in with **Enter as Client** (first run walks through the 7-step onboarding) or **Enter as Admin**. Everything runs
in the browser — state is persisted in `localStorage` (`salespilot.next.v3`); use *Demo controls* or Settings → Reset to start over.

The optional Python backend (real Connections hub, `backend/`) is proxied same-origin: `/api/*` → `BACKEND_URL`
(default `http://localhost:8082`). Without it, **/app/connections** shows an honest “backend not running” state.

## Design system

| Token | Value | Source |
|---|---|---|
| Canvas | `#1C1C1C` (deep `#141414`) | maktechgroup.com body |
| Surface / raised | `#1E1E1E` / `#29292D` | MakTech cards |
| Brand | `#FF6533` (hover `#FF7A4D`) | MakTech CTA colour |
| Text | `#FFFFFF` · `#B0B0B0` · `#888` | MakTech copy |
| Light bands | `#FFFFFF` / `#F4F4F4` (`.surface-light`) | MakTech alternating sections |
| Font | **DM Sans** (+ DM Mono, Noto Sans Bengali fallback) | maktechgroup.com |
| Container | **1380px** (`.container-x`, app shell `max-w-[1380px]`) | requested |

Tokens live in `src/app/globals.css` (`@theme inline`). Dark is the default; a light theme is available from the theme toggle.
Admin screens swap the accent to blue (`[data-role="admin"]`) so the two roles can never be confused.

## Layout

```
src/
  app/
    (public)/        landing, pricing, privacy, terms, data-deletion
    (auth)/          login, signup, forgot-password
    onboarding/      7-step setup wizard
    app/*            client workspace (14 pages + real Connections hub)
    admin/*          admin workspace (14 pages, clients/[id] detail)
  components/
    ui.tsx           Button, Card, Modal, Drawer, Tabs, Switch, Table …
    site/            header, footer, hero chat, FAQ
    app/             shell, demo controls, connect flows, agent chat
    charts/          Recharts wrappers (theme-aware)
  lib/
    data.ts          deterministic seed (ported from assets/js/data.js)
    store.ts         localStorage store + useStore() hook
    mock-agent.ts    rule-based Bangla / Banglish / English agent
    actions.ts       conversation / order helpers
    admin.ts         derived admin data + audit helper
```

The original HTML/JS files are untouched and remain the reference for behaviour.
