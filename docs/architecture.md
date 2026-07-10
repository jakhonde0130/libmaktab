# ILMS — System Architecture

## Overview

ILMS (Integrated Library Management System) is a full-stack library
management platform modeled on the workflows of Koha, SLiMS, Evergreen, and
Alma: bibliographic cataloging, multi-copy circulation, an OPAC, an
electronic library, reporting, and RBAC-driven administration.

## Monorepo layout

```
Lib_music/
├── frontend/          React 19 + Vite SPA (staff UI + OPAC)
├── backend/            Express REST API (repository pattern over Supabase)
├── supabase/           SQL migrations, RLS policies, seed data
├── docs/                Architecture notes, ER diagram
└── pnpm-workspace.yaml  pnpm workspace root
```

`pnpm dev` runs both apps in parallel via workspace filters.

## Request flow

```
Browser (React SPA)
  │
  ├─ Supabase Auth (sign-in, session, JWT refresh) ──────────► Supabase Auth
  │
  └─ REST calls, Bearer <JWT> ──► Express API (backend/) ──► Supabase (Postgres via RLS-scoped client)
                                                          └─► Supabase Storage (electronic library files)
```

- **Auth** happens directly against Supabase from the browser (`frontend/src/lib/supabase.ts`).
  The SPA never talks to Postgres directly — all data operations go through
  the Express API so validation, business rules (loan limits, reservation
  queues, fines) and RLS-scoped queries live in one place.
- **Every API request** carries the user's Supabase JWT. `backend/src/middleware/auth.ts`
  verifies it, resolves `req.user` (id, email, role), and builds a
  **request-scoped Supabase client** (`createRequestClient`) authenticated as
  that user — so Postgres Row Level Security policies apply exactly as they
  would for a direct client query. The service-role client (`supabaseAdmin`)
  is reserved for trusted server-only operations and must never be used to
  answer a normal user-scoped request.
- **Roles** (`director`, `administrator`, `librarian`, `operator`, `teacher`,
  `reader`) are stored in Supabase `auth.users.app_metadata.role` and mirrored
  into the `roles`/`permissions` tables (Phase 2/3) for fine-grained RLS and
  route guards (`requireRole` middleware, `<ProtectedRoute roles=...>` on the
  frontend).

## Backend structure (repository pattern)

Each domain lives in its own module under `backend/src/modules/<name>/`:

```
modules/books/
├── books.routes.ts       Express router — thin, delegates to service
├── books.controller.ts   Request/response shaping, calls service
├── books.service.ts      Business rules (validation beyond schema, orchestration)
├── books.repository.ts   Only place that talks to Supabase for this domain
└── books.schema.ts       Zod schemas for request validation
```

Routers are mounted centrally in `backend/src/routes.ts`. Cross-cutting
concerns (`helmet`, CORS, rate limiting, compression, structured logging via
`pino`, centralized error handling) are wired once in `backend/src/app.ts`.

## Frontend structure

```
frontend/src/
├── app/
│   ├── providers/    Theme (next-themes), TanStack Query, Auth bootstrap
│   └── router/        React Router route tree + role-aware route guard
├── modules/<name>/    One folder per domain (books, readers, circulation, ...)
│   ├── components/    Module-local UI
│   ├── hooks/         TanStack Query hooks for this module's endpoints
│   ├── api/           Typed wrappers around apiClient for this module
│   └── types/         Module-local types
├── components/
│   ├── ui/             shadcn/ui primitives
│   ├── layout/         AppShell (sidebar/topbar), nav config, theme toggle
│   └── shared/          Cross-module reusable components
├── stores/              Zustand stores (auth session/role)
└── lib/                  supabase client, apiClient (fetch wrapper), utils
```

State separation: **TanStack Query** owns all server state (fetched via
`apiClient`, cached, invalidated on mutation). **Zustand** owns only client
state that doesn't belong to the server cache — currently just the
authenticated session/role. Forms use **React Hook Form + Zod**, validated
with the same schema shape the backend expects.

## Why a separate Express API instead of calling Supabase directly from React

The spec calls for Node.js/Express as the backend of record, and library
circulation has business rules that don't map cleanly onto RLS alone (loan
limits per role, reservation queue ordering, fine calculation, overdue
notification fan-out to SMS/Email/Telegram). Centralizing those in a
service layer keeps the rules in one auditable place and gives us a stable
REST surface (`/api/v1/...`) independent of the underlying schema.

## Environments

- `backend/.env` — `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, plus rate-limit and notification provider config. Validated at boot with Zod (`backend/src/config/env.ts`) — the server refuses to start with missing/invalid config.
- `frontend/.env.local` — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`. Validated at runtime with Zod (`frontend/src/config/env.ts`).

## Build status

See the task list in-session for phase-by-phase progress. As of Phase 1:
monorepo scaffold, backend bootstrap (Express, middleware, health check),
and the frontend app shell (theming, routing, auth-gated layout, dashboard
placeholder with loading skeletons) are in place and verified (`pnpm build`,
`pnpm typecheck` on both workspaces; backend `/health` and `/api/v1/`
smoke-tested).
