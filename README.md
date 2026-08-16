# VMWTEK Office

Internal operations tracker for an AI/Software agency. Single-admin web app covering clients, projects, negotiations, payments, expenses, reminders, and notes.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Drizzle ORM 0.45 on Neon Postgres (`neon-http` driver)
- Auth.js v5 (NextAuth) with a credentials provider and JWT sessions
- shadcn/ui + Tailwind CSS v4
- Zod v4 for server-action validation
- Vitest for unit + DB integration tests, Playwright for e2e smoke tests
- GitHub Actions CI (`pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm test`, `pnpm build`)

## Prerequisites

- Node.js >= 20.9
- pnpm (see `packageManager` in `package.json`)
- A Neon Postgres database (any Postgres-compatible endpoint works)

## Getting started

```bash
pnpm install
cp .env.example .env
```

Fill in `.env`:

- `DATABASE_URL` — your Neon connection string (the serverless driver uses the pooled or direct HTTP endpoint).
- `AUTH_SECRET` — generate with `openssl rand -base64 32`.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — the seeded admin login. `ADMIN_NAME` is optional.

Apply migrations and seed the admin, then start the dev server:

```bash
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://localhost:3000 and sign in with the admin credentials.

## Database & migrations

- Schema lives in `src/db/schema.ts`; migrations are managed by `drizzle-kit`.
- `pnpm db:generate` — generate a migration after schema changes.
- `pnpm db:migrate` — apply pending migrations (baseline is `drizzle/0000_blushing_cobalt_man.sql`).
- `pnpm db:seed` — idempotently upsert the admin user from `ADMIN_EMAIL`/`ADMIN_PASSWORD` (safe to run repeatedly).
- `pnpm db:studio` — open Drizzle Studio against `DATABASE_URL`.

The DB connection is a lazy `getDb()` singleton (`src/db/index.ts`); nothing connects at import time, so `next build` works without `DATABASE_URL`.

## Tests

```bash
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright e2e smoke tests
```

- **Unit tests** run without a database. The 6 DB integration tests in `src/lib/dashboard-aggregates.test.ts` use the real Neon dev DB and are skipped entirely when `DATABASE_URL` is absent, so CI stays green without secrets.
- **E2E** needs a `.env` with a migrated `DATABASE_URL` and the Playwright browser: `pnpm exec playwright install chromium`. The config's `webServer` builds the app and starts it on port 3100; `global-setup` re-seeds the admin and `global-teardown` deletes the `E2E-`-prefixed rows the run created. The smoke flow logs in once and exercises the main surfaces sequentially.

## Quality gates

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm format:check
pnpm build
```

`format` / `format:check` run Prettier over the whole repo, including markdown.

## Project structure

```
src/
  app/(auth)/login/        auth page
  app/(dashboard)/         dashboard layout and feature pages (clients, projects,
                           negotiations, payments, expenses, reminders, notes, settings)
  app/api/auth/            NextAuth route handlers
  actions/                 server actions, one file per domain
  components/              shadcn/ui primitives + feature components
  db/schema.ts             Drizzle schema
  db/index.ts              lazy getDb() singleton
  lib/                     zod schemas, money, dates, entity-exists helpers
  proxy.ts                 Next.js route guard (auth redirect)
drizzle/                   generated SQL migrations
e2e/                       Playwright setup, teardown, and smoke specs
```

## Feature overview

- Auth — single admin (credentials provider, JWT session cookie); all routes guarded by `src/proxy.ts`.
- Dashboard — 6 widgets (reminders, pending tasks, active projects, open negotiations, pending payments, money overview); dates render in the viewer's local timezone.
- Clients — CRM base for projects and money records.
- Projects — milestones, epics, and tasks; milestones can carry a payment link; a won negotiation converts to a project.
- Negotiations — pipeline with won/lost/open statuses and one-click conversion to a project.
- Payments — pending/partial/received lifecycle; `receivedDate` set on first receipt.
- Expenses — category + recurring (with frequency) support.
- Reminders — polymorphic (attach to any entity), repeat once/daily/weekly/monthly.
- Notes — polymorphic and searchable.
- Settings — profile and timezone preference.
- Branded 404 pages and loading skeletons throughout.
- Multi-currency amounts are labeled per currency; no conversion.

## Known tradeoffs

- JWT sessions cannot be revoked server-side (credentials provider in next-auth v5 always issues a JWT).
- The `neon-http` driver has no transactions — completing a repeating reminder and creating its next occurrence is non-atomic.
- A partially paid invoice is a status flag only; per-partial amounts are not tracked.
- No currency conversion; aggregates group by currency.
- Formatting is hardcoded to `en-US` (i18n deferred).

## Deployment notes (Vercel + Neon)

1. Create a Neon project and a production branch; set the 5 env vars (`DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`) on the Vercel project.
2. Before the first deploy, apply migrations against production: `pnpm db:migrate` with `DATABASE_URL` pointed at the production branch.
3. After deploying, run `pnpm db:seed` against production to create the admin.
4. Subsequent deploys are a normal Vercel build — no build-time DB access is required, so the build passes without `DATABASE_URL`.

A fuller runbook is available in `openspec/changes/vmtek-office/design.md` and the repo's OpenSpec docs.
