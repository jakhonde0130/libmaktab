# ILMS — Integrated Library Management System

Enterprise library management platform (cataloging, multi-copy circulation,
OPAC, electronic library, reporting, RBAC) built with React 19 + Vite on the
frontend and Express + Supabase (Postgres, Auth, Storage, RLS) on the
backend. See [`docs/architecture.md`](docs/architecture.md) for the full
system design.

## Prerequisites

- Node.js >= 20
- pnpm (`corepack enable` or `npm i -g pnpm`)
- A Supabase project (free tier is enough to start)

## Setup

```bash
pnpm install

# Backend
cp backend/.env.example backend/.env
# fill in SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY

# Frontend
cp frontend/.env.example frontend/.env.local
# fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
```

## Development

```bash
pnpm dev             # runs frontend (5173) + backend (4000) together
pnpm dev:frontend    # frontend only
pnpm dev:backend     # backend only
```

## Quality checks

```bash
pnpm typecheck       # both workspaces
pnpm lint            # both workspaces
pnpm build           # production build, both workspaces
```

## Project structure

```
frontend/   React 19 + Vite + TailwindCSS + shadcn/ui SPA
backend/    Express REST API, repository pattern over Supabase
supabase/   SQL migrations, RLS policies
docs/       Architecture and schema documentation
```
