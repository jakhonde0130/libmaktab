# ILMS — Deployment

## Overview

- **Frontend** (`frontend/`) — static Vite build, deploy to Vercel (or any static host).
- **Backend** (`backend/`) — Node/Express server, deploy to a Node host (Railway, Render, Fly.io, or a VPS). Not deployable to Vercel serverless as-is (uses long-lived multer uploads and a persistent Express app).
- **Database/Auth/Storage** — Supabase project `fhlsffsnoicxyqujqeqe` (already provisioned and migrated).

## Backend

### Build

```bash
cd backend
pnpm build   # tsc -> dist/, then tsc-alias rewrites @/ path aliases to relative imports
pnpm start   # node dist/server.js
```

`pnpm build` uses `tsconfig.build.json` (rootDir: src, only compiles `src/`) so `dist/server.js` lands at the path `start` expects. The plain `tsconfig.json` (includes `src` + `scripts`) is only for editor/typecheck — using it for the build would put `server.js` under `dist/src/` instead.

### Environment variables (production)

Set these on the hosting platform — do not commit `.env`:

| Variable | Notes |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | Platform-assigned, or `4000` |
| `CLIENT_ORIGIN` | Production frontend URL (CORS) — e.g. `https://your-app.vercel.app` |
| `SUPABASE_URL` | `https://fhlsffsnoicxyqujqeqe.supabase.co` |
| `SUPABASE_ANON_KEY` | From Supabase Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase Project Settings → API — **secret**, server-only |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Optional, defaults are sane |
| `TELEGRAM_BOT_TOKEN`, `SMTP_*` | Optional, only needed once notification providers are wired |

### First deploy checklist

1. Push the repo to the host, set the build command to `pnpm --filter ./backend build` and start command to `pnpm --filter ./backend start`.
2. Set the environment variables above.
3. Confirm `GET /health` responds `{"status":"ok"}`.
4. Update `CLIENT_ORIGIN` once the frontend's production URL is known (redeploy/restart after changing).

## Frontend

### Build

```bash
cd frontend
pnpm build   # outputs to dist/
```

### Environment variables (production)

| Variable | Notes |
|---|---|
| `VITE_SUPABASE_URL` | Same Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Same anon/publishable key |
| `VITE_API_URL` | Production backend URL + `/api/v1`, e.g. `https://api.your-domain.com/api/v1` |

### Vercel

`frontend/vercel.json` adds the SPA rewrite (`/* -> /index.html`) React Router's client-side routing needs. In the Vercel project settings:

- Root directory: `frontend`
- Framework preset: Vite
- Build command: `pnpm build`
- Output directory: `dist`
- Environment variables: the three `VITE_*` values above

## Supabase (already provisioned)

Schema, RLS policies, and the `book-files` storage bucket are live on the project referenced above. Migrations live in `supabase/migrations/` and were applied manually via the SQL Editor during development, since this environment couldn't reach the Supabase CLI's direct DB connection (IPv6-only) or your own CLI session (logged into a different account).

For future changes, once you have Supabase CLI access to this project (`supabase login`, `supabase link --project-ref fhlsffsnoicxyqujqeqe`):

```bash
supabase db push                # apply any new migrations in supabase/migrations/
supabase gen types typescript --project-id fhlsffsnoicxyqujqeqe > frontend/src/types/database.ts
cp frontend/src/types/database.ts backend/src/types/database.ts
```

Regenerating types lets you drop the `Database = Record<string, unknown>` placeholder noted in `backend/src/lib/supabase.ts` and get full type-safety on `.from(...)` calls.

## Post-deploy smoke test

1. `GET https://<backend>/health` → `200`
2. Load the frontend, sign in with the Director account.
3. Confirm the dashboard loads real numbers (not stuck on skeletons — that means the frontend can't reach the backend, check `VITE_API_URL` / `CLIENT_ORIGIN`).
4. Create a test book, issue/return it to a test reader, then delete both — confirms the full write path (API → RLS → Postgres) end-to-end.
