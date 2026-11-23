# SalesPilot AI (makagent)

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4

## Run locally

```sh
npm install
npm run dev        # http://localhost:3100
npm run build && npm start   # http://localhost:3000
```

Log in with **Enter as Client** or **Enter as Admin**. Demo state lives in `localStorage` (`salespilot.next.v3`).

## Optional Python backend

Real Connections hub lives in `backend/`. Proxied same-origin: `/api/*` → `BACKEND_URL` (default `http://localhost:8082`).

```sh
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app:create_app --factory --host 0.0.0.0 --port 8082 --no-access-log
```

See [INTEGRATIONS.md](INTEGRATIONS.md), [PROVIDER_SETUP.md](PROVIDER_SETUP.md), and [SECURITY.md](SECURITY.md).

## Coolify

- Base Directory: `/`
- Install: `npm install`
- Build: `npm run build`
- Start: `npm run start`
- Port: `3000`
- Do **not** use `php artisan migrate` (this is not Laravel)
